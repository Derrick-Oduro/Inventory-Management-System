import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import {
    Search, Plus, RefreshCw, Archive, Filter, Package,
    Edit, Trash2, Eye, ArrowUpDown, Clipboard, Boxes,
    AlertTriangle, CheckCircle, FileText, PlusCircle, MapPin,
    ChevronDown, TrendingDown, TrendingUp, DollarSign
} from 'lucide-react';
import type { PageProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateItemModal from '@/modals/CreateItemModal';
import EditItemModal from '@/modals/EditItemModal';
import AdjustQuantityModal from '@/modals/AdjustQuantityModal';
import ViewTransactionsModal from '@/modals/ViewTransactionsModal';
import CreateCategoryModal from '@/modals/CreateCategoryModal';
import CreateUnitModal from '@/modals/CreateUnitModal';
import CreateLocationModal from '@/modals/CreateLocationModal';
import ViewLocationsModal from '@/modals/ViewLocationsModal';
import ManageInventoryOptionsModal from '@/modals/ManageInventoryOptionsModal';

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
    quantity: number;
    reorder_level: number;
    unit_price: number | null;
    is_active: boolean;
    location: string | null;
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
    const isAdmin = role === 'Admin';

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
                item.name.toLowerCase().includes(query) ||
                item.sku.toLowerCase().includes(query) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                (item.location && item.location.toLowerCase().includes(query))
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
        // Convert to numbers for proper comparison
        const quantity = Number(item.quantity);
        const reorderLevel = Number(item.reorder_level);

        console.log(`Item: ${item.name}, Quantity: ${quantity} (type: ${typeof quantity}), Reorder Level: ${reorderLevel} (type: ${typeof reorderLevel})`);

        if (quantity <= 0) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                    <AlertTriangle className="h-3 w-3" />
                    Out of Stock
                </span>
            );
        } else if (quantity <= reorderLevel) { // Now comparing numbers instead of strings
            console.log(`LOW STOCK: ${item.name} - Quantity: ${quantity}, Reorder: ${reorderLevel}`);
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                    <AlertTriangle className="h-3 w-3" />
                    Low Stock
                </span>
            );
        } else {
            console.log(`IN STOCK: ${item.name} - Quantity: ${quantity}, Reorder: ${reorderLevel}`);
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                    <CheckCircle className="h-3 w-3" />
                    In Stock
                </span>
            );
        }
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
            .filter(item => item.is_active && item.unit_price)
            .reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.unit_price) || 0)), 0);

        return { total, lowStock, outOfStock, totalValue };
    };

    const stats = getInventoryStats();

    return (
        <AppLayout>
            <Head title="Inventory Management" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            Inventory Management
                        </h1>
                        <p className="text-gray-600">Track and manage your inventory items</p>
                    </div>

                    {isAdmin && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleCreateItem}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                Add Item
                            </button>
                            <button
                                onClick={handleCreateCategory}
                                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Category
                            </button>
                            <button
                                onClick={handleCreateUnit}
                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Unit
                            </button>
                            <button
                                onClick={handleCreateLocation}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <MapPin className="h-4 w-4" />
                                Location
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<Package className="w-6 h-6" />}
                    label="Total Items"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<TrendingDown className="w-6 h-6" />}
                    label="Low Stock"
                    value={stats.lowStock}
                    color="amber"
                />
                <StatCard
                    icon={<AlertTriangle className="w-6 h-6" />}
                    label="Out of Stock"
                    value={stats.outOfStock}
                    color="red"
                />
                <StatCard
                    icon={<DollarSign className="w-6 h-6" />}
                    label="Total Value"
                    value={`$${stats.totalValue.toLocaleString()}`}
                    color="green"
                    isValue={true}
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
                                placeholder="Search by name, SKU, description, or location..."
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
                        onClick={fetchInventoryData}
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleManageOptions}
                                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Package className="h-4 w-4" />
                                    Manage
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <label className="inline-flex items-center text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    checked={showInactiveItems}
                                    onChange={(e) => setShowInactiveItems(e.target.checked)}
                                />
                                <span className="ml-2 font-medium">Show Inactive Items</span>
                            </label>

                            <label className="inline-flex items-center text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    checked={showLowStock}
                                    onChange={(e) => setShowLowStock(e.target.checked)}
                                />
                                <span className="ml-2 font-medium">Show Low Stock Only</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Inventory Items */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            <span className="text-gray-600 font-medium">Loading inventory...</span>
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 mb-4">
                            <Package className="h-16 w-16 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No inventory items found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery ? 'Try adjusting your search terms or filters' : 'Get started by adding your first inventory item'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear search
                            </button>
                        )}
                        {isAdmin && !searchQuery && (
                            <button
                                onClick={handleCreateItem}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add your first item
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        <button
                                            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                                            onClick={() => handleSort('name')}
                                        >
                                            <span>Item</span>
                                            {sortField === 'name' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        <button
                                            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                                            onClick={() => handleSort('sku')}
                                        >
                                            <span>SKU</span>
                                            {sortField === 'sku' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        <button
                                            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                                            onClick={() => handleSort('quantity')}
                                        >
                                            <span>Stock</span>
                                            {sortField === 'quantity' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        <button
                                            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                                            onClick={() => handleSort('unit_price')}
                                        >
                                            <span>Price</span>
                                            {sortField === 'unit_price' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`${!item.is_active ? 'bg-gray-50 opacity-70' : 'hover:bg-gray-50'} transition-colors duration-200`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {item.image_path ? (
                                                    <div className="flex-shrink-0 h-12 w-12 mr-4">
                                                        <img
                                                            className="h-12 w-12 rounded-xl object-cover shadow-sm border border-gray-200"
                                                            src={`/storage/${item.image_path}`}
                                                            alt={item.name}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mr-4 shadow-sm border border-gray-200">
                                                        <Package className="h-6 w-6 text-gray-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-lg">
                                                        {item.name}
                                                    </div>
                                                    {item.location && (
                                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {item.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                                                {item.sku}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.category?.name ? (
                                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {item.category.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-lg font-bold text-gray-900">
                                                {item.quantity}
                                            </div>
                                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                                                Reorder at: {item.reorder_level}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                {renderStockStatus(item)}
                                                {!item.is_active && (
                                                    <div>
                                                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                                                            Inactive
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.unit_price ? (
                                                <span className="font-semibold text-green-600 text-lg">
                                                    ${parseFloat(item.unit_price.toString()).toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                                                    onClick={() => handleViewTransactions(item)}
                                                    title="View Transaction History"
                                                >
                                                    <Clipboard className="h-5 w-5" />
                                                </button>

                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                                            onClick={() => handleAdjustQuantity(item)}
                                                            title="Adjust Quantity"
                                                        >
                                                            <Package className="h-5 w-5" />
                                                        </button>

                                                        <button
                                                            className="p-2 text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-all duration-200"
                                                            onClick={() => handleEditItem(item)}
                                                            title="Edit Item"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
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
                locations={locations}
            />

            <ManageInventoryOptionsModal
                show={showManageOptionsModal}
                onClose={() => setShowManageOptionsModal(false)}
                onSuccess={fetchInventoryData}
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
        blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
        green: 'bg-gradient-to-br from-green-500 to-green-600',
        amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
        red: 'bg-gradient-to-br from-red-500 to-red-600',
        purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    }[color];

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className={`${colorClasses} text-white rounded-xl p-3 shadow-lg`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
                {isValue ? value : typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="text-gray-600 font-medium">{label}</div>
        </div>
    );
}
