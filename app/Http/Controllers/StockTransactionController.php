<?php

namespace App\Http\Controllers;

use App\Models\StockTransaction;
use Illuminate\Http\Request;

class StockTransactionController extends Controller
{
    public function index()
    {
        // Eager load item, location, and user for the frontend table
        $transactions = StockTransaction::with(['item', 'location', 'user'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($transactions);
    }
}
