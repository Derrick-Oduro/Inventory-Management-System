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
        const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm";

        if (!isActive) {
            return (
                <span className={`${baseClasses} bg-gray-200 text-gray-600`}>
                    <User className="h-3 w-3" />
                    {roleName || 'N/A'} (Inactive)
                </span>
            );
        }

        switch (roleName?.toLowerCase()) {
            case 'admin':
                return (
                    <span className={`${baseClasses} bg-gradient-to-r from-purple-500 to-purple-600 text-white`}>
                        <Shield className="h-3 w-3" />
                        Admin
                    </span>
                );
            case 'it agent':
                return (
                    <span className={`${baseClasses} bg-gradient-to-r from-blue-500 to-blue-600 text-white`}>
                        <User className="h-3 w-3" />
                        IT Agent
                    </span>
                );
            case 'staff':
                return (
                    <span className={`${baseClasses} bg-gradient-to-r from-green-500 to-green-600 text-white`}>
                        <User className="h-3 w-3" />
                        Staff
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
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
        const agents = filteredUsers.filter(user => user.role?.name?.toLowerCase() === 'it agent').length;
        const staff = filteredUsers.filter(user => user.role?.name?.toLowerCase() === 'staff').length;
        return { total, admins, agents, staff };
    };

    const stats = getUserStats();

    // Get unique roles for filter
    const uniqueRoles = Array.from(new Set(users.map(user => user.role?.name?.toLowerCase()).filter(Boolean)));

    return (
        <AppLayout>
            <Head title="Users" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            User Management
                        </h1>
                        <p className="text-gray-600">Manage system users and their roles</p>
                    </div>

                    <button
                        onClick={handleAddUser}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                        <UserPlus className="h-5 w-5" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<UsersIcon className="w-6 h-6" />}
                    label="Total Users"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<Shield className="w-6 h-6" />}
                    label="Administrators"
                    value={stats.admins}
                    color="purple"
                />
                <StatCard
                    icon={<User className="w-6 h-6" />}
                    label="IT Agents"
                    value={stats.agents}
                    color="indigo"
                />
                <StatCard
                    icon={<User className="w-6 h-6" />}
                    label="Staff Members"
                    value={stats.staff}
                    color="green"
                />
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                                placeholder="Search by name, email, or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                            showFilters
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                        }`}
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchUsers}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all duration-200"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    {uniqueRoles.map(role => (
                                        <option key={role} value={role}>
                                            {role?.charAt(0).toUpperCase() + role?.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            <span className="text-gray-600 font-medium">Loading users...</span>
                        </div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 mb-4">
                            <UsersIcon className="h-16 w-16 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No users found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first user'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear search
                            </button>
                        )}
                        {!searchQuery && (
                            <button
                                onClick={handleAddUser}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <UserPlus className="h-4 w-4" />
                                Add your first user
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Member Since
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`transition-colors duration-200 ${
                                            user.is_active === false
                                                ? 'bg-red-50 hover:bg-red-100'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                                    user.is_active === false
                                                        ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                }`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={`font-semibold text-lg flex items-center gap-2 ${
                                                        user.is_active === false ? 'text-gray-500' : 'text-gray-900'
                                                    }`}>
                                                        {user.name}
                                                        {user.is_active === false && (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: #{user.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className={`font-medium ${
                                                    user.is_active === false ? 'text-gray-500' : 'text-gray-900'
                                                }`}>
                                                    {user.email}
                                                </span>
                                            </div>
                                            {user.email_verified_at && (
                                                <div className="text-xs text-green-600 mt-1">✓ Verified</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role?.name, user.is_active)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`font-medium ${
                                                user.is_active === false ? 'text-gray-500' : 'text-gray-900'
                                            }`}>
                                                {formatDate(user.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                                                    onClick={() => handleViewDetails(user)}
                                                    title="View Details"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                                    onClick={() => handleEdit(user)}
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                <button
                                                    className={`p-2 rounded-xl transition-all duration-200 ${
                                                        user.is_active === false
                                                            ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                            : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                                    }`}
                                                    onClick={() => handleToggleStatus(user)}
                                                    title={user.is_active === false ? 'Activate User' : 'Deactivate User'}
                                                >
                                                    {user.is_active === false ? (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative m-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                            onClick={() => setShowDetailModal(false)}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                                <p className="text-gray-600">User ID: #{selectedUser.id}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900">{selectedUser.email}</span>
                                </div>
                                {selectedUser.email_verified_at && (
                                    <div className="text-xs text-green-600 mt-1">✓ Email verified</div>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Role & Permissions</h3>
                                {getRoleBadge(selectedUser.role?.name, selectedUser.is_active)}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Account Details</h3>
                                <div className="space-y-1">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Member since:</span> {formatDate(selectedUser.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(selectedUser);
                                }}
                                className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-all duration-200"
                            >
                                Edit User
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
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
        blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
        purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
        indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        green: 'bg-gradient-to-br from-green-500 to-green-600',
    }[color];

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className={`${colorClasses} text-white rounded-xl p-3 shadow-lg`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
            <div className="text-gray-600 font-medium">{label}</div>
        </div>
    );
}
