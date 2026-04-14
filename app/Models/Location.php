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

    public function itemStocks()
    {
        return $this->hasMany(ItemStock::class, 'location_id');
    }

    public function sourceMovements()
    {
        return $this->hasMany(StockMovement::class, 'from_location_id');
    }

    public function destinationMovements()
    {
        return $this->hasMany(StockMovement::class, 'to_location_id');
    }
}
