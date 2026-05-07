<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $query = Supplier::query()->withCount('items')->orderBy('company_name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('items', function ($itemQuery) use ($search) {
                        $itemQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        return response()->json($query->get());
    }

    public function show(int $id): JsonResponse
    {
        $supplier = Supplier::query()
            ->with(['items' => function ($query) {
                $query->select('inventory_items.id', 'name', 'sku');
            }])
            ->findOrFail($id);

        return response()->json($supplier);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:255|unique:suppliers,company_name',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'payment_terms' => 'nullable|string|max:100',
            'expected_delivery_days' => 'nullable|integer|min:0|max:365',
            'is_active' => 'nullable|boolean',
        ]);

        $supplier = Supplier::create([
            ...$validated,
            'expected_delivery_days' => $validated['expected_delivery_days'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        AuditLog::log(
            'SUPPLIER_CREATE',
            "Created supplier: {$supplier->company_name}",
            'Supplier',
            $supplier->id,
            null,
            $supplier->toArray()
        );

        return response()->json($supplier, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $supplier = Supplier::findOrFail($id);

        $validated = $request->validate([
            'company_name' => 'required|string|max:255|unique:suppliers,company_name,' . $supplier->id,
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'payment_terms' => 'nullable|string|max:100',
            'expected_delivery_days' => 'nullable|integer|min:0|max:365',
            'is_active' => 'nullable|boolean',
        ]);

        $oldValues = $supplier->getOriginal();

        $supplier->update([
            ...$validated,
            'updated_by' => Auth::id(),
        ]);

        AuditLog::log(
            'SUPPLIER_UPDATE',
            "Updated supplier: {$supplier->company_name}",
            'Supplier',
            $supplier->id,
            $oldValues,
            $supplier->getChanges()
        );

        return response()->json($supplier);
    }

    public function deactivate(int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $supplier = Supplier::findOrFail($id);
        $supplier->update([
            'is_active' => false,
            'updated_by' => Auth::id(),
        ]);

        AuditLog::log(
            'SUPPLIER_DEACTIVATE',
            "Deactivated supplier: {$supplier->company_name}",
            'Supplier',
            $supplier->id,
            ['is_active' => true],
            ['is_active' => false]
        );

        return response()->json(['message' => 'Supplier deactivated successfully']);
    }

    public function activate(int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $supplier = Supplier::findOrFail($id);
        $supplier->update([
            'is_active' => true,
            'updated_by' => Auth::id(),
        ]);

        AuditLog::log(
            'SUPPLIER_ACTIVATE',
            "Activated supplier: {$supplier->company_name}",
            'Supplier',
            $supplier->id,
            ['is_active' => false],
            ['is_active' => true]
        );

        return response()->json(['message' => 'Supplier activated successfully']);
    }

    public function syncItems(Request $request, int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $supplier = Supplier::findOrFail($id);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventory_items,id',
            'items.*.is_preferred' => 'nullable|boolean',
            'items.*.supplier_sku' => 'nullable|string|max:100',
            'items.*.last_purchase_price' => 'nullable|numeric|min:0',
        ]);

        $syncPayload = [];
        foreach ($validated['items'] as $item) {
            $syncPayload[$item['item_id']] = [
                'is_preferred' => (bool) ($item['is_preferred'] ?? false),
                'supplier_sku' => $item['supplier_sku'] ?? null,
                'last_purchase_price' => $item['last_purchase_price'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $supplier->items()->sync($syncPayload);

        AuditLog::log(
            'SUPPLIER_ITEMS_SYNC',
            "Updated supplied items for supplier: {$supplier->company_name}",
            'Supplier',
            $supplier->id,
            null,
            ['items' => array_keys($syncPayload)]
        );

        return response()->json($supplier->load('items:id,name,sku'));
    }

    private function isManagerOrAdmin(): bool
    {
        $role = Auth::user()?->role?->name;
        return in_array($role, ['Admin', 'Inventory Manager'], true);
    }
}
