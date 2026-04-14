<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Requisition extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'requested_by',
        'item_id',
        'quantity',
        'status',
        'location_id',
        'admin_notes',
        'reviewed_by',
        'reviewed_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    /**
     * Get the user who requested this requisition.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who reviewed this requisition.
     */
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the item being requested.
     */
    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    /**
     * Get the location for this requisition.
     */
    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Generate a reference number for this requisition.
     *
     * @return string
     */
    public function getReferenceNumberAttribute()
    {
        return 'REQ-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Scope a query to only include pending requisitions.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include approved requisitions.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope a query to only include declined requisitions.
     */
    public function scopeDeclined($query)
    {
        return $query->where('status', 'declined');
    }

    /**
     * Check if the requisition is pending.
     *
     * @return bool
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the requisition is approved.
     *
     * @return bool
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if the requisition is declined.
     *
     * @return bool
     */
    public function isDeclined()
    {
        return $this->status === 'declined';
    }
}
