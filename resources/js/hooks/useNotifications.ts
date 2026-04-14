import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export interface Notification {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        action_url?: string;
        icon?: string;
        item_id?: string;
        ticket_id?: string;
        requisition_id?: string;
    };
    read_at: string | null;
    created_at: string;
}

export interface NotificationHook {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    handleNotificationClick: (notification: Notification) => void;
    sendTestNotification: () => Promise<void>;
}

export const useNotifications = (): NotificationHook => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications from the server
    const fetchNotifications = useCallback(async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    // Mark a single notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await axios.post(`/api/notifications/${notificationId}/mark-read`);
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId
                        ? { ...notif, read_at: new Date().toISOString() }
                        : notif
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            await axios.post('/api/notifications/mark-all-read');
            setNotifications(prev =>
                prev.map(notif => ({
                    ...notif,
                    read_at: new Date().toISOString()
                }))
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    // Handle notification click
    const handleNotificationClick = useCallback((notification: Notification) => {
        if (!notification.read_at) {
            markAsRead(notification.id);
        }

        if (notification.data.action_url) {
            router.visit(notification.data.action_url);
        }
    }, [markAsRead]);

    // Send test notification
    const sendTestNotification = useCallback(async () => {
        try {
            await axios.post('/api/notifications/test');
            // Refresh notifications after sending test
            setTimeout(fetchNotifications, 1000);
        } catch (error) {
            console.error('Error sending test notification:', error);
        }
    }, [fetchNotifications]);

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.read_at).length;

    // Auto-fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Set up polling for new notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        handleNotificationClick,
        sendTestNotification,
    };
};
