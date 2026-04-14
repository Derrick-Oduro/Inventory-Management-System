<?php

namespace App\Http\Controllers;

use App\Models\InventoryAlert;
use App\Models\InventoryItem;
use App\Models\ItemStock;
use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $totalProducts = InventoryItem::query()->where('is_active', true)->count();

        $totalStockQuantity = ItemStock::query()->sum('quantity');

        if ((float) $totalStockQuantity === 0.0) {
            $totalStockQuantity = InventoryItem::query()->sum('quantity');
        }

        $totalStockValue = ItemStock::query()
            ->join('inventory_items', 'inventory_items.id', '=', 'item_stocks.item_id')
            ->selectRaw('COALESCE(SUM(item_stocks.quantity * COALESCE(inventory_items.cost_price, 0)), 0) as total_value')
            ->value('total_value') ?? 0;

        if ((float) $totalStockValue === 0.0) {
            $totalStockValue = InventoryItem::query()
                ->selectRaw('COALESCE(SUM(quantity * COALESCE(cost_price, 0)), 0) as total_value')
                ->value('total_value') ?? 0;
        }

        $items = InventoryItem::query()
            ->with('category:id,name')
            ->where('is_active', true)
            ->get(['id', 'name', 'sku', 'category_id', 'reorder_level', 'quantity']);

        $stockByItem = ItemStock::query()
            ->selectRaw('item_id, SUM(quantity) as total_quantity')
            ->groupBy('item_id')
            ->pluck('total_quantity', 'item_id');

        $lowStockItems = $items
            ->map(function (InventoryItem $item) use ($stockByItem) {
                $currentQuantity = (float) ($stockByItem[$item->id] ?? $item->quantity ?? 0);

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'category' => $item->category?->name,
                    'current_quantity' => $currentQuantity,
                    'reorder_level' => (float) $item->reorder_level,
                ];
            })
            ->filter(fn (array $item) => $item['current_quantity'] <= $item['reorder_level'])
            ->values()
            ->take(20);

        $recentPurchaseOrders = PurchaseOrder::query()
            ->with('supplier:id,company_name')
            ->latest()
            ->take(10)
            ->get(['id', 'po_number', 'supplier_id', 'status', 'total_amount', 'created_at']);

        $openAlertsCount = InventoryAlert::query()->where('status', 'open')->count();

        return response()->json([
            'total_products' => $totalProducts,
            'total_stock_quantity' => (float) $totalStockQuantity,
            'total_stock_value' => (float) $totalStockValue,
            'low_stock_items' => $lowStockItems,
            'open_alerts_count' => $openAlertsCount,
            'recent_purchase_orders' => $recentPurchaseOrders,
            'generated_at' => now()->toIso8601String(),
        ]);
    }
}
