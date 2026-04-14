<?php

namespace App\Services;

use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\InventoryEventNotification;
use Illuminate\Database\Eloquent\Builder;

class InventoryNotificationService
{
    /**
     * @param  array<string, mixed>  $payload
     * @param  callable(Builder): Builder|null  $scope
     */
    public function notifyUsers(string $notificationType, array $payload, ?callable $scope = null): void
    {
        $query = User::query()
            ->with('notificationPreferences')
            ->where('is_active', true);

        if ($scope !== null) {
            $query = $scope($query);
        }

        $users = $query->get();

        foreach ($users as $user) {
            $preference = $user->notificationPreferences
                ->firstWhere('notification_type', $notificationType);

            if ($preference && !$preference->enabled) {
                continue;
            }

            $delivery = $preference?->delivery_channel ?? 'in_app';
            $channels = $this->channelsForDelivery($delivery);

            $user->notify(new InventoryEventNotification($payload, $channels));
        }
    }

    /**
     * @param  array<int, string>  $roleNames
     * @param  array<string, mixed>  $payload
     */
    public function notifyRoles(array $roleNames, string $notificationType, array $payload): void
    {
        $this->notifyUsers($notificationType, $payload, function (Builder $query) use ($roleNames) {
            return $query->whereHas('role', function (Builder $roleQuery) use ($roleNames) {
                $roleQuery->whereIn('name', $roleNames);
            });
        });
    }

    /**
     * @return array<int, string>
     */
    private function channelsForDelivery(string $delivery): array
    {
        return match ($delivery) {
            'email' => ['mail'],
            'both' => ['database', 'mail'],
            default => ['database'],
        };
    }
}
