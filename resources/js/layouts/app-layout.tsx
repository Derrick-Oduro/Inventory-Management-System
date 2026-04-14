import Sidebar from '@/components/ui/sidebar';
import { Bell, User, LogOut, Package, MapPin, ClipboardList, Users, Settings, LayoutGrid, Check, X } from 'lucide-react';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import axios from 'axios';

type AppLayoutProps = {
    children: ReactNode;
};

type Auth = {
    user: {
        name: string;
        email: string;
        avatar?: string;
        role?: { name: string };
    };
};

type Notification = {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        action_url?: string;
        icon?: string;
    };
    read_at: string | null;
    created_at: string;
};

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/tickets', label: 'Tickets', icon: ClipboardList },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/requisitions', label: 'Requisitions', icon: ClipboardList },
    { href: '/users', label: 'Users', icon: Users, adminOnly: true },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const userRole = user.role?.name;

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    const notificationsRef = useRef<HTMLDivElement>(null);

    // Filter navigation links based on user role
    const filteredNavLinks = navLinks.filter(link => {
        if (link.adminOnly && userRole !== 'Admin') {
            return false;
        }
        return true;
    });

    // Fetch notifications
    const fetchNotifications = async () => {
        if (isLoadingNotifications) return;

        setIsLoadingNotifications(true);
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            await axios.post('/api/notifications/mark-all-read');
            setNotifications(prev => prev.map(notif => ({ ...notif, read_at: new Date().toISOString() })));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    // Mark single notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            await axios.post(`/api/notifications/${notificationId}/mark-read`);
            setNotifications(prev => prev.map(notif =>
                notif.id === notificationId
                    ? { ...notif, read_at: new Date().toISOString() }
                    : notif
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            markAsRead(notification.id);
        }

        if (notification.data.action_url) {
            router.visit(notification.data.action_url);
        }

        setNotificationsOpen(false);
    };

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read_at).length;

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

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications on component mount
    useEffect(() => {
        fetchNotifications();

        // Set up polling for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                className="fixed top-0 left-0 z-40 w-64 h-screen"
                navLinks={filteredNavLinks}
                user={user}
            />

            {/* Main Content Area */}
            <div className="ml-64 min-h-screen bg-gray-50">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex items-center justify-end px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
                    {/* Right side - only notifications now */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <div className="relative" ref={notificationsRef}>
                            <button
                                onClick={() => {
                                    setNotificationsOpen((open) => !open);
                                    if (!notificationsOpen) {
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
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto">
                                        {isLoadingNotifications ? (
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
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                            !notification.read_at ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                                                notification.data.icon === 'ticket' ? 'bg-blue-100 text-blue-600' :
                                                                notification.data.icon === 'inventory' ? 'bg-green-100 text-green-600' :
                                                                notification.data.icon === 'requisition' ? 'bg-purple-100 text-purple-600' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {notification.data.icon === 'ticket' && <ClipboardList className="w-5 h-5" />}
                                                                {notification.data.icon === 'inventory' && <Package className="w-5 h-5" />}
                                                                {notification.data.icon === 'requisition' && <ClipboardList className="w-5 h-5" />}
                                                                {!notification.data.icon && <Bell className="w-5 h-5" />}
                                                            </div>
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
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
