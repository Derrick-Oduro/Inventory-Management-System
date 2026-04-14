<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\InventoryItem;
use App\Models\ItemCategory;
use App\Models\ItemStock;
use App\Models\Location;
use App\Models\StockMovement;
use App\Models\UnitOfMeasure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $role = $user->role->name ?? null;

        return Inertia::render('inventory', [
            'categories' => ItemCategory::orderBy('name')->get(),
            'units' => UnitOfMeasure::orderBy('name')->get(),
            'canManageInventory' => in_array($role, ['Admin', 'Inventory Manager'], true),
        ]);
    }

    public function getItems(Request $request): JsonResponse
    {
        $query = InventoryItem::query()
            ->with([
                'category:id,name',
                'unitOfMeasure:id,name,abbreviation',
                'creator:id,name',
                'location:id,name',
                'suppliers:id,company_name',
            ])
            ->withSum('stocks as stock_total', 'quantity')
            ->orderBy('name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        } else {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $items = $query->get()->each(function (InventoryItem $item) {
            $currentQuantity = (float) ($item->stock_total ?? $item->quantity ?? 0);
            $item->setAttribute('quantity', $currentQuantity);
            $item->setAttribute('current_quantity', $currentQuantity);
            $item->setAttribute('location', $item->location?->name);
        });

        return response()->json([
            'items' => $items,
            'categories' => ItemCategory::orderBy('name')->get(),
            'units' => UnitOfMeasure::orderBy('name')->get(),
            'locations' => Location::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:inventory_items,sku',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:item_categories,id',
            'uom_id' => 'required|exists:units_of_measure,id',
            'reorder_level' => 'required|numeric|min:0',
            'reorder_quantity' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'location_id' => 'nullable|exists:locations,id',
            'quantity' => 'nullable|numeric|min:0',
            'initial_quantity' => 'nullable|numeric|min:0',
            'supplier_ids' => 'nullable|array',
            'supplier_ids.*' => 'exists:suppliers,id',
            'image' => 'nullable|image|max:4096',
        ]);

        $initialQuantity = (float) ($validated['initial_quantity'] ?? $validated['quantity'] ?? 0);
        $basePrice = (float) $validated['cost_price'];
        $sellingPrice = (float) $validated['selling_price'];
        $reorderQuantity = (float) $validated['reorder_quantity'];

        if ($initialQuantity > 0 && empty($validated['location_id'])) {
            return response()->json([
                'message' => 'Location is required when setting an initial quantity.',
                'errors' => [
                    'location_id' => ['Location is required when initial quantity is greater than zero.'],
                ],
            ], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('inventory', 'public');
        }

        $item = DB::transaction(function () use ($validated, $initialQuantity, $imagePath, $reorderQuantity, $basePrice, $sellingPrice) {
            $item = InventoryItem::create([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'description' => $validated['description'] ?? null,
                'category_id' => $validated['category_id'],
                'uom_id' => $validated['uom_id'],
                'reorder_level' => $validated['reorder_level'],
                'reorder_quantity' => $reorderQuantity,
                'cost_price' => $basePrice,
                'selling_price' => $sellingPrice,
                'unit_price' => $basePrice,
                'quantity' => 0,
                'is_active' => $validated['is_active'] ?? true,
                'location_id' => $validated['location_id'] ?? null,
                'image_path' => $imagePath,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            if (!empty($validated['supplier_ids'])) {
                $syncPayload = [];
                foreach ($validated['supplier_ids'] as $supplierId) {
                    $syncPayload[$supplierId] = [
                        'is_preferred' => false,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                $item->suppliers()->sync($syncPayload);
            }

            if ($initialQuantity > 0 && !empty($validated['location_id'])) {
                ItemStock::query()->updateOrCreate(
                    [
                        'item_id' => $item->id,
                        'location_id' => $validated['location_id'],
                    ],
                    [
                        'quantity' => $initialQuantity,
                    ]
                );

                StockMovement::create([
                    'item_id' => $item->id,
                    'movement_type' => 'stock_in',
                    'quantity' => $initialQuantity,
                    'to_location_id' => $validated['location_id'],
                    'status' => 'completed',
                    'notes' => 'Initial stock from product creation',
                    'performed_by' => Auth::id(),
                ]);

                $item->update(['quantity' => $initialQuantity]);
            }

            return $item;
        });

        AuditLog::log(
            'PRODUCT_CREATE',
            "Created product: {$item->name}",
            'InventoryItem',
            $item->id,
            null,
            $item->toArray()
        );

        return response()->json($item->load(['category', 'unitOfMeasure', 'suppliers']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $item = InventoryItem::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:inventory_items,sku,' . $item->id,
            'description' => 'nullable|string',
            'category_id' => 'required|exists:item_categories,id',
            'uom_id' => 'required|exists:units_of_measure,id',
            'reorder_level' => 'required|numeric|min:0',
            'reorder_quantity' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'is_active' => 'required|boolean',
            'location_id' => 'nullable|exists:locations,id',
            'supplier_ids' => 'nullable|array',
            'supplier_ids.*' => 'exists:suppliers,id',
            'image' => 'nullable|image|max:4096',
        ]);

        $basePrice = (float) $validated['cost_price'];
        $sellingPrice = (float) $validated['selling_price'];
        $reorderQuantity = (float) $validated['reorder_quantity'];

        $oldValues = $item->getOriginal();

        if ($request->hasFile('image')) {
            if ($item->image_path && Storage::disk('public')->exists($item->image_path)) {
                Storage::disk('public')->delete($item->image_path);
            }
            $item->image_path = $request->file('image')->store('inventory', 'public');
        }

        $item->fill([
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'description' => $validated['description'] ?? null,
            'category_id' => $validated['category_id'],
            'uom_id' => $validated['uom_id'],
            'reorder_level' => $validated['reorder_level'],
            'reorder_quantity' => $reorderQuantity,
            'cost_price' => $basePrice,
            'selling_price' => $sellingPrice,
            'unit_price' => $basePrice,
            'is_active' => $validated['is_active'],
            'location_id' => $validated['location_id'] ?? null,
            'updated_by' => Auth::id(),
        ]);

        $item->save();

        if (array_key_exists('supplier_ids', $validated)) {
            $syncPayload = [];
            foreach (($validated['supplier_ids'] ?? []) as $supplierId) {
                $syncPayload[$supplierId] = [
                    'is_preferred' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            $item->suppliers()->sync($syncPayload);
        }

        AuditLog::log(
            'PRODUCT_UPDATE',
            "Updated product: {$item->name}",
            'InventoryItem',
            $item->id,
            $oldValues,
            $item->getChanges()
        );

        return response()->json($item->load(['category', 'unitOfMeasure', 'suppliers']));
    }

    public function adjustQuantity(Request $request, int $id): JsonResponse
    {
        $item = InventoryItem::findOrFail($id);

        if (!$item->is_active) {
            return response()->json(['message' => 'Cannot adjust stock for inactive products.'], 422);
        }

        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'location_id' => 'nullable|exists:locations,id',
            'adjustment_mode' => 'nullable|in:increase,decrease,set',
            'adjustment_type' => 'nullable|in:add,remove,adjust',
            'notes' => 'nullable|string|max:1000',
        ]);

        $mode = $validated['adjustment_mode'] ?? match ($validated['adjustment_type'] ?? 'adjust') {
            'add' => 'increase',
            'remove' => 'decrease',
            default => 'set',
        };

        $locationId = $validated['location_id']
            ?? $item->location_id
            ?? Location::query()->value('id');

        if (!$locationId) {
            return response()->json(['message' => 'No inventory location exists for this adjustment.'], 422);
        }

        $movement = StockMovement::create([
            'item_id' => $item->id,
            'movement_type' => 'adjustment',
            'quantity' => $validated['quantity'],
            'from_location_id' => $locationId,
            'status' => 'pending_approval',
            'notes' => $validated['notes'] ?? ('Pending adjustment (' . $mode . ')'),
            'reference_type' => 'manual_adjustment',
            'performed_by' => Auth::id(),
        ]);

        if ($this->isManagerOrAdmin()) {
            DB::transaction(function () use ($movement, $item, $mode, $locationId, $validated) {
                $stock = ItemStock::query()->firstOrCreate(
                    [
                        'item_id' => $item->id,
                        'location_id' => $locationId,
                    ],
                    [
                        'quantity' => 0,
                    ]
                );

                $quantity = (float) $validated['quantity'];

                if ($mode === 'increase') {
                    $stock->increment('quantity', $quantity);
                } elseif ($mode === 'decrease') {
                    if ((float) $stock->quantity < $quantity) {
                        abort(response()->json(['message' => 'Stock cannot go below zero.'], 422));
                    }
                    $stock->decrement('quantity', $quantity);
                } else {
                    $stock->update(['quantity' => $quantity]);
                }

                $movement->update([
                    'status' => 'approved',
                    'approved_by' => Auth::id(),
                    'approved_at' => now(),
                ]);

                $item->update([
                    'quantity' => ItemStock::query()->where('item_id', $item->id)->sum('quantity'),
                    'location_id' => $locationId,
                ]);
            });

            return response()->json([
                'message' => 'Adjustment approved and applied successfully.',
                'movement' => $movement->fresh(),
            ]);
        }

        AuditLog::log(
            'PRODUCT_ADJUSTMENT_REQUEST',
            "Created stock adjustment request for {$item->name}",
            'StockMovement',
            $movement->id,
            null,
            $movement->toArray()
        );

        return response()->json([
            'message' => 'Adjustment submitted for approval.',
            'movement' => $movement,
        ]);
    }

    public function getItemTransactions(int $id): JsonResponse
    {
        $transactions = StockMovement::query()
            ->with(['performedBy:id,name', 'approvedBy:id,name', 'fromLocation:id,name', 'toLocation:id,name'])
            ->where('item_id', $id)
            ->latest()
            ->get();

        return response()->json($transactions);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:item_categories,name',
            'description' => 'nullable|string',
        ]);

        $category = ItemCategory::create($validated);

        AuditLog::log(
            'CATEGORY_CREATE',
            "Created category: {$category->name}",
            'ItemCategory',
            $category->id,
            null,
            $category->toArray()
        );

        return response()->json($category, 201);
    }

    public function storeUnitOfMeasure(Request $request): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units_of_measure,name',
            'abbreviation' => 'required|string|max:10|unique:units_of_measure,abbreviation',
        ]);

        $unit = UnitOfMeasure::create($validated);

        return response()->json($unit, 201);
    }

    public function getCategories(): JsonResponse
    {
        return response()->json(ItemCategory::orderBy('name')->get());
    }

    public function getUnits(): JsonResponse
    {
        return response()->json(UnitOfMeasure::orderBy('name')->get());
    }

    public function destroyCategory(int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $category = ItemCategory::findOrFail($id);

        if ($category->items()->exists()) {
            return response()->json(['message' => 'Cannot delete a category that is used by products.'], 400);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }

    public function destroyUnit(int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $unit = UnitOfMeasure::findOrFail($id);

        if ($unit->items()->exists()) {
            return response()->json(['message' => 'Cannot delete a unit in use by products.'], 400);
        }

        $unit->delete();

        return response()->json(['message' => 'Unit deleted successfully']);
    }

    public function destroy(int $id): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $item = InventoryItem::findOrFail($id);
        $item->update([
            'is_active' => false,
            'updated_by' => Auth::id(),
        ]);

        AuditLog::log(
            'PRODUCT_DEACTIVATE',
            "Deactivated product: {$item->name}",
            'InventoryItem',
            $item->id,
            ['is_active' => true],
            ['is_active' => false]
        );

        return response()->json(['message' => 'Product deactivated successfully']);
    }

    public function importCsv(Request $request): JsonResponse
    {
        if (!$this->isManagerOrAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        if (!$path) {
            return response()->json(['message' => 'Invalid file.'], 422);
        }

        $handle = fopen($path, 'r');
        if (!$handle) {
            return response()->json(['message' => 'Unable to read file.'], 422);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'CSV file has no header row.'], 422);
        }

        $headerMap = array_map(fn ($value) => strtolower(trim((string) $value)), $header);

        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($handle, $headerMap, &$created, &$updated) {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) === 1 && trim((string) $row[0]) === '') {
                    continue;
                }

                $data = [];
                foreach ($headerMap as $index => $column) {
                    $data[$column] = $row[$index] ?? null;
                }

                if (empty($data['name']) || empty($data['sku'])) {
                    continue;
                }

                $categoryName = trim((string) ($data['category'] ?? 'General'));
                if ($categoryName === '') {
                    $categoryName = 'General';
                }

                $category = ItemCategory::firstOrCreate(
                    ['name' => $categoryName],
                    ['description' => null]
                );

                $unitName = trim((string) ($data['unit'] ?? 'Piece'));
                if ($unitName === '') {
                    $unitName = 'Piece';
                }

                $abbreviation = strtoupper(substr($unitName, 0, 10));
                $unit = UnitOfMeasure::firstOrCreate(
                    ['name' => $unitName],
                    ['abbreviation' => $abbreviation]
                );

                $costPrice = (float) ($data['cost_price'] ?? 0);
                $sellingPrice = (float) ($data['selling_price'] ?? $costPrice);
                if ($sellingPrice < $costPrice) {
                    $sellingPrice = $costPrice;
                }

                $payload = [
                    'name' => trim((string) $data['name']),
                    'description' => $data['description'] ?? null,
                    'category_id' => $category->id,
                    'uom_id' => $unit->id,
                    'reorder_level' => (float) ($data['reorder_level'] ?? 0),
                    'reorder_quantity' => (float) ($data['reorder_quantity'] ?? $data['reorder_level'] ?? 0),
                    'cost_price' => $costPrice,
                    'selling_price' => $sellingPrice,
                    'unit_price' => $costPrice,
                    'is_active' => $this->parseBoolean($data['is_active'] ?? '1'),
                    'updated_by' => Auth::id(),
                ];

                $existing = InventoryItem::where('sku', trim((string) $data['sku']))->first();

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    InventoryItem::create([
                        ...$payload,
                        'sku' => trim((string) $data['sku']),
                        'quantity' => 0,
                        'created_by' => Auth::id(),
                    ]);
                    $created++;
                }
            }
        });

        fclose($handle);

        return response()->json([
            'message' => 'CSV import completed successfully.',
            'created' => $created,
            'updated' => $updated,
        ]);
    }

    private function parseBoolean(mixed $value): bool
    {
        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['1', 'true', 'yes', 'y'], true);
    }

    private function isManagerOrAdmin(): bool
    {
        $role = Auth::user()?->role?->name;
        return in_array($role, ['Admin', 'Inventory Manager'], true);
    }
}
