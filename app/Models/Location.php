<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'address',
        'is_active',
        'created_by'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the requisitions for this location.
     */
    public function requisitions()
    {
        return $this->hasMany(Requisition::class);
    }

    /**
     * Get the user that created this location.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the inventory items for this location.
     */
    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class, 'location_id');
    }
}
