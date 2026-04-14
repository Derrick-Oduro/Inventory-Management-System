<?php


namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TestNotification extends Notification
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
            'title' => $this->data['title'] ?? 'Test Notification',
            'message' => $this->data['message'] ?? 'This is a test notification',
            'icon' => $this->data['icon'] ?? 'test',
            'action_url' => $this->data['action_url'] ?? null,
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->data['title'] ?? 'Test Notification',
            'message' => $this->data['message'] ?? 'This is a test notification',
            'icon' => $this->data['icon'] ?? 'test',
            'action_url' => $this->data['action_url'] ?? null,
        ];
    }
}
