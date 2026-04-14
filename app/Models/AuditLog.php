<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'description',
        'entity_type',
        'entity_id',
        'ip_address',
        'user_agent',
        'old_values',
        'new_values'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the user that performed the action.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an audit entry
     */
    public static function log($action, $description, $entityType = null, $entityId = null, $oldValues = null, $newValues = null)
    {
        $request = request();

        return static::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_address' => $request ? $request->ip() : null,
            'user_agent' => $request ? $request->header('User-Agent') : null,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
