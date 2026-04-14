<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\ItemCategory;
use App\Models\UnitOfMeasure;
use App\Models\InventoryTransaction;
use App\Models\Location;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Notifications\InventoryNotification;

class InventoryController extends Controller
{
    /**
     * Display inventory page
     */
    public function index()
    {
        $user = Auth::user();
        $role = $user->role->name ?? null;

        // Initial data for inventory page
        $categories = ItemCategory::orderBy('name')->get();
        $units = UnitOfMeasure::orderBy('name')->get();

        return Inertia::render('inventory', [
            'categories' => $categories,
            'units' => $units,
            'canManageInventory' => $role === 'Admin'
        ]);
    }

    /**
     * Get all inventory items with related data
     */
    public function getItems(Request $request)
    {
        try {
            // Query for inventory items
            $query = InventoryItem::with(['category', 'unitOfMeasure', 'creator'])
                ->orderBy('name');

            // Filter by category if provided
            if ($request->has('category_id') && $request->category_id) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by active status if provided
            if ($request->has('active')) {
                $query->where('is_active', $request->boolean('active'));
            } else {
                // Default to active items only
                $query->where('is_active', true);
            }

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $items = $query->get();

            // Get categories and units for dropdowns
            $categories = ItemCategory::orderBy('name')->get();
            $units = UnitOfMeasure::orderBy('name')->get();
            $locations = Location::where('is_active', true)->orderBy('name')->get();

            // Return structured response
            return response()->json([
                'items' => $items,
                'categories' => $categories,
                'units' => $units,
                'locations' => $locations,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching inventory data: ' . $e->getMessage());
            return response()->json([
                'items' => [],
                'categories' => [],
                'units' => []
            ], 500);
        }
    }

    /**
     * Store a new inventory item (Admin only)
     */
    public function store(Request $request)
    {
        // Check if user is admin
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:inventory_items',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:item_categories,id',
            'uom_id' => 'nullable|exists:units_of_measure,id',
            'quantity' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'location_id' => 'nullable|exists:locations,id',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload if provided
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('inventory', 'public');
        }

        $userId = Auth::id();

        $item = InventoryItem::create([
            'name' => $request->name,
            'sku' => $request->sku,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'uom_id' => $request->uom_id,
            'quantity' => $request->quantity,
            'reorder_level' => $request->reorder_level,
            'unit_price' => $request->unit_price,
            'is_active' => true,
            'location_id' => $request->location_id,
            'image_path' => $imagePath,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        // Create initial inventory transaction
        if ($request->quantity > 0) {
            InventoryTransaction::create([
                'item_id' => $item->id,
                'type' => 'add',
                'quantity' => $request->quantity,
                'quantity_before' => 0,
                'quantity_after' => $request->quantity,
                'notes' => 'Initial inventory',
                'user_id' => $userId,
            ]);
        }

        // Send notification to all admins about new item creation
        try {
            $admins = User::whereHas('role', function($query) {
                $query->where('name', 'Admin');
            })->where('id', '!=', $userId)->get();

            \Log::info('Found admins for notification', [
                'count' => $admins->count(),
                'admin_ids' => $admins->pluck('id')->toArray()
            ]);

            foreach ($admins as $admin) {
                $admin->notify(new InventoryNotification([
                    'title' => 'New Item Added',
                    'message' => "New inventory item '{$item->name}' has been added to the system",
                    'item_id' => $item->id,
                    'action_url' => '/inventory',
                    'icon' => 'inventory'
                ]));

                \Log::info('Notification sent to admin: ' . $admin->id);
            }
        } catch (\Exception $e) {
            \Log::error('Error sending notifications: ' . $e->getMessage());
        }

        AuditLog::log(
            'INVENTORY_CREATE',
            "Created inventory item: {$item->name}",
            'InventoryItem',
            $item->id,
            null,
            $item->toArray()
        );

        return response()->json($item->load(['category', 'unitOfMeasure']), 201);
    }

    /**
     * Update an inventory item (Admin only)
     */
    public function update(Request $request, $id)
    {
        // Check if user is admin
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $item = InventoryItem::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:inventory_items,sku,' . $id,
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:item_categories,id',
            'uom_id' => 'nullable|exists:units_of_measure,id',
            'reorder_level' => 'required|numeric|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'is_active' => 'required|boolean',
            'location_id' => 'nullable|exists:locations,id',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload if provided
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($item->image_path && Storage::disk('public')->exists($item->image_path)) {
                Storage::disk('public')->delete($item->image_path);
            }

            $imagePath = $request->file('image')->store('inventory', 'public');
            $item->image_path = $imagePath;
        }

        $oldValues = $item->getOriginal();

        $item->name = $request->name;
        $item->sku = $request->sku;
        $item->description = $request->description;
        $item->category_id = $request->category_id;
        $item->uom_id = $request->uom_id;
        $item->reorder_level = $request->reorder_level;
        $item->unit_price = $request->unit_price;
        $item->is_active = $request->is_active;
        $item->location_id = $request->location_id;
        $item->updated_by = Auth::id();

        $item->save();

        AuditLog::log(
            'INVENTORY_UPDATE',
            "Updated inventory item: {$item->name}",
            'InventoryItem',
            $item->id,
            $oldValues,
            $item->getChanges()
        );

        return response()->json($item->load(['category', 'unitOfMeasure']));
    }

    /**
     * Adjust inventory quantity (Admin only)
     */
    public function adjustQuantity(Request $request, $id)
    {
        // Check if user is admin
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $item = InventoryItem::findOrFail($id);

        $request->validate([
            'adjustment_type' => 'required|in:add,remove,adjust',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $quantityBefore = $item->quantity;
        $adjustmentType = $request->adjustment_type;
        $adjustmentQty = $request->quantity;

        switch ($adjustmentType) {
            case 'add':
                $item->quantity += $adjustmentQty;
                break;
            case 'remove':
                if ($item->quantity < $adjustmentQty) {
                    return response()->json([
                        'message' => 'Insufficient quantity available',
                    ], 422);
                }
                $item->quantity -= $adjustmentQty;
                break;
            case 'adjust':
                $item->quantity = $adjustmentQty;
                break;
        }

        $item->updated_by = Auth::id();
        $item->save();

        // Record the transaction
        InventoryTransaction::create([
            'item_id' => $item->id,
            'type' => $adjustmentType,
            'quantity' => $adjustmentQty,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $item->quantity,
            'notes' => $request->notes,
            'user_id' => Auth::id(),
        ]);

        AuditLog::log(
            'INVENTORY_ADJUST',
            "Adjusted inventory for {$item->name}: {$adjustmentType} {$adjustmentQty} (was {$quantityBefore}, now {$item->quantity})",
            'InventoryItem',
            $item->id,
            ['quantity' => $quantityBefore],
            ['quantity' => $item->quantity, 'adjustment_type' => $adjustmentType]
        );

        // Check for low stock and send notifications
        if ($item->quantity <= $item->reorder_level) {
            $admins = User::whereHas('role', function($query) {
                $query->where('name', 'Admin');
            })->get();

            foreach ($admins as $admin) {
                $admin->notify(new \App\Notifications\InventoryNotification([
                    'title' => 'Low Stock Alert',
                    'message' => "Item '{$item->name}' is running low. Current stock: {$item->quantity}",
                    'item_id' => $item->id,
                    'action_url' => '/inventory',
                    'icon' => 'inventory'
                ]));
            }
        }

        return response()->json([
            'item' => $item->load(['category', 'unitOfMeasure']),
            'message' => 'Inventory adjusted successfully',
        ]);
    }

    /**
     * Get inventory transaction history for an item
     */
    public function getItemTransactions($id)
    {
        $item = InventoryItem::findOrFail($id);

        $transactions = InventoryTransaction::with('user')
            ->where('item_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($transactions);
    }

    /**
     * Create a new category (Admin only)
     */
    public function storeCategory(Request $request)
    {
        // Check if user is admin
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:item_categories',
            'description' => 'nullable|string',
        ]);

        $category = ItemCategory::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);

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

    /**
     * Create a new unit of measure (Admin only)
     */
    public function storeUnitOfMeasure(Request $request)
    {
        // Check if user is admin
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:units_of_measure',
            'abbreviation' => 'required|string|max:10|unique:units_of_measure',
        ]);

        $unit = UnitOfMeasure::create([
            'name' => $request->name,
            'abbreviation' => $request->abbreviation,
        ]);

        return response()->json($unit, 201);
    }

    /**
     * Get all categories
     */
    public function getCategories()
    {
        try {
            $categories = ItemCategory::orderBy('name')->get();
            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch categories'], 500);
        }
    }

    /**
     * Get all units
     */
    public function getUnits()
    {
        try {
            $units = UnitOfMeasure::orderBy('name')->get();
            return response()->json($units);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch units'], 500);
        }
    }

    /**
     * Delete a category
     */
    public function destroyCategory($id)
    {
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $category = ItemCategory::findOrFail($id);

            // Check if category is being used
            if ($category->items()->count() > 0) {
                return response()->json(['message' => 'Cannot delete category that is in use by inventory items'], 400);
            }

            AuditLog::log(
                'CATEGORY_DELETE',
                "Deleted category: {$category->name}",
                'ItemCategory',
                $category->id,
                $category->toArray(),
                null
            );

            $category->delete();
            return response()->json(['message' => 'Category deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting category'], 500);
        }
    }

