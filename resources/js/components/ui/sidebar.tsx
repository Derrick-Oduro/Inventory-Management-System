import { Link, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SidebarProps {
    className?: string;
    navLinks: Array<{
        href: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        adminOnly?: boolean;
    }>;
    user: {
        name: string;
        email: string;
        avatar?: string;
        role?: { name: string };
    };
}

export default function Sidebar({ className, navLinks, user }: SidebarProps) {
    const { url } = usePage();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <aside className={`bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white shadow-2xl ${className}`}>
            {/* Header with Logo */}
            <div className="p-6 border-b border-white/20">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img
                            src="/images/company-logo.jpg"
                            alt="Company Logo"
                            className="h-12 w-12 object-contain rounded-xl shadow-lg"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <div className="text-xl font-bold tracking-wide">IT Support</div>
                        <div className="text-xs text-blue-100 opacity-90">System</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-8 px-4 flex-1">
                <ul className="space-y-2">
                    {navLinks.map((link) => {
                        const isActive = url.startsWith(link.href);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                        isActive
                                            ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                                            : 'hover:bg-white/10 text-blue-100 hover:text-white'
                                    }`}
                                >
                                    <link.icon className={`w-5 h-5 transition-transform duration-200 ${
                                        isActive ? 'scale-110' : 'group-hover:scale-105'
                                    }`} />
                                    <span className="font-medium">{link.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Decorative Elements */}
            <div className="absolute top-20 right-4 w-20 h-20 bg-white/5 rounded-full"></div>
            <div className="absolute bottom-40 left-4 w-12 h-12 bg-white/5 rounded-full"></div>

            {/* User Profile Section - Adjusted for better fit */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/20 bg-gradient-to-r from-blue-800/50 to-blue-900/50 backdrop-blur-sm">
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
                    >
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt="Profile"
                                className="w-9 h-9 rounded-full border-2 border-white/30 object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold border-2 border-white/30 shadow-lg flex-shrink-0 text-sm">
                                {user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                            </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                            <div className="font-semibold text-white truncate text-sm">{user.name}</div>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-blue-200 truncate flex-1 mr-1">{user.email}</div>
                                <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                    user.role?.name === 'Admin' ? 'bg-yellow-400/20 text-yellow-300' :
                                    user.role?.name === 'IT Agent' ? 'bg-green-400/20 text-green-300' :
                                    'bg-gray-400/20 text-gray-300'
                                }`}>
                                    {user.role?.name || 'Staff'}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Profile Dropdown */}
                    {profileOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-gray-800 truncate">{user.name}</div>
                                        <div className="text-sm text-gray-600 truncate">{user.email}</div>
                                        <div className="text-xs text-blue-600 font-medium">{user.role?.name || 'Staff'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={() => router.post('/logout')}
                                    className="w-full text-left px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
