import { useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import RegisterUserModal from '@/modals/registerUserModal';
import EditUserModal from '@/modals/EditUserModal';
import {
    Search, UserPlus, RefreshCw, Edit2, Trash2, Loader,
    Users as UsersIcon, Shield, User, Mail, Filter, ChevronDown, Eye
} from 'lucide-react';

type User = {
    id: number;
    name: string;
    email: string;
    role?: { name: string; id: number };
    created_at?: string;
    email_verified_at?: string;
    is_active?: boolean; // Add this
};

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Fetch users from API when the component loads
    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users when search query or role filter changes
    useEffect(() => {
        filterUsers();
    }, [searchQuery, roleFilter, users]);

    const filterUsers = () => {
        let filtered = [...users];

        // Apply search filter
        if (searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(lowerCaseQuery) ||
                user.email.toLowerCase().includes(lowerCaseQuery) ||
                (user.role?.name && user.role.name.toLowerCase().includes(lowerCaseQuery))
            );
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role?.name?.toLowerCase() === roleFilter);
        }

        setFilteredUsers(filtered);
    };

    const fetchUsers = () => {
        setIsLoading(true);
        axios.get('/api/users').then(response => {
            setUsers(response.data);
        }).catch(error => {
            console.error('Error fetching users:', error);
        }).finally(() => {
            setIsLoading(false);
        });
    };

    const handleToggleStatus = (user: User) => {
        const action = user.is_active ? 'deactivate' : 'activate';
        const confirmMessage = user.is_active
            ? 'Are you sure you want to deactivate this user? They will not be able to log in.'
            : 'Are you sure you want to activate this user? They will be able to log in again.';

        if (confirm(confirmMessage)) {
            axios.patch(`/api/users/${user.id}/toggle-status`)
                .then((response) => {
                    // Update the user in the local state
                    setUsers(users.map(u =>
                        u.id === user.id
                            ? { ...u, is_active: response.data.user.is_active }
                            : u
                    ));

                    const status = response.data.user.is_active ? 'activated' : 'deactivated';
                    console.log(`User ${status} successfully`);
                })
                .catch(error => {
                    console.error('Error updating user status:', error);
                    alert('Failed to update user status');
                });
        }
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleViewDetails = (user: User) => {
        setSelectedUser(user);
        setShowDetailModal(true);
    };

    const handleAddUser = () => {
        setShowAddModal(true);
    };

    const handleAddUserSuccess = () => {
        fetchUsers();
    };

    const handleEditSuccess = () => {
        fetchUsers();
    };

    // Get badge color based on role
    const getRoleBadge = (roleName?: string, isActive: boolean = true) => {
        const baseClasses = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

        if (!isActive) {
            return (
                <span className={`${baseClasses} bg-slate-200 text-slate-600`}>
                    <User className="h-3 w-3" />
                    {roleName || 'N/A'} (Inactive)
                </span>
            );
        }

        switch (roleName?.toLowerCase()) {
            case 'admin':
                return (
                    <span className={`${baseClasses} bg-purple-100 text-purple-700`}>
                        <Shield className="h-3 w-3" />
                        Admin
                    </span>
                );
            case 'inventory manager':
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-700`}>
                        <User className="h-3 w-3" />
                        Inventory Manager
                    </span>
                );
            case 'staff':
                return (
                    <span className={`${baseClasses} bg-emerald-100 text-emerald-700`}>
                        <User className="h-3 w-3" />
                        Staff
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-slate-100 text-slate-700`}>
                        {roleName || 'N/A'}
                    </span>
                );
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get user stats
    const getUserStats = () => {
        const total = filteredUsers.length;
        const admins = filteredUsers.filter(user => user.role?.name?.toLowerCase() === 'admin').length;
        const managers = filteredUsers.filter(user => user.role?.name?.toLowerCase() === 'inventory manager').length;
        const staff = filteredUsers.filter(user => user.role?.name?.toLowerCase() === 'staff').length;
        return { total, admins, managers, staff };
    };

    const stats = getUserStats();

    // Get unique roles for filter
    const uniqueRoles = Array.from(
        new Set(users.map(user => user.role?.name?.toLowerCase()).filter((role): role is string => Boolean(role)))
    );

    return (
        <AppLayout>
            <Head title="Users" />

            {/* Header Section */}
            <div className="mb-4">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
                        <p className="text-sm text-slate-600">Manage system users and their roles</p>
                    </div>

                    <button
                        onClick={handleAddUser}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<UsersIcon className="h-5 w-5" />}
                    label="Total Users"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<Shield className="h-5 w-5" />}
                    label="Administrators"
                    value={stats.admins}
                    color="purple"
                />
                <StatCard
                    icon={<User className="h-5 w-5" />}
                    label="Inventory Managers"
                    value={stats.managers}
                    color="indigo"
                />
                <StatCard
                    icon={<User className="h-5 w-5" />}
                    label="Staff Members"
                    value={stats.staff}
                    color="green"
                />
            </div>

            {/* Search and Filters */}
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-500"
                                placeholder="Search by name, email, or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            showFilters
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchUsers}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">Role</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    {uniqueRoles.map(role => (
                                        <option key={role} value={role}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            <span className="text-sm text-slate-600">Loading users...</span>
                        </div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center">
                        <div className="mb-3 rounded-full bg-slate-100 p-4">
                            <UsersIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="mb-1 text-base font-semibold text-slate-800">No users found</h3>
                        <p className="mb-3 text-sm text-slate-500">
                            {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first user'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Clear search
                            </button>
                        )}
                        {!searchQuery && (
                            <button
                                onClick={handleAddUser}
                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                            >
                                <UserPlus className="h-4 w-4" />
                                Add your first user
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        User
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Email
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Role
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Member Since
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`transition-colors ${
                                            user.is_active === false
                                                ? 'bg-red-50/60 hover:bg-red-100/60'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${
                                                    user.is_active === false
                                                        ? 'bg-slate-400'
                                                        : 'bg-blue-600'
                                                }`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={`flex items-center gap-2 text-sm font-medium ${
                                                        user.is_active === false ? 'text-slate-500' : 'text-slate-900'
                                                    }`}>
                                                        {user.name}
                                                        {user.is_active === false && (
                                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        ID: #{user.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <span className={`text-sm ${
                                                    user.is_active === false ? 'text-slate-500' : 'text-slate-900'
                                                }`}>
                                                    {user.email}
                                                </span>
                                            </div>
                                            {user.email_verified_at && (
                                                <div className="mt-0.5 text-xs text-emerald-600">Verified</div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {getRoleBadge(user.role?.name, user.is_active)}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className={`font-medium ${
                                                user.is_active === false ? 'text-slate-500' : 'text-slate-900'
                                            }`}>
                                                {formatDate(user.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
                                                    onClick={() => handleViewDetails(user)}
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                                                    onClick={() => handleEdit(user)}
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                                                        user.is_active === false
                                                            ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                            : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                                    }`}
                                                    onClick={() => handleToggleStatus(user)}
                                                    title={user.is_active === false ? 'Activate User' : 'Deactivate User'}
                                                >
                                                    {user.is_active === false ? (
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Register User Modal */}
            <RegisterUserModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleAddUserSuccess}
            />

            {/* Edit User Modal */}
            <EditUserModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
                user={selectedUser}
            />

            {/* User Detail Modal */}
            {showDetailModal && selectedUser && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
                    onClick={() => setShowDetailModal(false)}
                >
                    <div
                        className="relative m-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            onClick={() => setShowDetailModal(false)}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white">
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">{selectedUser.name}</h2>
                                <p className="text-sm text-slate-600">User ID: #{selectedUser.id}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-lg border border-slate-200 p-3">
                                <h3 className="mb-2 text-sm font-semibold text-slate-900">Contact Information</h3>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-900">{selectedUser.email}</span>
                                </div>
                                {selectedUser.email_verified_at && (
                                    <div className="mt-1 text-xs text-emerald-600">Email verified</div>
                                )}
                            </div>

                            <div className="rounded-lg border border-slate-200 p-3">
                                <h3 className="mb-2 text-sm font-semibold text-slate-900">Role & Permissions</h3>
                                {getRoleBadge(selectedUser.role?.name, selectedUser.is_active)}
                            </div>

                            <div className="rounded-lg border border-slate-200 p-3">
                                <h3 className="mb-2 text-sm font-semibold text-slate-900">Account Details</h3>
                                <div>
                                    <div className="text-sm text-slate-600">
                                        <span className="font-medium">Member since:</span> {formatDate(selectedUser.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(selectedUser);
                                }}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                            >
                                Edit User
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function StatCard({
    icon,
    label,
    value,
    color
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        green: 'bg-emerald-100 text-emerald-700',
    }[color];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
                <div className={`${colorClasses} rounded-lg p-2`}>
                    {icon}
                </div>
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
        </div>
    );
}
