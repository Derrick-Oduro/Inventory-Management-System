<?php


namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequisitionNotification extends Notification
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
            'requisition_id' => $this->data['requisition_id'] ?? null,
            'action_url' => $this->data['action_url'] ?? null,
            'icon' => $this->data['icon'] ?? 'requisition',
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->data['title'],
            'message' => $this->data['message'],
            'requisition_id' => $this->data['requisition_id'] ?? null,
            'action_url' => $this->data['action_url'] ?? null,
            'icon' => $this->data['icon'] ?? 'requisition',
        ];
    }
}
