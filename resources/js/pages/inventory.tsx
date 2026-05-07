import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import {
    Search, Plus, RefreshCw, Filter, Package,
    Edit, ArrowUpDown, Clipboard, ArrowRightLeft,
    AlertTriangle, CheckCircle, PlusCircle, MapPin,
    ChevronDown, TrendingDown, DollarSign
} from 'lucide-react';
import type { PageProps } from '@/types';
import CreateItemModal from '@/modals/CreateItemModal';
import EditItemModal from '@/modals/EditItemModal';
import AdjustQuantityModal from '@/modals/AdjustQuantityModal';
import ViewTransactionsModal from '@/modals/ViewTransactionsModal';
import CreateCategoryModal from '@/modals/CreateCategoryModal';
import CreateUnitModal from '@/modals/CreateUnitModal';
import CreateLocationModal from '@/modals/CreateLocationModal';
import ViewLocationsModal from '@/modals/ViewLocationsModal';
import ManageInventoryOptionsModal from '@/modals/ManageInventoryOptionsModal';
import RecordStockMovementModal from '@/modals/RecordStockMovementModal';

type Category = {
    id: number;
    name: string;
};

type UnitOfMeasure = {
    id: number;
    name: string;
    abbreviation: string;
};

type InventoryItem = {
    id: number;
    name: string;
    sku: string;
    description: string | null;
    category_id: number | null;
    category?: {
        id: number;
        name: string;
    };
    uom_id: number | null;
    unit_of_measure?: {
        id: number;
        name: string;
        abbreviation: string;
    };
    location_id?: number | null;
    quantity: number | string;
    reorder_level: number | string;
    reorder_quantity?: number | string | null;
    cost_price?: number | string | null;
    selling_price?: number | string | null;
    unit_price?: number | string | null;
    is_active: boolean;
    location: { id?: number; name?: string } | string | null;
    image_path: string | null;
    created_at: string;
    updated_at: string;
};

type Location = {
    id: number;
    name: string;
    address: string;
};

