<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'description',
        'category_id',
        'uom_id',
        'location_id',
        'quantity',
        'reorder_level',
        'unit_price',
        'is_active',
        'image_path',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'reorder_level' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category_id');
    }

    public function unitOfMeasure()
    {
        return $this->belongsTo(UnitOfMeasure::class, 'uom_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'item_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }
}
