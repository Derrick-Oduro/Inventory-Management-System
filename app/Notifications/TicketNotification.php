<?php


namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketNotification extends Notification
{
    use Queueable;

    public function __construct(protected array $data)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->data['title'],
            'message' => $this->data['message'],
            'ticket_id' => $this->data['ticket_id'] ?? null,
            'action_url' => $this->data['action_url'] ?? null,
            'icon' => $this->data['icon'] ?? 'ticket',
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->data['title'],
            'message' => $this->data['message'],
            'ticket_id' => $this->data['ticket_id'] ?? null,
            'action_url' => $this->data['action_url'] ?? null,
            'icon' => $this->data['icon'] ?? 'ticket',
        ];
    }
}
