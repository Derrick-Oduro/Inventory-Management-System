import { Bell, Check, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAllAsRead,
        handleNotificationClick,
        sendTestNotification,
    } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format time ago
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    // Get icon component based on notification type
    const getNotificationIcon = (notification: Notification) => {
        const iconClass = "w-5 h-5";

        switch (notification.data.icon) {
            case 'ticket':
                return <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>;
            case 'inventory':
                return <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center">
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>;
            case 'requisition':
                return <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center">
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>;
            default:
                return <div className="bg-gray-100 text-gray-600 w-10 h-10 rounded-full flex items-center justify-center">
                    <Bell className={iconClass} />
                </div>;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        fetchNotifications();
                    }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <div className="flex space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={sendTestNotification}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                                Test
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">Loading...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8">
                                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">No notifications</p>
                                <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => {
                                            handleNotificationClick(notification);
                                            setIsOpen(false);
                                        }}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                            !notification.read_at ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {getNotificationIcon(notification)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.data.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.data.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {timeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.read_at && (
                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
