<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'submitted_by',
        'assigned_to',
        'expires_at',
        'is_expired',
        'last_activity_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'is_expired' => 'boolean',
    ];

    // Define expiration times in hours based on priority
    const EXPIRATION_HOURS = [
        'critical' => 0.5,   // 30 minutes
        'high' => 1.5,       // 1.5 hours
        'medium' => 2,    // 2 hours
        'low' => 3,       // 3 hours
    ];

    protected static function boot()
    {
        parent::boot();

        // Set expiration time when creating a ticket
        static::creating(function ($ticket) {
            $ticket->setExpirationTime();
            $ticket->last_activity_at = now();
        });

        // Update last activity when updating a ticket
        static::updating(function ($ticket) {
            $ticket->last_activity_at = now();

            // If status changed, reset expiration if not resolved/closed
            if ($ticket->isDirty('status') && !in_array($ticket->status, ['resolved', 'closed'])) {
                $ticket->setExpirationTime();
                $ticket->is_expired = false;
            }
        });
    }

    public function setExpirationTime()
    {
        $hours = self::EXPIRATION_HOURS[$this->priority] ?? 24;
        $this->expires_at = now()->addHours($hours);
    }

    public function checkExpiration()
    {
        if ($this->expires_at && now()->greaterThan($this->expires_at) && !in_array($this->status, ['resolved', 'closed'])) {
            $this->update(['is_expired' => true]);
            return true;
        }
        return false;
    }

    public function getTimeUntilExpiration()
    {
        if (!$this->expires_at || in_array($this->status, ['resolved', 'closed'])) {
            return null;
        }

        $now = now();
        if ($now->greaterThan($this->expires_at)) {
            return 'Expired';
        }

        $diffInSeconds = $now->diffInSeconds($this->expires_at);

        if ($diffInSeconds < 60) {
            // Show seconds with 1 decimal place when less than 1 minute
            return number_format($diffInSeconds, 1) . ' seconds remaining';
        } elseif ($diffInSeconds < 3600) {
            // Less than 1 hour - show minutes and seconds with decimal
            $minutes = floor($diffInSeconds / 60);
            $seconds = $diffInSeconds % 60;
            return $minutes . 'm ' . number_format($seconds, 0) . 's remaining';
        } elseif ($diffInSeconds < 86400) {
            // Less than 24 hours - show hours and minutes
            $hours = floor($diffInSeconds / 3600);
            $minutes = floor(($diffInSeconds % 3600) / 60);
            return $hours . 'h ' . $minutes . 'm remaining';
        } else {
            // More than 24 hours - show days and hours
            $days = floor($diffInSeconds / 86400);
            $hours = floor(($diffInSeconds % 86400) / 3600);
            return $days . 'd ' . $hours . 'h remaining';
        }
    }

    public function getExpirationStatus()
    {
        if (in_array($this->status, ['resolved', 'closed'])) {
            return 'completed';
        }

        if ($this->is_expired) {
            return 'expired';
        }

        if ($this->expires_at) {
            $now = now();
            $hoursLeft = $now->diffInHours($this->expires_at, false);

            if ($hoursLeft <= 1) {
                return 'critical'; // Less than 1 hour
            } elseif ($hoursLeft <= 4) {
                return 'warning'; // Less than 4 hours
            }
        }

        return 'normal';
    }

    // Relationships
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to')->withDefault();
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by')->withDefault();
    }

    public function updates()
    {
        return $this->hasMany(TicketUpdate::class);
    }

    // Scopes
    public function scopeExpired($query)
    {
        return $query->where('is_expired', true);
    }

    public function scopeExpiringSoon($query, $hours = 4)
    {
        return $query->where('expires_at', '<=', now()->addHours($hours))
                    ->where('is_expired', false)
                    ->whereNotIn('status', ['resolved', 'closed']);
    }
}
