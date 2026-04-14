import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { User, Lock, Palette, Shield, FileText, Settings, ArrowLeft } from 'lucide-react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
        description: 'Personal information',
        color: 'emerald',
    },
    {
        title: 'Security',
        href: '/settings/password',
        icon: Lock,
        description: 'Password & authentication',
        color: 'red',
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: Palette,
        description: 'Theme & display',
        color: 'purple',
    },
    {
        title: 'Audit Logs',
        href: '/settings/audit-logs',
        icon: FileText,
        description: 'Activity monitoring',
        color: 'blue',
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const { auth } = usePage<any>().props;
    const role = auth.user.role?.name;
    const isAdmin = role === 'Admin';

    const currentPath = window.location.pathname;

    // Filter nav items based on user role
    const filteredNavItems = sidebarNavItems.filter(item => {
        // Admin-only pages
        const adminOnlyPages = ['/settings/audit-logs'];

        if (adminOnlyPages.includes(item.href) && !isAdmin) {
            return false;
        }

        return true;
    });

    // Determine if current page needs full width
    const fullWidthPages = ['/settings/audit-logs'];
    const needsFullWidth = fullWidthPages.includes(currentPath);

    // Get current page info
    const currentPageInfo = filteredNavItems.find(item => item.href === currentPath);

    const getColorClasses = (color: string, isActive: boolean) => {
        const colors = {
            emerald: isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
            red: isActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
            purple: isActive ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200',
            orange: isActive ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
            blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            {/* Top Header */}
            <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Back to Dashboard</span>
                            </Link>
                            <div className="w-px h-6 bg-gray-300"></div>
                            <div className="flex items-center space-x-2">
                                <Settings className="w-5 h-5 text-gray-700" />
                                <span className="font-semibold text-gray-900">Settings</span>
                            </div>
                        </div>
                        {/* User Info moved to header */}
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{auth.user.name}</div>
                                    {isAdmin && (
                                        <div className="flex items-center space-x-1">
                                            <Shield className="w-3 h-3 text-orange-500" />
                                            <span className="text-xs font-medium text-orange-600">Admin</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Bar - Moved to top horizontally */}
            <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        {filteredNavItems.map((item, index) => {
                            const isActive = currentPath === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={`${item.href}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 whitespace-nowrap",
                                        isActive
                                            ? "bg-white shadow-lg shadow-blue-500/25 border-2 border-blue-200"
                                            : "bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-md border border-gray-200/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                                        getColorClasses(item.color, isActive)
                                    )}>
                                        {Icon && <Icon className="w-4 h-4" />}
                                    </div>
                                    <div className="text-left">
                                        <div className={cn(
                                            "text-sm font-medium transition-colors",
                                            isActive ? "text-blue-900" : "text-gray-900"
                                        )}>
                                            {item.title}
                                        </div>
                                        <div className={cn(
                                            "text-xs transition-colors",
                                            isActive ? "text-blue-700" : "text-gray-500"
                                        )}>
                                            {item.description}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content - Full width now */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl min-h-[600px] overflow-hidden">
                    {/* Content Header */}
                    {currentPageInfo && (
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50">
                            <div className="flex items-center space-x-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    getColorClasses(currentPageInfo.color, true)
                                )}>
                                    {currentPageInfo.icon && <currentPageInfo.icon className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{currentPageInfo.title}</h1>
                                    <p className="text-gray-600 mt-1">{currentPageInfo.description}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
