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
        <aside className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl ${className}`}>
            {/* Header with Logo */}
            <div className="border-b border-white/10 p-6">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img
                            src="/images/company-logo.jpg"
                            alt="Company Logo"
                            className="h-12 w-12 rounded-xl object-contain shadow-lg ring-1 ring-white/10"
                        />
                        <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-slate-900 bg-emerald-400"></div>
                    </div>
                    <div>
                        <div className="text-xl font-bold tracking-wide">Inventory</div>
                        <div className="text-xs text-slate-300">Management System</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-8 flex-1 px-4">
                <ul className="space-y-2">
                    {navLinks.map((link) => {
                        const isActive = url.startsWith(link.href);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                        isActive
                                            ? 'border border-white/10 bg-white/10 text-white shadow-lg backdrop-blur-sm'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
            <div className="absolute right-4 top-20 h-20 w-20 rounded-full bg-white/5"></div>
            <div className="absolute bottom-40 left-4 h-12 w-12 rounded-full bg-white/5"></div>

            {/* User Profile Section - Adjusted for better fit */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur-sm">
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
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center font-bold border-2 border-white/10 shadow-lg flex-shrink-0 text-sm">
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
                                <div className="text-xs text-slate-300 truncate flex-1 mr-1">{user.email}</div>
                                <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                    user.role?.name === 'Admin' ? 'bg-amber-400/20 text-amber-200' :
                                    user.role?.name === 'Inventory Manager' ? 'bg-emerald-400/20 text-emerald-200' :
                                    'bg-white/10 text-slate-300'
                                }`}>
                                    {user.role?.name || 'Staff'}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Profile Dropdown */}
                    {profileOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 font-bold text-white">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold text-slate-800">{user.name}</div>
                                        <div className="truncate text-sm text-slate-600">{user.email}</div>
                                        <div className="text-xs font-medium text-slate-700">{user.role?.name || 'Staff'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={() => router.post('/logout')}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-rose-700 transition-colors hover:bg-rose-50"
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
