<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'contact_person',
        'email',
        'phone',
        'address',
        'payment_terms',
        'expected_delivery_days',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'expected_delivery_days' => 'integer',
        'is_active' => 'boolean',
    ];

    public function items()
    {
        return $this->belongsToMany(InventoryItem::class, 'inventory_item_supplier', 'supplier_id', 'item_id')
            ->withPivot(['is_preferred', 'supplier_sku', 'last_purchase_price'])
            ->withTimestamps();
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
