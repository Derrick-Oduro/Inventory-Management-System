<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'location_id',
        'current_quantity',
        'reorder_level',
        'status',
        'created_by',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'current_quantity' => 'decimal:2',
        'reorder_level' => 'decimal:2',
        'resolved_at' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
