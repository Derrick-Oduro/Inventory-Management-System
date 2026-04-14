import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Search, Filter, Download, Calendar, User, RefreshCw, ChevronDown, Eye } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Audit Logs',
        href: '/settings/audit-logs',
    },
];

type AuditLog = {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    action: string;
    description: string;
    entity_type: string | null;
    entity_id: number | null;
    ip_address: string | null;
    created_at: string;
    old_values: any;
    new_values: any;
};

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [actions, setActions] = useState<string[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);

    useEffect(() => {
        fetchLogs();
        fetchFilters();
    }, [currentPage, searchQuery, dateFrom, dateTo, selectedAction, selectedUser]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                per_page: '50',
            });

            if (searchQuery) params.append('search', searchQuery);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            if (selectedAction) params.append('action', selectedAction);
            if (selectedUser) params.append('user_id', selectedUser);

            const response = await axios.get(`/api/audit-logs?${params}`);
            setLogs(response.data.data);
            setCurrentPage(response.data.current_page);
            setTotalPages(response.data.last_page);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const [actionsRes, usersRes] = await Promise.all([
                axios.get('/api/audit-logs/actions'),
                axios.get('/api/audit-logs/users')
            ]);
            setActions(actionsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            if (selectedAction) params.append('action', selectedAction);
            if (selectedUser) params.append('user_id', selectedUser);

            const response = await axios.get(`/api/audit-logs/export?${params}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionBadgeColor = (action: string) => {
        const colorMap: { [key: string]: string } = {
            'USER_CREATE': 'bg-green-100 text-green-700',
            'USER_UPDATE': 'bg-blue-100 text-blue-700',
            'USER_DELETE': 'bg-red-100 text-red-700',
            'USER_STATUS_CHANGE': 'bg-yellow-100 text-yellow-700',
            'TICKET_CREATE': 'bg-green-100 text-green-700',
            'TICKET_ASSIGN': 'bg-blue-100 text-blue-700',
            'TICKET_UPDATE': 'bg-yellow-100 text-yellow-700',
            'INVENTORY_CREATE': 'bg-green-100 text-green-700',
            'INVENTORY_UPDATE': 'bg-blue-100 text-blue-700',
            'INVENTORY_DELETE': 'bg-red-100 text-red-700',
            'INVENTORY_ADJUST': 'bg-purple-100 text-purple-700',
            'LOCATION_CREATE': 'bg-green-100 text-green-700',
            'LOCATION_UPDATE': 'bg-blue-100 text-blue-700',
            'LOCATION_DELETE': 'bg-red-100 text-red-700',
        };
        return colorMap[action] || 'bg-gray-100 text-gray-700';
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
        setSelectedAction('');
        setSelectedUser('');
        setCurrentPage(1);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />

            <SettingsLayout>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <HeadingSmall title="Audit Logs" description="System activity and user actions" />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
                    <div className="flex gap-3 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-9"
                                size="sm"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
                                    <select
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-8"
                                        value={selectedAction}
                                        onChange={(e) => setSelectedAction(e.target.value)}
                                    >
                                        <option value="">All Actions</option>
                                        {actions.map(action => (
                                            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
                                    <select
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-8"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                    >
                                        <option value="">All Users</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end mt-3">
                                <Button variant="ghost" onClick={clearFilters} size="sm" className="text-xs">
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500 text-sm">No audit logs found</div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Entity
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Timestamp
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IP
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">

                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {logs.map(log => (
                                            <>
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center">
                                                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                                                                <User className="h-3 w-3 text-gray-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                    {log.user ? log.user.name : 'System'}
                                                                </div>
                                                                {log.user && (
                                                                    <div className="text-xs text-gray-500 truncate">
                                                                        {log.user.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(log.action)}`}>
                                                            {log.action.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm text-gray-900 max-w-xs truncate" title={log.description}>
                                                            {log.description}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-gray-500">
                                                        {log.entity_type && (
                                                            <span className="truncate">
                                                                {log.entity_type}
                                                                {log.entity_id && ` #${log.entity_id}`}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-xs text-gray-500">
                                                            {formatDate(log.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-500">
                                                        {log.ip_address || '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        {(log.old_values || log.new_values) && (
                                                            <button
                                                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                                title="View details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                                {expandedLog === log.id && (log.old_values || log.new_values) && (
                                                    <tr>
                                                        <td colSpan={7} className="px-3 py-3 bg-gray-50">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                                                                {log.old_values && (
                                                                    <div>
                                                                        <h5 className="font-medium text-gray-700 mb-1">Previous Values:</h5>
                                                                        <pre className="bg-white p-2 rounded border overflow-x-auto text-xs">
                                                                            {JSON.stringify(log.old_values, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                {log.new_values && (
                                                                    <div>
                                                                        <h5 className="font-medium text-gray-700 mb-1">New Values:</h5>
                                                                        <pre className="bg-white p-2 rounded border overflow-x-auto text-xs">
                                                                            {JSON.stringify(log.new_values, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-2 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-xs text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="text-xs px-2 py-1 h-7"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="text-xs px-2 py-1 h-7"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
