<?php


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StockTransaction;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function index()
    {
        return response()->json(StockTransaction::all());
    }

    public function store(Request $request)
    {
        info("hello");
        $request->validate([
            'from_location_id' => 'required|integer|different:to_location_id',
            'to_location_id' => 'required|integer',
            'item_id' => 'required|integer|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);
        info("hi");

        DB::beginTransaction();
        try {
            $userId = Auth::id();

            // Out transaction (from location)
            StockTransaction::create([
                'item_id' => $request->item_id,
                'type' => 'out',
                'quantity' => $request->quantity,
                'reason' => $request->notes ?? 'Transfer out',
                'location_id' => $request->from_location_id,
                'user_id' => $userId,
            ]);

            // In transaction (to location)
            StockTransaction::create([
                'item_id' => $request->item_id,
                'type' => 'in',
                'quantity' => $request->quantity,
                'reason' => $request->notes ?? 'Transfer in',
                'location_id' => $request->to_location_id,
                'user_id' => $userId,
            ]);

            DB::commit();
            return response()->json(['message' => 'Transfer completed'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Transfer failed: ' . $e->getMessage()], 500);
        }
    }
}
