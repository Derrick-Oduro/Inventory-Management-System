<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'location_id',
        'is_active', // Make sure this is here
    ];

    protected $with = ['role'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean', // Make sure this is here
    ];

    // Add this method to check if user is active
    public function isActive()
    {
        return $this->is_active;
    }

    /**
     * Get the role that belongs to the user.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function createdPurchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'created_by');
    }

    public function approvedPurchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'approved_by');
    }

    public function performedStockMovements()
    {
        return $this->hasMany(StockMovement::class, 'performed_by');
    }

    public function approvedStockMovements()
    {
        return $this->hasMany(StockMovement::class, 'approved_by');
    }

    public function notificationPreferences()
    {
        return $this->hasMany(NotificationPreference::class);
    }

    // Scope to get only active users
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope to get only inactive users
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }
}
