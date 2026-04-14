import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import {
    Search, Plus, RefreshCw, ClipboardList, CheckCircle,
    Clock, AlertCircle, MessageSquare, X, ChevronDown,
    User, Calendar, Tag, FileText, Flag, Filter, SortDesc
} from 'lucide-react';
import type { PageProps } from '@/types';
import CreateTicketModal from '@/modals/CreateTicketModal';
import AssignTicketModal from '@/modals/AssignTicketModal';
import UpdateTicketModal from '@/modals/UpdateTicketModal';

type Ticket = {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    expires_at?: string;
    is_expired?: boolean;
    last_activity_at?: string;
    time_until_expiration?: string;
    expiration_status?: string;
    submitted_by: {
        id: number;
        name: string;
        email: string;
    };
    assigned_to?: {
        id: number;
        name?: string; // Make this optional
        email?: string; // Make this optional
        is_active?: boolean;
    } | null;
    updates?: {
        id: number;
        message: string;
        created_at: string;
        user: {
            name: string;
        };
    }[];
};

export default function Tickets() {
    const { auth } = usePage<PageProps>().props;
    const role = auth.user.role?.name;
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch tickets based on user role
    useEffect(() => {
        fetchTickets();
    }, [role]);

    // Filter tickets when search query, status filter, or priority filter changes
    useEffect(() => {
        filterTickets();
    }, [searchQuery, statusFilter, priorityFilter, tickets]);

    const fetchTickets = () => {
        setIsLoading(true);
        axios.get('/api/tickets')
            .then(response => {
                setTickets(response.data);
            })
            .catch(error => {
                console.error('Error fetching tickets:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const filterTickets = () => {
        let filtered = [...tickets];

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.status.toLowerCase() === statusFilter);
        }

        // Apply priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.priority.toLowerCase() === priorityFilter);
        }

        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(ticket =>
                // Search by ID (convert to string and check if it includes the query)
                ticket.id.toString().includes(query) ||
                // Search by title
                ticket.title.toLowerCase().includes(query) ||
                // Search by description
                ticket.description.toLowerCase().includes(query) ||
                // Search by submitted user name
                ticket.submitted_by.name.toLowerCase().includes(query) ||
                // Search by assigned user name (if exists)
                (ticket.assigned_to && ticket.assigned_to.name.toLowerCase().includes(query))
            );
        }

        setFilteredTickets(filtered);
    };

    const handleCreateTicket = () => {
        setShowCreateModal(true);
    };

    const handleAssignTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setShowAssignModal(true);
    };

    const handleUpdateTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setShowUpdateModal(true);
    };

    const toggleTicketDetails = (ticketId: number) => {
        setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'new':
                return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
            case 'in_progress':
                return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
            case 'resolved':
                return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
            case 'closed':
                return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
            default:
                return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'critical':
                return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
            case 'high':
                return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
            case 'medium':
                return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
            case 'low':
                return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
            default:
                return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'new':
                return <AlertCircle className="h-4 w-4" />;
            case 'in_progress':
                return <Clock className="h-4 w-4" />;
            case 'resolved':
                return <CheckCircle className="h-4 w-4" />;
            case 'closed':
                return <X className="h-4 w-4" />;
            default:
                return <ClipboardList className="h-4 w-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getReadableStatus = (status: string) => {
        return status.replace('_', ' ');
    };

    // Get ticket stats for summary cards
    const getTicketStats = () => {
        const total = filteredTickets.length;
        const newTickets = filteredTickets.filter(t => t.status === 'new').length;
        const inProgress = filteredTickets.filter(t => t.status === 'in_progress').length;
        const resolved = filteredTickets.filter(t => t.status === 'resolved').length;
        return { total, newTickets, inProgress, resolved };
    };

    const stats = getTicketStats();

    // Add expiration badge function
    const getExpirationBadge = (ticket: Ticket) => {
        if (!ticket.expiration_status || ticket.expiration_status === 'completed') {
            return null;
        }

        const badges = {
            expired: {
                class: 'bg-red-100 text-red-800 border-red-200',
                text: 'EXPIRED',
                icon: <AlertCircle className="h-3 w-3" />
            },
            critical: {
                class: 'bg-red-50 text-red-700 border-red-200',
                text: ticket.time_until_expiration || 'Expires Soon',
                icon: <Clock className="h-3 w-3" />
            },
            warning: {
                class: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                text: ticket.time_until_expiration || 'Expires Soon',
                icon: <Clock className="h-3 w-3" />
            },
            normal: {
                class: 'bg-gray-50 text-gray-600 border-gray-200',
                text: ticket.time_until_expiration || 'On Time',
                icon: <Clock className="h-3 w-3" />
            }
        };

        const badge = badges[ticket.expiration_status as keyof typeof badges];
        if (!badge) return null;

        return (
            <span className={`px-2 py-1 text-xs rounded-full font-medium border flex items-center gap-1 ${badge.class}`}>
                {badge.icon}
                {badge.text}
            </span>
        );
    };

    return (
        <AppLayout>
            <Head title="Tickets" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            Support Tickets
                        </h1>
                        <p className="text-gray-600">Manage and track all support requests</p>
                    </div>

                    {role === 'Staff' && (
                        <button
                            onClick={handleCreateTicket}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Create New Ticket
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<ClipboardList className="w-6 h-6" />}
                    label="Total Tickets"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<AlertCircle className="w-6 h-6" />}
                    label="New Tickets"
                    value={stats.newTickets}
                    color="blue"
                />
                <StatCard
                    icon={<Clock className="w-6 h-6" />}
                    label="In Progress"
                    value={stats.inProgress}
                    color="amber"
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" />}
                    label="Resolved"
                    value={stats.resolved}
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
                                placeholder="Search tickets by ID, title, description, or user..."
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
                        onClick={fetchTickets}
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="new">New</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            <span className="text-gray-600 font-medium">Loading tickets...</span>
                        </div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 mb-4">
                            <ClipboardList className="h-16 w-16 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No tickets found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first ticket'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear search
                            </button>
                        )}
                        {role === 'Staff' && !searchQuery && (
                            <button
                                onClick={handleCreateTicket}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create your first ticket
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredTickets.map(ticket => (
                            <div key={ticket.id} className="hover:bg-gray-50 transition-colors duration-200">
                                {/* Ticket Header */}
                                <div
                                    className="p-6 cursor-pointer"
                                    onClick={() => toggleTicketDetails(ticket.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`p-3 rounded-xl shadow-sm ${getStatusBadge(ticket.status)}`}>
                                                {getStatusIcon(ticket.status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                                                        {ticket.title}
                                                    </h3>
                                                    <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded-md">
                                                        #{ticket.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-4 w-4" />
                                                        <span>{ticket.submitted_by.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{formatDate(ticket.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getExpirationBadge(ticket)}
                                            <span className={`px-3 py-1.5 text-xs rounded-full font-semibold shadow-sm ${getPriorityBadge(ticket.priority)}`}>
                                                <span className="flex items-center gap-1">
                                                    <Flag className="h-3 w-3" />
                                                    {ticket.priority}
                                                </span>
                                            </span>
                                            <span className={`px-3 py-1.5 text-xs rounded-full font-semibold shadow-sm ${getStatusBadge(ticket.status)}`}>
                                                {getReadableStatus(ticket.status)}
                                            </span>
                                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedTicket === ticket.id ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {expandedTicket === ticket.id && (
                                    <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
                                        <div className="pt-6 space-y-6">
                                            {/* Description */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Description
                                                </h4>
                                                <div className="bg-white p-4 rounded-xl border border-gray-200 text-gray-800">
                                                    {ticket.description}
                                                </div>
                                            </div>

                                            {/* Assigned Agent */}
                                            {ticket.assigned_to && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        Assigned Agent
                                                    </h4>
                                                    <div className={`border p-4 rounded-xl flex items-center gap-3 ${
                                                        ticket.assigned_to.is_active === false
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-blue-50 border-blue-200'
                                                    }`}>
                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                                            ticket.assigned_to.is_active === false
                                                                ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                                : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                        }`}>
                                                            {ticket.assigned_to.name ? ticket.assigned_to.name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-gray-800">{ticket.assigned_to.name || 'Unknown User'}</p>
                                                                {ticket.assigned_to.is_active === false && (
                                                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600">{ticket.assigned_to.email || 'No email provided'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Updates */}
                                            {ticket.updates && ticket.updates.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4" />
                                                        Updates ({ticket.updates.length})
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {ticket.updates.map(update => (
                                                            <div key={update.id} className="bg-white border border-gray-200 p-4 rounded-xl">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <p className="font-semibold text-gray-800">{update.user.name}</p>
                                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                                        {formatDate(update.created_at)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700">{update.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                                {/* Admin can assign any new ticket */}
                                                {role === 'Admin' && ticket.status === 'new' && (
                                                    <button
                                                        onClick={() => handleAssignTicket(ticket)}
                                                        className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                                                    >
                                                        <User className="h-4 w-4" />
                                                        Assign Agent
                                                    </button>
                                                )}

                                                {/* IT Agent can ONLY update tickets assigned to them */}
                                                {role === 'IT Agent' &&
                                                 (ticket.status === 'new' || ticket.status === 'in_progress') &&
                                                 ticket.assigned_to?.id === auth.user.id && (
                                                    <button
                                                        onClick={() => handleUpdateTicket(ticket)}
                                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                        Add Update
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateTicketModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchTickets}
            />

            <AssignTicketModal
                show={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onSuccess={fetchTickets}
                ticket={selectedTicket}
            />

            <UpdateTicketModal
                show={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onSuccess={fetchTickets}
                ticket={selectedTicket}
            />
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
        green: 'bg-gradient-to-br from-green-500 to-green-600',
        amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
        purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
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
