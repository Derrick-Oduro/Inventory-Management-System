<?php
// filepath: /home/derrick/Development/it-support-system/app/Models/ItemCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemCategory extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description'];

    public function items()
    {
        return $this->hasMany(InventoryItem::class, 'category_id');
    }
}
