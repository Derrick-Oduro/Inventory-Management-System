<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'type',
        'quantity',
        'reason',
        'location_id',
        'user_id',
    ];

    public function item()
    {
        return $this->belongsTo(\App\Models\InventoryItem::class, 'item_id');
    }

    public function location()
    {
        return $this->belongsTo(\App\Models\Location::class, 'location_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