    /**
     * Delete a unit
     */
    public function destroyUnit($id)
    {
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $unit = UnitOfMeasure::findOrFail($id);

            // Check if unit is being used
            if ($unit->items()->count() > 0) {
                return response()->json(['message' => 'Cannot delete unit that is in use by inventory items'], 400);
            }

            $unit->delete();
            return response()->json(['message' => 'Unit deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting unit'], 500);
        }
    }

    /**
     * Remove the specified inventory item.
     */
    public function destroy($id)
    {
        try {
            $item = InventoryItem::findOrFail($id);

            // Delete associated image if exists
            if ($item->image_path) {
                Storage::disk('public')->delete($item->image_path);
            }

            AuditLog::log(
                'INVENTORY_DELETE',
                "Deleted inventory item: {$item->name}",
                'InventoryItem',
                $item->id,
                $item->toArray(),
                null
            );

            // Option 1: Soft delete (if you've added softDeletes to your model)
            // $item->delete();

            // Option 2: Hard delete, but keep transaction history
            // This allows you to still reference transactions for accounting purposes
            // even if the item is gone
            $item->is_active = false;
            $item->name = "[DELETED] " . $item->name;
            $item->save();
            $item->delete();

            return response()->json(['message' => 'Item deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('Error deleting inventory item: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete item: ' . $e->getMessage()], 500);
        }
    }
}
