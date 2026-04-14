<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InventoryEventNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, string>  $channels
     */
    public function __construct(
        protected array $data,
        protected array $channels = ['database']
    ) {
    }

    public function via(object $notifiable): array
    {
        return $this->channels;
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->data['title'] ?? 'Inventory Notification',
            'message' => $this->data['message'] ?? '',
            'action_url' => $this->data['action_url'] ?? '/dashboard',
            'icon' => $this->data['icon'] ?? 'inventory',
            'metadata' => $this->data['metadata'] ?? [],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->data['title'] ?? 'Inventory Notification')
            ->line($this->data['message'] ?? 'You have a new inventory notification.');

        if (!empty($this->data['action_url'])) {
            $mail->action('View Details', url($this->data['action_url']));
        }

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
