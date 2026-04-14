<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function currentStock(Request $request): JsonResponse|StreamedResponse
    {
        $query = DB::table('item_stocks')
            ->join('inventory_items', 'inventory_items.id', '=', 'item_stocks.item_id')
            ->leftJoin('locations', 'locations.id', '=', 'item_stocks.location_id')
            ->where('inventory_items.is_active', true)
            ->select([
                'inventory_items.name as product_name',
                'inventory_items.sku as sku',
                'locations.name as location',
                'item_stocks.quantity as quantity',
                'inventory_items.cost_price as cost_price',
                DB::raw('(item_stocks.quantity * COALESCE(inventory_items.cost_price, 0)) as total_value'),
            ])
            ->orderBy('inventory_items.name');

        if ($request->filled('location_id')) {
            $query->where('item_stocks.location_id', $request->integer('location_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('inventory_items.name', 'like', "%{$search}%")
                    ->orWhere('inventory_items.sku', 'like', "%{$search}%");
            });
        }

        $rows = $query->get();

        if ($request->boolean('download')) {
            return $this->downloadCsv(
                'current-stock-report-' . now()->format('Ymd_His') . '.csv',
                ['Product', 'SKU', 'Location', 'Quantity', 'Cost Price', 'Total Value'],
                $rows->map(fn ($row) => [
                    $row->product_name,
                    $row->sku,
                    $row->location,
                    $row->quantity,
                    $row->cost_price,
                    $row->total_value,
                ])->all()
            );
        }

        return response()->json($rows);
    }

    public function purchaseOrders(Request $request): JsonResponse|StreamedResponse
    {
        $query = PurchaseOrder::query()
            ->with('supplier:id,company_name')
            ->orderByDesc('created_at');

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->date('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->date('to_date'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $rows = $query->get([
            'id',
            'po_number',
            'supplier_id',
            'status',
            'total_amount',
            'expected_delivery_date',
            'created_at',
        ]);

        if ($request->boolean('download')) {
            return $this->downloadCsv(
                'purchase-order-report-' . now()->format('Ymd_His') . '.csv',
                ['PO Number', 'Supplier', 'Status', 'Total Cost', 'Expected Delivery', 'Created At'],
                $rows->map(fn ($row) => [
                    $row->po_number,
                    $row->supplier?->company_name,
                    $row->status,
                    $row->total_amount,
                    $row->expected_delivery_date,
                    $row->created_at,
                ])->all()
            );
        }

        return response()->json($rows);
    }

    /**
     * @param  array<int, string>  $header
     * @param  array<int, array<int, mixed>>  $lines
     */
    private function downloadCsv(string $filename, array $header, array $lines): StreamedResponse
    {
        return response()->streamDownload(function () use ($header, $lines) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, $header);
            foreach ($lines as $line) {
                fputcsv($handle, $line);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