export default function Inventory() {
    const { auth } = usePage<PageProps>().props;
    const role = auth.user.role?.name;
    const canManageCatalog = role === 'Admin' || role === 'Inventory Manager';
    const canRecordMovements = ['Admin', 'Inventory Manager', 'Staff'].includes(role ?? '');

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showInactiveItems, setShowInactiveItems] = useState(false);
    const [showLowStock, setShowLowStock] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [sortField, setSortField] = useState<keyof InventoryItem>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showTransactionsModal, setShowTransactionsModal] = useState(false);
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
    const [showCreateUnitModal, setShowCreateUnitModal] = useState(false);
    const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
    const [showViewLocationsModal, setShowViewLocationsModal] = useState(false);
    const [showManageOptionsModal, setShowManageOptionsModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [movementItemId, setMovementItemId] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    useEffect(() => {
        fetchInventoryData();
    }, []);

    useEffect(() => {
        if (items && Array.isArray(items)) {
            filterItems();
        }
    }, [items, searchQuery, categoryFilter, statusFilter, showInactiveItems, showLowStock, sortField, sortDirection]);

    const fetchInventoryData = () => {
        setIsLoading(true);

        axios.get('/api/inventory/items')
            .then(response => {
                console.log('API response:', response.data);
                setItems(response.data.items || []);
                setCategories(response.data.categories || []);
                setUnits(response.data.units || []);
                setLocations(response.data.locations || []);
            })
            .catch(error => {
                console.error('Error fetching inventory data:', error);
                setItems([]);
                setCategories([]);
                setUnits([]);
                setLocations([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const filterItems = () => {
        if (!items || !Array.isArray(items)) {
            setFilteredItems([]);
            return;
        }

        let filtered = [...items];

        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                (item.name ?? '').toLowerCase().includes(query) ||
                (item.sku ?? '').toLowerCase().includes(query) ||
                ((item.description ?? '').toLowerCase().includes(query)) ||
                ((item.category?.name ?? '').toLowerCase().includes(query)) ||
                getLocationName(item).toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(item => item.category_id === parseInt(categoryFilter));
        }

        // Apply status filter
        if (statusFilter === 'active') {
            filtered = filtered.filter(item => item.is_active);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(item => !item.is_active);
        }

        // Apply low stock filter
        if (showLowStock) {
            filtered = filtered.filter(item => Number(item.quantity) <= Number(item.reorder_level));
        }

        // Apply inactive filter
        if (!showInactiveItems && statusFilter !== 'inactive') {
            filtered = filtered.filter(item => item.is_active);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (valueA === null) valueA = '';
            if (valueB === null) valueB = '';

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortDirection === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            return sortDirection === 'asc'
                ? Number(valueA) - Number(valueB)
                : Number(valueB) - Number(valueA);
        });

        setFilteredItems(filtered);
    };

    const handleSort = (field: keyof InventoryItem) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleCreateItem = () => {
        setShowCreateModal(true);
    };

    const handleEditItem = (item: InventoryItem) => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const handleAdjustQuantity = (item: InventoryItem) => {
        setSelectedItem(item);
        setShowAdjustModal(true);
    };

    const handleRecordMovement = (item?: InventoryItem) => {
        setMovementItemId(item?.id ?? null);
        setShowMovementModal(true);
    };

    const handleViewTransactions = (item: InventoryItem) => {
        setSelectedItem(item);
        setShowTransactionsModal(true);
    };

    const handleCreateCategory = () => {
        setShowCreateCategoryModal(true);
    };

    const handleCreateUnit = () => {
        setShowCreateUnitModal(true);
    };

    const handleCreateLocation = () => {
        setShowCreateLocationModal(true);
    };

    const handleViewLocations = () => {
        setShowViewLocationsModal(true);
    };

    const handleManageOptions = () => {
        setShowManageOptionsModal(true);
    };

    const renderStockStatus = (item: InventoryItem) => {
        const quantity = Number(item.quantity);
        const reorderLevel = Number(item.reorder_level);

        if (quantity <= 0) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    Out of Stock
                </span>
            );
        }

        if (quantity <= reorderLevel) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    Low Stock
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle className="h-3 w-3" />
                In Stock
            </span>
        );
    };

    const getLocationName = (item: InventoryItem): string => {
        if (typeof item.location === 'string') {
            return item.location;
        }

        if (item.location && typeof item.location.name === 'string') {
            return item.location.name;
        }

        return '';
    };

    const fetchLocations = () => {
        axios.get('/api/locations')
            .then(response => {
                setLocations(response.data || []);
            })
            .catch(error => {
                console.error('Error fetching locations:', error);
            });
    };

    // Get inventory stats
    const getInventoryStats = () => {
        if (!items || !Array.isArray(items)) return { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };

        const total = items.filter(item => item.is_active).length;
        const lowStock = items.filter(item =>
            item.is_active &&
            Number(item.quantity) <= Number(item.reorder_level) &&
            Number(item.quantity) > 0
        ).length;
        const outOfStock = items.filter(item => item.is_active && Number(item.quantity) <= 0).length;
        const totalValue = items
            .filter(item => item.is_active)
            .reduce((sum, item) => {
                const unitCost = Number(item.cost_price ?? item.unit_price ?? 0);
                return sum + (Number(item.quantity) * unitCost);
            }, 0);

        return { total, lowStock, outOfStock, totalValue };
    };

    const stats = getInventoryStats();

    return (
        <AppLayout>
            <Head title="Products & Stock" />

            {/* Header Section */}
            <div className="mb-4">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Products & Stock</h1>
                        <p className="text-sm text-slate-600">Track and manage your inventory items</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {canRecordMovements && (
                            <button
                                onClick={() => handleRecordMovement()}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                                Record Movement
                            </button>
                        )}

                        {canManageCatalog && (
                            <>
                                <button
                                    onClick={handleCreateItem}
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </button>
                                <button
                                    onClick={handleCreateCategory}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Category
                                </button>
                                <button
                                    onClick={handleCreateUnit}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Unit
                                </button>
                                <button
                                    onClick={handleCreateLocation}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<Package className="h-5 w-5" />}
                    label="Total Items"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<TrendingDown className="h-5 w-5" />}
                    label="Low Stock"
                    value={stats.lowStock}
                    color="amber"
                />
                <StatCard
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label="Out of Stock"
                    value={stats.outOfStock}
                    color="red"
                />
                <StatCard
                    icon={<DollarSign className="h-5 w-5" />}
                    label="Total Value"
                    value={stats.totalValue.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}
                    color="green"
                    isValue={true}
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
                                placeholder="Search by name, SKU, category, description, or location..."
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
                        onClick={fetchInventoryData}
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
                        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">Category</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="all">All Categories</option>
                                    {categories && categories.length > 0 ? (
                                        categories.map(category => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No categories available</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                            {canManageCatalog && (
                                <div className="flex items-end">
                                    <button
                                        onClick={handleManageOptions}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                                    >
                                        <Package className="h-4 w-4" />
                                        Manage
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <label className="inline-flex items-center text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-blue-600"
                                    checked={showInactiveItems}
                                    onChange={(e) => setShowInactiveItems(e.target.checked)}
                                />
                                <span className="ml-2">Show Inactive Items</span>
                            </label>

                            <label className="inline-flex items-center text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-blue-600"
                                    checked={showLowStock}
                                    onChange={(e) => setShowLowStock(e.target.checked)}
                                />
                                <span className="ml-2">Show Low Stock Only</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Inventory Items */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            <span className="text-sm text-slate-600">Loading inventory...</span>
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center">
                        <div className="mb-3 rounded-full bg-slate-100 p-4">
                            <Package className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="mb-1 text-base font-semibold text-slate-800">No inventory items found</h3>
                        <p className="mb-3 text-sm text-slate-500">
                            {searchQuery ? 'Try adjusting your search terms or filters' : 'Get started by adding your first inventory item'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Clear search
                            </button>
                        )}
                        {canManageCatalog && !searchQuery && (
                            <button
                                onClick={handleCreateItem}
                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                            >
                                <Plus className="h-4 w-4" />
                                Add your first item
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <button
                                            className="flex items-center space-x-1 transition-colors hover:text-blue-600"
                                            onClick={() => handleSort('name')}
                                        >
                                            <span>Item</span>
                                            {sortField === 'name' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <button
                                            className="flex items-center space-x-1 transition-colors hover:text-blue-600"
                                            onClick={() => handleSort('sku')}
                                        >
                                            <span>SKU</span>
                                            {sortField === 'sku' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Category
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <button
                                            className="flex items-center space-x-1 transition-colors hover:text-blue-600"
                                            onClick={() => handleSort('quantity')}
                                        >
                                            <span>Stock</span>
                                            {sortField === 'quantity' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <button
                                            className="flex items-center space-x-1 transition-colors hover:text-blue-600"
                                            onClick={() => handleSort('cost_price')}
                                        >
                                            <span>Cost / Sell</span>
                                            {sortField === 'cost_price' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`${!item.is_active ? 'bg-slate-50/70 opacity-80' : 'hover:bg-slate-50'} transition-colors`}
                                    >
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center">
                                                {item.image_path ? (
                                                    <div className="mr-3 h-10 w-10 flex-shrink-0">
                                                        <img
                                                            className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                                                            src={`/storage/${item.image_path}`}
                                                            alt={item.name}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                                                        <Package className="h-5 w-5 text-slate-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {item.name}
                                                    </div>
                                                    {getLocationName(item) && (
                                                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                            <MapPin className="h-3 w-3" />
                                                            {getLocationName(item)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                                                {item.sku}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {item.category?.name ? (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                    {item.category.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="text-sm font-semibold text-slate-900">
                                                {item.quantity}
                                            </div>
                                            <div className="mt-0.5 text-xs text-slate-500">
                                                Level: {item.reorder_level} | Reorder Qty: {item.reorder_quantity ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="space-y-1">
                                                {renderStockStatus(item)}
                                                {!item.is_active && (
                                                    <div>
                                                        <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                            Inactive
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="text-xs text-slate-600">
                                                <div>
                                                    Cost: <span className="font-medium text-slate-900">{Number(item.cost_price ?? item.unit_price ?? 0).toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</span>
                                                </div>
                                                <div>
                                                    Sell: <span className="font-medium text-slate-900">{Number(item.selling_price ?? item.unit_price ?? 0).toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
                                                    onClick={() => handleViewTransactions(item)}
                                                    title="View Transaction History"
                                                >
                                                    <Clipboard className="h-4 w-4" />
                                                </button>

                                                {canRecordMovements && (
                                                    <>
                                                        <button
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                                                            disabled={!item.is_active}
                                                            onClick={() => handleRecordMovement(item)}
                                                            title={item.is_active ? 'Record Movement' : 'Inactive items cannot have stock movements'}
                                                        >
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                                                            disabled={!item.is_active}
                                                            onClick={() => handleAdjustQuantity(item)}
                                                            title={item.is_active ? 'Manual Adjustment' : 'Inactive items cannot have stock movements'}
                                                        >
                                                            <Package className="h-4 w-4" />
                                                        </button>

                                                        {canManageCatalog && (
                                                            <button
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-amber-600 hover:bg-amber-50 hover:text-amber-900"
                                                                onClick={() => handleEditItem(item)}
                                                                title="Edit Item"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </>
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
            <CreateItemModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchInventoryData}
                categories={categories}
                units={units}
                locations={locations}
            />

            <EditItemModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={fetchInventoryData}
                item={selectedItem}
                categories={categories}
                units={units}
                locations={locations}
            />

            <AdjustQuantityModal
                show={showAdjustModal}
                onClose={() => setShowAdjustModal(false)}
                onSuccess={fetchInventoryData}
                item={selectedItem}
                locations={locations}
            />

            <ViewTransactionsModal
                show={showTransactionsModal}
                onClose={() => setShowTransactionsModal(false)}
                item={selectedItem}
            />

            <CreateCategoryModal
                show={showCreateCategoryModal}
                onClose={() => setShowCreateCategoryModal(false)}
                onSuccess={fetchInventoryData}
            />

            <CreateUnitModal
                show={showCreateUnitModal}
                onClose={() => setShowCreateUnitModal(false)}
                onSuccess={fetchInventoryData}
            />

            <CreateLocationModal
                show={showCreateLocationModal}
                onClose={() => setShowCreateLocationModal(false)}
                onSuccess={() => {
                    setShowCreateLocationModal(false);
                    fetchLocations();
                }}
            />

            <ViewLocationsModal
                show={showViewLocationsModal}
                onClose={() => setShowViewLocationsModal(false)}
            />

            <ManageInventoryOptionsModal
                show={showManageOptionsModal}
                onClose={() => setShowManageOptionsModal(false)}
                onSuccess={fetchInventoryData}
            />

            <RecordStockMovementModal
                show={showMovementModal}
                onClose={() => {
                    setShowMovementModal(false);
                    setMovementItemId(null);
                }}
                onSuccess={fetchInventoryData}
                items={items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    is_active: item.is_active,
                }))}
                locations={locations.map((location) => ({
                    id: location.id,
                    name: location.name,
                }))}
                initialItemId={movementItemId}
            />
        </AppLayout>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
    isValue = false
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
    isValue?: boolean;
}) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-700',
        green: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        purple: 'bg-purple-100 text-purple-700',
    }[color];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
                <div className={`${colorClasses} rounded-lg p-2`}>
                    {icon}
                </div>
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
                {isValue ? value : typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="text-xs text-slate-500">{label}</div>
        </div>
    );
}
