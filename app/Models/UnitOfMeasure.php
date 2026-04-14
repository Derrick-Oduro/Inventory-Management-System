<?php
// filepath: /home/derrick/Development/it-support-system/app/Models/UnitOfMeasure.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnitOfMeasure extends Model
{
    use HasFactory;

    protected $table = 'units_of_measure';

    protected $fillable = ['name', 'abbreviation'];

    public function items()
    {
        return $this->hasMany(InventoryItem::class, 'uom_id');
    }
}
