<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\InventoryAlert;
use App\Models\InventoryItem;
use App\Models\ItemStock;
use App\Models\StockMovement;
use App\Services\InventoryNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockMovementController extends Controller
{
    public function __construct(private readonly InventoryNotificationService $notificationService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = StockMovement::query()
            ->with([
                'item:id,name,sku',
                'fromLocation:id,name',
                'toLocation:id,name',
                'performedBy:id,name',
                'approvedBy:id,name',
            ])
            ->latest();

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->integer('item_id'));
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->string('movement_type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'movement_type' => 'required|in:stock_in,stock_out,transfer,adjustment,return',
            'quantity' => 'required|numeric|min:0.01',
            'from_location_id' => 'nullable|exists:locations,id',
            'to_location_id' => 'nullable|exists:locations,id',
            'notes' => 'nullable|string',
            'reference_type' => 'nullable|string|max:100',
            'reference_id' => 'nullable|integer',
            'adjustment_mode' => 'nullable|in:increase,decrease,set',
        ]);

        $item = InventoryItem::findOrFail($validated['item_id']);

        if (!$item->is_active) {
            return response()->json([
                'message' => 'Stock movement is blocked for inactive products.',
            ], 422);
        }

        $this->validateLocationRules($validated);

        $status = $validated['movement_type'] === 'adjustment' ? 'pending_approval' : 'completed';

        $movement = StockMovement::create([
            'item_id' => $validated['item_id'],
            'movement_type' => $validated['movement_type'],
            'quantity' => $validated['quantity'],
            'from_location_id' => $validated['from_location_id'] ?? null,
            'to_location_id' => $validated['to_location_id'] ?? null,
            'status' => $status,
            'notes' => $validated['notes'] ?? null,
            'reference_type' => $validated['reference_type'] ?? null,
            'reference_id' => $validated['reference_id'] ?? null,
            'performed_by' => Auth::id(),
        ]);

        if ($status === 'completed') {
            DB::transaction(function () use ($movement, $validated) {
                $this->applyMovement($movement, $validated['adjustment_mode'] ?? null);
            });
        }

        AuditLog::log(
            'STOCK_MOVEMENT_CREATE',
            "Created {$movement->movement_type} movement for item #{$movement->item_id}",
            'StockMovement',
            $movement->id,
            null,
            $movement->toArray()
        );

        return response()->json($movement->load(['item', 'fromLocation', 'toLocation', 'performedBy']), 201);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Only Admin or Inventory Manager can approve adjustments.'], 403);
        }

        $validated = $request->validate([
            'adjustment_mode' => 'nullable|in:increase,decrease,set',
        ]);

        $movement = StockMovement::findOrFail($id);

        if ($movement->status !== 'pending_approval') {
            return response()->json(['message' => 'Only pending movements can be approved.'], 422);
        }

        DB::transaction(function () use ($movement, $validated) {
            $this->applyMovement($movement, $validated['adjustment_mode'] ?? null);

            $movement->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);
        });

        AuditLog::log(
            'STOCK_MOVEMENT_APPROVE',
            "Approved stock adjustment #{$movement->id}",
            'StockMovement',
            $movement->id,
            ['status' => 'pending_approval'],
            ['status' => 'approved']
        );

        return response()->json($movement->fresh(['item', 'fromLocation', 'toLocation', 'approvedBy']));
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Only Admin or Inventory Manager can reject adjustments.'], 403);
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $movement = StockMovement::findOrFail($id);

        if ($movement->status !== 'pending_approval') {
            return response()->json(['message' => 'Only pending movements can be rejected.'], 422);
        }

        $movement->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'notes' => trim(($movement->notes ? $movement->notes . "\n\n" : '') . 'Rejected: ' . $validated['notes']),
        ]);

        AuditLog::log(
            'STOCK_MOVEMENT_REJECT',
            "Rejected stock adjustment #{$movement->id}",
            'StockMovement',
            $movement->id,
            ['status' => 'pending_approval'],
            ['status' => 'rejected']
        );

        return response()->json($movement->fresh(['item', 'fromLocation', 'toLocation', 'approvedBy']));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function validateLocationRules(array $payload): void
    {
        $type = $payload['movement_type'];

        if (in_array($type, ['stock_out', 'transfer', 'adjustment'], true) && empty($payload['from_location_id'])) {
            abort(response()->json(['message' => 'from_location_id is required for this movement type.'], 422));
        }

        if (in_array($type, ['stock_in', 'transfer', 'return'], true) && empty($payload['to_location_id'])) {
            abort(response()->json(['message' => 'to_location_id is required for this movement type.'], 422));
        }

        if ($type === 'transfer' && ($payload['from_location_id'] ?? null) === ($payload['to_location_id'] ?? null)) {
            abort(response()->json(['message' => 'Transfer requires different source and destination locations.'], 422));
        }
    }

    private function applyMovement(StockMovement $movement, ?string $adjustmentMode = null): void
    {
        $item = InventoryItem::findOrFail($movement->item_id);
        $quantity = (float) $movement->quantity;

        if ($movement->movement_type === 'stock_in' || $movement->movement_type === 'return') {
            $stock = $this->stockRow($movement->item_id, (int) $movement->to_location_id);
            $stock->increment('quantity', $quantity);
            $this->refreshItemTotal($item);
            $this->syncLowStockAlert($item, (int) $movement->to_location_id);
            return;
        }

        if ($movement->movement_type === 'stock_out') {
            $stock = $this->stockRow($movement->item_id, (int) $movement->from_location_id);
            if ((float) $stock->quantity < $quantity) {
                abort(response()->json(['message' => 'Stock cannot go below zero.'], 422));
            }

            $stock->decrement('quantity', $quantity);
            $this->refreshItemTotal($item);
            $this->syncLowStockAlert($item, (int) $movement->from_location_id);
            return;
        }

        if ($movement->movement_type === 'transfer') {
            $fromStock = $this->stockRow($movement->item_id, (int) $movement->from_location_id);
            if ((float) $fromStock->quantity < $quantity) {
                abort(response()->json(['message' => 'Stock cannot go below zero.'], 422));
            }

            $toStock = $this->stockRow($movement->item_id, (int) $movement->to_location_id);

            $fromStock->decrement('quantity', $quantity);
            $toStock->increment('quantity', $quantity);
            $this->refreshItemTotal($item);

            $this->syncLowStockAlert($item, (int) $movement->from_location_id);
            $this->syncLowStockAlert($item, (int) $movement->to_location_id);
            return;
        }

        if ($movement->movement_type === 'adjustment') {
            $mode = $adjustmentMode ?? 'set';
            $stock = $this->stockRow($movement->item_id, (int) $movement->from_location_id);

            if ($mode === 'increase') {
                $stock->increment('quantity', $quantity);
            } elseif ($mode === 'decrease') {
                if ((float) $stock->quantity < $quantity) {
                    abort(response()->json(['message' => 'Stock cannot go below zero.'], 422));
                }
                $stock->decrement('quantity', $quantity);
            } else {
                if ($quantity < 0) {
                    abort(response()->json(['message' => 'Adjustment quantity must be positive.'], 422));
                }
                $stock->update(['quantity' => $quantity]);
            }

            $this->refreshItemTotal($item);
            $this->syncLowStockAlert($item, (int) $movement->from_location_id);
        }
    }

    private function stockRow(int $itemId, int $locationId): ItemStock
    {
        return ItemStock::query()->firstOrCreate(
            [
                'item_id' => $itemId,
                'location_id' => $locationId,
            ],
            [
                'quantity' => 0,
            ]
        );
    }

    private function refreshItemTotal(InventoryItem $item): void
    {
        $item->update([
            'quantity' => ItemStock::query()->where('item_id', $item->id)->sum('quantity'),
        ]);
    }

    private function syncLowStockAlert(InventoryItem $item, int $locationId): void
    {
        $stock = ItemStock::query()
            ->where('item_id', $item->id)
            ->where('location_id', $locationId)
            ->first();

        if (!$stock) {
            return;
        }

        if ((float) $stock->quantity <= (float) $item->reorder_level) {
            $alert = InventoryAlert::query()->firstOrCreate(
                [
                    'item_id' => $item->id,
                    'location_id' => $locationId,
                    'status' => 'open',
                ],
                [
                    'current_quantity' => $stock->quantity,
                    'reorder_level' => $item->reorder_level,
                    'created_by' => Auth::id(),
                ]
            );

            $alert->update([
                'current_quantity' => $stock->quantity,
                'reorder_level' => $item->reorder_level,
            ]);

            $this->notificationService->notifyRoles(
                ['Admin', 'Inventory Manager'],
                'low_stock',
                [
                    'title' => 'Low Stock Alert',
                    'message' => "{$item->name} is below reorder level at location #{$locationId}.",
                    'action_url' => '/inventory',
                    'icon' => 'inventory',
                    'metadata' => [
                        'item_id' => $item->id,
                        'location_id' => $locationId,
                    ],
                ]
            );
            return;
        }

        InventoryAlert::query()
            ->where('item_id', $item->id)
            ->where('location_id', $locationId)
            ->where('status', 'open')
            ->update([
                'status' => 'resolved',
                'resolved_at' => now(),
                'resolved_by' => Auth::id(),
                'current_quantity' => $stock->quantity,
            ]);
    }

    private function isManagerOrAdmin(): bool
    {
        $role = Auth::user()?->role?->name;
        return in_array($role, ['Admin', 'Inventory Manager'], true);
    }
}
