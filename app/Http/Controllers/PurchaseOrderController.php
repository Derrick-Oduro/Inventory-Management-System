<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\InventoryItem;
use App\Models\Supplier;
use App\Models\ItemStock;
use App\Models\Location;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Services\InventoryNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function __construct(private readonly InventoryNotificationService $notificationService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::query()
            ->with([
                'supplier:id,company_name',
                'creator:id,name',
                'submittedBy:id,name',
                'approvedBy:id,name',
                'items.item:id,name,sku',
            ])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->integer('supplier_id'));
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->date('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->date('to_date'));
        }

        return response()->json($query->get());
    }

    public function show(int $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::query()
            ->with([
                'supplier',
                'creator:id,name',
                'submittedBy:id,name',
                'approvedBy:id,name',
                'items.item:id,name,sku,cost_price',
            ])
            ->findOrFail($id);

        return response()->json($purchaseOrder);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_delivery_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // Ensure selected supplier is active
        $supplier = Supplier::find($validated['supplier_id']);
        if (!$supplier || !$supplier->is_active) {
            return response()->json(['message' => 'Selected supplier is not active.'], 422);
        }

        $purchaseOrder = DB::transaction(function () use ($validated) {
            $po = PurchaseOrder::create([
                'po_number' => $this->nextPoNumber(),
                'supplier_id' => $validated['supplier_id'],
                'status' => PurchaseOrder::STATUS_DRAFT,
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $line) {
                $orderedQuantity = (float) $line['quantity'];
                $unitPrice = (float) $line['unit_price'];

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'item_id' => $line['item_id'],
                    'ordered_quantity' => $orderedQuantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $orderedQuantity * $unitPrice,
                ]);
            }

            $po->recalculateTotal();
            return $po;
        });

        AuditLog::log(
            'PO_CREATE',
            "Created purchase order {$purchaseOrder->po_number}",
            'PurchaseOrder',
            $purchaseOrder->id,
            null,
            $purchaseOrder->toArray()
        );

        return response()->json($purchaseOrder->load(['supplier', 'items.item']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::with('items')->findOrFail($id);

        if ($purchaseOrder->status !== PurchaseOrder::STATUS_DRAFT) {
            return response()->json(['message' => 'Only draft purchase orders can be edited.'], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_delivery_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // Ensure selected supplier is active when updating
        $supplier = Supplier::find($validated['supplier_id']);
        if (!$supplier || !$supplier->is_active) {
            return response()->json(['message' => 'Selected supplier is not active.'], 422);
        }

        DB::transaction(function () use ($purchaseOrder, $validated) {
            $purchaseOrder->update([
                'supplier_id' => $validated['supplier_id'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $purchaseOrder->items()->delete();

            foreach ($validated['items'] as $line) {
                $orderedQuantity = (float) $line['quantity'];
                $unitPrice = (float) $line['unit_price'];

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'item_id' => $line['item_id'],
                    'ordered_quantity' => $orderedQuantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $orderedQuantity * $unitPrice,
                ]);
            }

            $purchaseOrder->recalculateTotal();
        });

        AuditLog::log(
            'PO_UPDATE',
            "Updated purchase order {$purchaseOrder->po_number}",
            'PurchaseOrder',
            $purchaseOrder->id,
            null,
            $purchaseOrder->fresh()->toArray()
        );

        return response()->json($purchaseOrder->fresh(['supplier', 'items.item']));
    }

    public function submit(int $id): JsonResponse
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);

        if ($purchaseOrder->status !== PurchaseOrder::STATUS_DRAFT) {
            return response()->json(['message' => 'Only draft purchase orders can be submitted.'], 422);
        }

        $purchaseOrder->update([
            'status' => PurchaseOrder::STATUS_SUBMITTED,
            'submitted_by' => Auth::id(),
        ]);

        AuditLog::log(
            'PO_SUBMIT',
            "Submitted purchase order {$purchaseOrder->po_number}",
            'PurchaseOrder',
            $purchaseOrder->id,
            ['status' => PurchaseOrder::STATUS_DRAFT],
            ['status' => PurchaseOrder::STATUS_SUBMITTED]
        );

        return response()->json($purchaseOrder->fresh(['supplier', 'items.item']));
    }

    public function approve(int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Only Admin or Inventory Manager can approve purchase orders.'], 403);
        }

        $purchaseOrder = PurchaseOrder::findOrFail($id);

        if ($purchaseOrder->status !== PurchaseOrder::STATUS_SUBMITTED) {
            return response()->json(['message' => 'Only submitted purchase orders can be approved.'], 422);
        }

        $purchaseOrder->update([
            'status' => PurchaseOrder::STATUS_APPROVED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        $this->notificationService->notifyUsers('po_approved', [
            'title' => 'Purchase Order Approved',
            'message' => "{$purchaseOrder->po_number} has been approved.",
            'action_url' => '/purchase-orders',
            'icon' => 'inventory',
            'metadata' => ['purchase_order_id' => $purchaseOrder->id],
        ]);

        AuditLog::log(
            'PO_APPROVE',
            "Approved purchase order {$purchaseOrder->po_number}",
            'PurchaseOrder',
            $purchaseOrder->id,
            ['status' => PurchaseOrder::STATUS_SUBMITTED],
            ['status' => PurchaseOrder::STATUS_APPROVED]
        );

        return response()->json($purchaseOrder->fresh(['supplier', 'items.item', 'approvedBy']));
    }

    public function markOrdered(int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Only Admin or Inventory Manager can mark purchase orders as ordered.'], 403);
        }

        $purchaseOrder = PurchaseOrder::findOrFail($id);

        if (!in_array($purchaseOrder->status, [PurchaseOrder::STATUS_APPROVED, PurchaseOrder::STATUS_ORDERED], true)) {
            return response()->json(['message' => 'Only approved purchase orders can be marked as ordered.'], 422);
        }

        $purchaseOrder->update([
            'status' => PurchaseOrder::STATUS_ORDERED,
            'ordered_at' => now(),
        ]);

        AuditLog::log(
            'PO_ORDERED',
            "Marked purchase order {$purchaseOrder->po_number} as ordered",
            'PurchaseOrder',
            $purchaseOrder->id,
            null,
            ['status' => PurchaseOrder::STATUS_ORDERED]
        );

        return response()->json($purchaseOrder->fresh(['supplier', 'items.item']));
    }

    public function receive(Request $request, int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Only Admin or Inventory Manager can receive purchase orders.'], 403);
        }

        $purchaseOrder = PurchaseOrder::with('items.item')->findOrFail($id);

        if (!in_array($purchaseOrder->status, [PurchaseOrder::STATUS_APPROVED, PurchaseOrder::STATUS_ORDERED], true)) {
            return response()->json(['message' => 'Only approved or ordered purchase orders can be received.'], 422);
        }

        $validated = $request->validate([
            'location_id' => 'nullable|exists:locations,id',
            'items' => 'nullable|array',
            'items.*.purchase_order_item_id' => 'required_with:items|exists:purchase_order_items,id',
            'items.*.received_quantity' => 'required_with:items|numeric|min:0',
        ]);

        DB::transaction(function () use ($purchaseOrder, $validated) {
            $receivedByItemId = collect($validated['items'] ?? [])->keyBy('purchase_order_item_id');

            foreach ($purchaseOrder->items as $poItem) {
                $receivedQuantity = $receivedByItemId->has($poItem->id)
                    ? (float) $receivedByItemId[$poItem->id]['received_quantity']
                    : (float) $poItem->ordered_quantity;

                if ($receivedQuantity <= 0) {
                    continue;
                }

                $locationId = $validated['location_id']
                    ?? $poItem->item->location_id
                    ?? $this->defaultLocationId();

                $stockRow = ItemStock::query()->firstOrCreate(
                    [
                        'item_id' => $poItem->item_id,
                        'location_id' => $locationId,
                    ],
                    [
                        'quantity' => 0,
                    ]
                );

                $stockRow->increment('quantity', $receivedQuantity);

                $poItem->update([
                    'received_quantity' => DB::raw('received_quantity + ' . $receivedQuantity),
                ]);

                StockMovement::create([
                    'item_id' => $poItem->item_id,
                    'movement_type' => 'stock_in',
                    'quantity' => $receivedQuantity,
                    'to_location_id' => $locationId,
                    'status' => 'completed',
                    'notes' => 'Stock received from purchase order ' . $purchaseOrder->po_number,
                    'reference_type' => 'purchase_order',
                    'reference_id' => $purchaseOrder->id,
                    'performed_by' => Auth::id(),
                ]);

                $poItem->item->update([
                    'quantity' => ItemStock::query()->where('item_id', $poItem->item_id)->sum('quantity'),
                    'location_id' => $locationId,
                ]);
            }

            $purchaseOrder->update([
                'status' => PurchaseOrder::STATUS_RECEIVED,
                'received_at' => now(),
            ]);
        });

        $this->notificationService->notifyUsers('po_received', [
            'title' => 'Purchase Order Received',
            'message' => "{$purchaseOrder->po_number} has been marked as received.",
            'action_url' => '/purchase-orders',
            'icon' => 'inventory',
            'metadata' => ['purchase_order_id' => $purchaseOrder->id],
        ]);

        AuditLog::log(
            'PO_RECEIVE',
            "Marked purchase order {$purchaseOrder->po_number} as received",
            'PurchaseOrder',
            $purchaseOrder->id,
            null,
            ['status' => PurchaseOrder::STATUS_RECEIVED]
        );

        return response()->json($purchaseOrder->fresh(['supplier', 'items.item']));
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $purchaseOrder = PurchaseOrder::findOrFail($id);

        if (in_array($purchaseOrder->status, [PurchaseOrder::STATUS_RECEIVED, PurchaseOrder::STATUS_CANCELLED], true)) {
            return response()->json(['message' => 'This purchase order cannot be cancelled.'], 422);
        }

        $purchaseOrder->update([
            'status' => PurchaseOrder::STATUS_CANCELLED,
            'cancel_reason' => $validated['reason'],
        ]);

        $this->notificationService->notifyUsers('po_cancelled', [
            'title' => 'Purchase Order Cancelled',
            'message' => "{$purchaseOrder->po_number} was cancelled.",
            'action_url' => '/purchase-orders',
            'icon' => 'inventory',
            'metadata' => [
                'purchase_order_id' => $purchaseOrder->id,
                'reason' => $validated['reason'],
            ],
        ]);

        AuditLog::log(
            'PO_CANCEL',
            "Cancelled purchase order {$purchaseOrder->po_number}",
            'PurchaseOrder',
            $purchaseOrder->id,
            null,
            ['status' => PurchaseOrder::STATUS_CANCELLED, 'reason' => $validated['reason']]
        );

        return response()->json($purchaseOrder);
    }

    public function lowStockSuggestions(): JsonResponse
    {
        $items = InventoryItem::query()
            ->where('is_active', true)
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'sku',
                'quantity',
                'reorder_level',
                'reorder_quantity',
                'cost_price',
            ]);

        return response()->json($items);
    }

    private function nextPoNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "PO-{$year}-";

        $last = PurchaseOrder::query()
            ->where('po_number', 'like', $prefix . '%')
            ->orderByDesc('po_number')
            ->value('po_number');

        $sequence = 1;
        if ($last) {
            $sequence = ((int) substr($last, -4)) + 1;
        }

        return $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    private function defaultLocationId(): int
    {
        $locationId = Location::query()->value('id');

        if ($locationId) {
            return (int) $locationId;
        }

        return (int) Location::query()->create([
            'name' => 'Main Warehouse',
            'description' => 'Auto-created default receiving location',
            'is_active' => true,
            'created_by' => Auth::id(),
        ])->id;
    }

    private function isManagerOrAdmin(): bool
    {
        $role = Auth::user()?->role?->name;
        return in_array($role, ['Admin', 'Inventory Manager'], true);
    }
}
