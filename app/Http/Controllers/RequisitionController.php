<?php

namespace App\Http\Controllers;

use App\Models\Requisition;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RequisitionController extends Controller
{
    /**
     * Display a listing of the requisitions.
     */
    public function index()
    {
        $user = Auth::user();
        $role = $user->role->name;

        // Admins can see all requisitions, other users see only their own
        $query = Requisition::with([
            'item.unitOfMeasure',
            'location',
            'createdBy',
            'reviewedBy'
        ]);

        if ($role !== 'Admin') {
            $query->where('requested_by', $user->id);
        }

        $requisitions = $query->orderBy('created_at', 'desc')->get();

        return response()->json($requisitions);
    }

    /**
     * Store a newly created requisition.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'item_id' => 'required|exists:inventory_items,id',
                'quantity' => 'required|integer|min:1',
                'location_id' => 'required|exists:locations,id',
            ]);

            $requisition = new Requisition();
            $requisition->requested_by = Auth::id();
            $requisition->item_id = $request->item_id;
            $requisition->quantity = $request->quantity;
            $requisition->status = 'pending';
            $requisition->location_id = $request->location_id;
            $requisition->save();

            return response()->json($requisition, 201);
        } catch (\Exception $e) {
            \Log::error('Error creating requisition: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified requisition.
     */
    public function show($id)
    {
        $requisition = Requisition::with([
            'item.unitOfMeasure',
            'location',
            'createdBy',
            'reviewedBy' // Make sure this relationship is loaded
        ])
            ->findOrFail($id);

        return response()->json($requisition);
    }

    /**
     * Update the specified requisition.
     * This is used by admins to approve/decline requisitions.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        // Only admins can approve/decline requisitions
        if ($user->role->name !== 'Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:approved,declined',
        ]);

        $requisition = Requisition::findOrFail($id);

        // Only pending requisitions can be updated
        if ($requisition->status !== 'pending') {
            return response()->json([
                'error' => 'This requisition has already been processed'
            ], 422);
        }

        // If approving, check if we have enough stock
        if ($request->status === 'approved') {
            $item = InventoryItem::findOrFail($requisition->item_id);

            if ($item->quantity < $requisition->quantity) {
                return response()->json([
                    'error' => 'Insufficient stock available to fulfill this request'
                ], 422);
            }

            // Reduce the stock quantity
            $item->quantity -= $requisition->quantity;
            $item->save();

            // Log the transaction
            $item->transactions()->create([
                'type' => 'remove',
                'quantity' => $requisition->quantity,
                'quantity_before' => $item->quantity + $requisition->quantity,
                'quantity_after' => $item->quantity,
                'notes' => 'Requisition approval: #' . $requisition->id,
                'user_id' => $user->id
            ]);
        }

        // Update the requisition status
        $requisition->status = $request->status;
        $requisition->reviewed_by = $user->id;
        $requisition->reviewed_at = now();

        if ($request->has('notes')) {
            $requisition->admin_notes = $request->notes;
        }

        $requisition->save();

        return response()->json($requisition);
    }

    /**
     * Review the specified requisition.
     * This method allows admins to approve or decline requisitions with optional notes.
     */
    public function review(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|in:approved,declined',
                'notes' => 'nullable|string',
            ]);

            $requisition = Requisition::findOrFail($id);
            $requisition->status = $request->status;
            $requisition->reviewed_by = auth()->id();
            $requisition->reviewed_at = now();
            $requisition->admin_notes = $request->notes; // <-- use admin_notes
            $requisition->save();

            return response()->json($requisition);
        } catch (\Exception $e) {
            \Log::error('Error reviewing requisition: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
