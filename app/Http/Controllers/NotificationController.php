<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Notifications\TicketNotification;
use App\Notifications\InventoryNotification;
use App\Notifications\RequisitionNotification;
use App\Notifications\TestNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }

            // Get latest 50 notifications (both read and unread)
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            Log::info('Fetched notifications for user: ' . $user->id, ['count' => $notifications->count()]);

            return response()->json($notifications);
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch notifications'], 500);
        }
    }

    public function markAllRead(Request $request)
    {
        try {
            $user = $request->user();
            $user->unreadNotifications->markAsRead();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark notifications as read'], 500);
        }
    }

    public function markAsRead(Request $request, $id)
    {
        try {
            $user = $request->user();
            $notification = $user->notifications()->where('id', $id)->first();

            if ($notification) {
                $notification->markAsRead();
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark notification as read'], 500);
        }
    }

    public function test(Request $request)
    {
        try {
            $user = $request->user();

            Log::info('Creating test notification for user: ' . $user->id);

            $user->notify(new TestNotification([
                'title' => 'Test Notification',
                'message' => 'This is a test notification created at ' . now()->format('Y-m-d H:i:s'),
                'icon' => 'test'
            ]));

            Log::info('Test notification created successfully');

            return response()->json(['success' => true, 'message' => 'Test notification sent']);
        } catch (\Exception $e) {
            Log::error('Error creating test notification: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create test notification'], 500);
        }
    }

    // Send ticket notifications
    public function sendTicketNotification($ticketId, $type, $message, $recipientIds = [])
    {
        $recipients = User::whereIn('id', $recipientIds)->get();

        foreach ($recipients as $recipient) {
            $recipient->notify(new TicketNotification([
                'title' => 'Ticket Update',
                'message' => $message,
                'ticket_id' => $ticketId,
                'action_url' => "/tickets",
                'icon' => 'ticket'
            ]));
        }
    }

    // Send inventory notifications
    public function sendInventoryNotification($itemId, $type, $message, $recipientIds = [])
    {
        $recipients = User::whereIn('id', $recipientIds)->get();

        foreach ($recipients as $recipient) {
            $recipient->notify(new InventoryNotification([
                'title' => 'Inventory Alert',
                'message' => $message,
                'item_id' => $itemId,
                'action_url' => "/inventory",
                'icon' => 'inventory'
            ]));
        }
    }

    // Send requisition notifications
    public function sendRequisitionNotification($requisitionId, $type, $message, $recipientIds = [])
    {
        $recipients = User::whereIn('id', $recipientIds)->get();

        foreach ($recipients as $recipient) {
            $recipient->notify(new RequisitionNotification([
                'title' => 'Requisition Update',
                'message' => $message,
                'requisition_id' => $requisitionId,
                'action_url' => "/requisitions",
                'icon' => 'requisition'
            ]));
        }
    }
}
