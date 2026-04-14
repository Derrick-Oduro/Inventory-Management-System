import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import {
    Search, Plus, ClipboardList, X, CheckCircle,
    AlertTriangle, Clock, Package, Filter, RefreshCw,
    ChevronDown, ChevronUp, Eye, ShoppingCart, User,
    Calendar, Hash, TrendingUp
} from 'lucide-react';
import type { PageProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateRequisitionModal from '@/modals/CreateRequisitionModal';
import ViewRequisitionModal from '@/modals/ViewRequisitionModal';
import ApproveRequisitionModal from '@/modals/ApproveRequisitionModal';
import { Requisition as BaseRequisition, RequisitionItem } from '@/types/requisition';

type Requisition = BaseRequisition & {
    urgency_level?: 'low' | 'medium' | 'high' | 'critical';
};

export default function Requisitions() {
    const { auth } = usePage<PageProps>().props;
    const role = auth.user.role?.name;
    const isAdmin = role === 'Admin';

    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
    const [sortField, setSortField] = useState<'created_at' | 'urgency_level'>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchRequisitions();
    }, []);

    useEffect(() => {
        filterRequisitions();
    }, [requisitions, searchQuery, statusFilter, sortField, sortDirection]);

    const fetchRequisitions = () => {
        setIsLoading(true);

        axios.get('/api/requisitions')
            .then(response => {
                console.log('Requisitions API response:', response.data);
                setRequisitions(response.data);
            })
            .catch(error => {
                console.error('Error fetching requisitions:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const filterRequisitions = () => {
        if (!requisitions || !Array.isArray(requisitions)) {
            setFilteredRequisitions([]);
            return;
        }

        let filtered = [...requisitions];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(req =>
                req.reference_number?.toLowerCase().includes(query) ||
                req.created_by?.name?.toLowerCase().includes(query) ||
                req.item?.name?.toLowerCase().includes(query) ||
                req.item?.sku?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        // Apply sorting
        const urgencyOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        filtered.sort((a, b) => {
            if (sortField === 'created_at') {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortField === 'urgency_level') {
                const levelA = urgencyOrder[(a.urgency_level ?? 'low') as keyof typeof urgencyOrder] || 0;
                const levelB = urgencyOrder[(b.urgency_level ?? 'low') as keyof typeof urgencyOrder] || 0;
                return sortDirection === 'asc' ? levelA - levelB : levelB - levelA;
            }
            return 0;
        });

        setFilteredRequisitions(filtered);
    };

    const handleSort = (field: 'created_at' | 'urgency_level') => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleCreateRequisition = () => {
        setShowCreateModal(true);
    };

    const handleViewRequisition = (requisition: Requisition) => {
        setSelectedRequisition(requisition);
        setShowViewModal(true);
    };

    const handleApproveRequisition = (requisition: Requisition) => {
        setSelectedRequisition(requisition);
        setShowApproveModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                        <Clock className="h-3 w-3" />
                        Pending
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                    </span>
                );
            case 'partially_approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                        <AlertTriangle className="h-3 w-3" />
                        Partial
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                        <X className="h-3 w-3" />
                        Rejected
                    </span>
                );
            case 'fulfilled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm">
                        <CheckCircle className="h-3 w-3" />
                        Fulfilled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    const getUrgencyBadge = (level: string) => {
        switch (level) {
            case 'low':
                return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Low</span>;
            case 'medium':
                return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Medium</span>;
            case 'high':
                return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">High</span>;
            case 'critical':
                return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Critical</span>;
            default:
                return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{level}</span>;
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

    // Get requisition stats
    const getRequisitionStats = () => {
        const total = filteredRequisitions.length;
        const pending = filteredRequisitions.filter(req => req.status === 'pending').length;
        const approved = filteredRequisitions.filter(req => req.status === 'approved').length;
        const fulfilled = filteredRequisitions.filter(req => req.status === 'fulfilled').length;
        return { total, pending, approved, fulfilled };
    };

    const stats = getRequisitionStats();

    return (
        <AppLayout>
            <Head title="Requisitions" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            Purchase Requisitions
                        </h1>
                        <p className="text-gray-600">Manage and track purchase requests</p>
                    </div>

                    <button
                        onClick={handleCreateRequisition}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        New Requisition
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<ClipboardList className="w-6 h-6" />}
                    label="Total Requisitions"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<Clock className="w-6 h-6" />}
                    label="Pending Review"
                    value={stats.pending}
                    color="amber"
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" />}
                    label="Approved"
                    value={stats.approved}
                    color="green"
                />
                <StatCard
                    icon={<Package className="w-6 h-6" />}
                    label="Fulfilled"
                    value={stats.fulfilled}
                    color="purple"
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
                                placeholder="Search by reference number, requestor, or items..."
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
                        onClick={fetchRequisitions}
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
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="partially_approved">Partially Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="fulfilled">Fulfilled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                <select
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={`${sortField}-${sortDirection}`}
                                    onChange={(e) => {
                                        const [field, direction] = e.target.value.split('-');
                                        setSortField(field as 'created_at' | 'urgency_level');
                                        setSortDirection(direction as 'asc' | 'desc');
                                    }}
                                >
                                    <option value="created_at-desc">Newest First</option>
                                    <option value="created_at-asc">Oldest First</option>
                                    <option value="urgency_level-desc">High Priority First</option>
                                    <option value="urgency_level-asc">Low Priority First</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Requisitions List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            <span className="text-gray-600 font-medium">Loading requisitions...</span>
                        </div>
                    </div>
                ) : filteredRequisitions.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 mb-4">
                            <ClipboardList className="h-16 w-16 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No requisitions found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first requisition'}
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
                                onClick={handleCreateRequisition}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create your first requisition
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Item Details
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        <button
                                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                            onClick={() => handleSort('created_at')}
                                        >
                                            <span>Date Requested</span>
                                            {sortField === 'created_at' && (
                                                sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Requestor
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequisitions.map((requisition) => (
                                    <tr
                                        key={requisition.id}
                                        className="hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-3 shadow-lg">
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-lg mb-1">
                                                        {requisition.item?.name || 'Unknown Item'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                                        <Hash className="h-3 w-3" />
                                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                            {requisition.item?.sku || 'N/A'}
                                                        </span>
                                                    </div>
                                                    {requisition.reference_number && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            Ref: {requisition.reference_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(requisition.created_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                                                    {(requisition.created_by?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {requisition.created_by?.name || 'Unknown User'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-lg font-bold text-gray-900">
                                                {requisition.quantity}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {requisition.item?.unit_of_measure?.abbreviation || 'units'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(requisition.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                                                    onClick={() => handleViewRequisition(requisition)}
                                                    title="View Details"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>

                                                {isAdmin && requisition.status === 'pending' && (
                                                    <button
                                                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-xl transition-all duration-200"
                                                        onClick={() => handleApproveRequisition(requisition)}
                                                        title="Review Requisition"
                                                    >
                                                        <CheckCircle className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateRequisitionModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchRequisitions}
            />

            <ViewRequisitionModal
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                requisition={selectedRequisition}
            />

            <ApproveRequisitionModal
                show={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onSuccess={fetchRequisitions}
                requisition={selectedRequisition}
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
