import { useState, useEffect } from 'react';
import axios from 'axios';
import { LoaderCircle, X, Plus, Trash2, Package, Search, FileText, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RequisitionItem } from '@/types/requisition';

type InventoryItem = {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    is_active: boolean;
    unit_of_measure?: {
        abbreviation: string;
    };
};

type RequisitionItemForm = {
    item_id: number;
    item: InventoryItem;
    quantity: number;
    notes?: string;
};

type CreateRequisitionModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function CreateRequisitionModal({ show, onClose, onSuccess }: CreateRequisitionModalProps) {
    const [formData, setFormData] = useState({
        item_id: '',
        quantity: 1,
        location_id: '',
        notes: ''
    });

    const [items, setItems] = useState<RequisitionItemForm[]>([]);
    const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showItemSearch, setShowItemSearch] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    useEffect(() => {
        if (show) {
            // Reset form when modal opens
            setFormData({
                item_id: '',
                quantity: 1,
                location_id: '',
                notes: ''
            });
            setItems([]);
            setErrors({});
            fetchInventoryItems();
            fetchLocations();
        }
    }, [show]);

    useEffect(() => {
        filterItems();
    }, [searchQuery, availableItems]);

    const fetchInventoryItems = () => {
        setIsLoadingItems(true);

        axios.get('/api/inventory/items')
            .then(response => {
                console.log('Inventory API response:', response.data);

                // Get items from the response
                let items = [];

                // Check if response.data.items exists (from getItems method)
                if (response.data && response.data.items && Array.isArray(response.data.items)) {
                    items = response.data.items;
                }
                // Check if response.data is an array directly (from index method)
                else if (Array.isArray(response.data)) {
                    items = response.data;
                }

                console.log('Extracted items:', items);

                // Debug each item for filtering issues
                items.forEach((item, index) => {
                    console.log(`Item ${index}:`, item);
                    console.log(`- is object:`, typeof item === 'object' && item !== null);
                    console.log(`- is_active:`, item.is_active);
                    console.log(`- quantity type:`, typeof item.quantity);
                    console.log(`- quantity value:`, item.quantity);
                    console.log(`- Would pass filter:`,
                        item &&
                        typeof item === 'object' &&
                        item.is_active !== false &&
                        typeof item.quantity === 'number' &&
                        item.quantity > 0
                    );
                });

                // Use more lenient filtering to include items
                const activeItems = items.filter(item => {
                    // Make sure item exists and is an object
                    if (!item || typeof item !== 'object') {
                        return false;
                    }

                    // Check active status - consider it active unless explicitly set to false
                    const isActive = item.is_active !== false;

                    // Check quantity - try to convert to number if it's a string
                    let itemQuantity = item.quantity;
                    if (typeof itemQuantity === 'string') {
                        itemQuantity = parseFloat(itemQuantity);
                    }

                    const hasStock = typeof itemQuantity === 'number' && !isNaN(itemQuantity) && itemQuantity > 0;

                    return isActive && hasStock;
                });

                console.log('Active items with stock:', activeItems);
                setAvailableItems(activeItems);

                // If we still have no items, add a test item for debugging
                if (activeItems.length === 0 && items.length > 0) {
                    console.log('Adding the first inventory item regardless of filters for testing');
                    // Take the first item and force it to have the right properties
                    const testItem = {
                        ...items[0],
                        is_active: true,
                        quantity: items[0].quantity > 0 ? items[0].quantity : 10
                    };
                    setAvailableItems([testItem]);
                }
            })
            .catch(error => {
                console.error('Error fetching inventory items:', error);
            })
            .finally(() => {
                setIsLoadingItems(false);
            });
    };

    const fetchLocations = () => {
        setIsLoadingLocations(true);

        axios.get('/api/locations')
            .then(response => {
                console.log('Locations API response:', response.data);
                setLocations(response.data);
            })
            .catch(error => {
                console.error('Error fetching locations:', error);
            })
            .finally(() => {
                setIsLoadingLocations(false);
            });
    };

    // Update the filterItems function to be more robust
    const filterItems = () => {
        console.log('Filtering items. Search query:', searchQuery, 'Available items count:', availableItems.length);

        if (!searchQuery.trim()) {
            console.log('Empty search query, clearing filtered items');
            setFilteredItems([]);
            return;
        }

        // If no available items, show a more helpful message
        if (availableItems.length === 0) {
            console.log('No available items to filter');
            setFilteredItems([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = availableItems.filter((item: any) => {
            // Safely check name and sku
            const nameMatch = item.name && typeof item.name === 'string' &&
                item.name.toLowerCase().includes(query);
            const skuMatch = item.sku && typeof item.sku === 'string' &&
                item.sku.toLowerCase().includes(query);

            return nameMatch || skuMatch;
        });

        console.log('Filtered items by search:', filtered.length);
        setFilteredItems(filtered);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddItem = (item: InventoryItem) => {
        if (items.some(i => i.item_id === item.id)) {
            setErrors({ general: 'Item is already added to the requisition' });
            return;
        }

        setItems(prev => [
            ...prev,
            {
                item_id: item.id,
                item: item,
                quantity: 1,
                notes: ''
            }
        ]);
        setSearchQuery('');
        setShowItemSearch(false);
        setErrors(prev => ({ ...prev, general: '' }));
    };

    const handleRemoveItem = (itemId: number) => {
        setItems(prev => prev.filter(item => item.item_id !== itemId));
    };

    const handleQuantityChange = (index: number, value: string) => {
        const quantity = parseInt(value);
        if (isNaN(quantity) || quantity < 1) return;

        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], quantity };
            return updated;
        });
    };

    const handleItemNotesChange = (index: number, notes: string) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], notes };
            return updated;
        });
    };

    // Update your validateForm function
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (items.length === 0) {
            newErrors.items = 'Please add at least one item to the requisition';
        }

        if (!formData.location_id) {
            newErrors.location_id = 'Please select a location';
        }

        items.forEach((item, index) => {
            if (item.quantity > item.item.quantity) {
                newErrors[`item_${index}`] = `Exceeds available stock (${item.item.quantity})`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Update your handleSubmit function
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Create separate requisitions for each item (based on your database schema)
            const requisitionPromises = items.map(item => {
                const requestData = {
                    item_id: item.item_id,
                    quantity: item.quantity,
                    location_id: parseInt(formData.location_id as string),
                    admin_notes: item.notes || formData.notes || null
                };

                return axios.post('/api/requisitions', requestData);
            });

            await Promise.all(requisitionPromises);

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating requisitions:', error);

            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: 'Failed to create requisition. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-3 shadow-lg">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Create New Requisition</h2>
                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {errors.general && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Requisition Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="location_id" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Delivery Location *
                                </Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <select
                                        id="location_id"
                                        name="location_id"
                                        value={formData.location_id}
                                        onChange={handleTextChange}
                                        disabled={isSubmitting || isLoadingLocations}
                                        className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="">Select delivery location</option>
                                        {locations.map(location => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {isLoadingLocations && (
                                    <div className="mt-1 flex items-center">
                                        <LoaderCircle className="h-4 w-4 animate-spin text-green-500 mr-2" />
                                        <span className="text-sm text-gray-500">Loading locations...</span>
                                    </div>
                                )}
                                {errors.location_id && <p className="text-red-500 text-sm mt-1">{errors.location_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                                    General Notes
                                </Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleTextChange}
                                        disabled={isSubmitting}
                                        placeholder="Any additional information..."
                                        className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Requested Items</h3>
                            <button
                                type="button"
                                onClick={() => setShowItemSearch(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
                                disabled={isSubmitting}
                            >
                                <Plus className="h-4 w-4" />
                                Add Item
                            </button>
                        </div>

                        {errors.items && <p className="text-red-500 text-sm mb-4">{errors.items}</p>}

                        {showItemSearch && (
                            <div className="mb-6 bg-white border border-purple-200 p-4 rounded-xl shadow-sm">
                                <div className="flex items-center mb-4">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            className="pl-10 py-3 pr-3 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Search items by name or SKU..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowItemSearch(false);
                                            setSearchQuery('');
                                        }}
                                        className="ml-3 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="max-h-64 overflow-y-auto">
                                    {isLoadingItems ? (
                                        <div className="flex justify-center items-center h-32">
                                            <LoaderCircle className="h-6 w-6 animate-spin text-purple-500" />
                                            <span className="ml-2 text-gray-600">Loading items...</span>
                                        </div>
                                    ) : availableItems.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No inventory items available</p>
                                            <p className="text-sm text-gray-400 mt-1">Make sure you have active items with stock</p>
                                        </div>
                                    ) : searchQuery.trim() === '' ? (
                                        <div className="text-center py-8">
                                            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">Start typing to search</p>
                                            <p className="text-sm text-gray-400 mt-1">{availableItems.length} items available</p>
                                        </div>
                                    ) : filteredItems.length > 0 ? (
                                        <div className="grid gap-2">
                                            {filteredItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleAddItem(item)}
                                                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-purple-300 transition-all duration-200"
                                                >
                                                    <div className="flex items-center">
                                                        <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-lg mr-3">
                                                            <Package className="h-5 w-5 text-purple-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-semibold text-gray-900">{item.name}</div>
                                                            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.quantity} {item.unit_of_measure?.abbreviation || 'units'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Available</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No items found</p>
                                            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {items.length > 0 ? (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.item_id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center flex-grow">
                                                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-lg mr-3">
                                                    <Package className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="font-semibold text-gray-900">{item.item.name}</div>
                                                    <div className="text-sm text-gray-500">SKU: {item.item.sku}</div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        Available: {item.item.quantity} {item.item.unit_of_measure?.abbreviation || 'units'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <Label className="text-xs text-gray-500 block mb-1">Quantity</Label>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.item.quantity}
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                            className={`w-20 py-2 px-3 rounded-lg border text-sm ${errors[`item_${index}`]
                                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                                                                }`}
                                                            disabled={isSubmitting}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-500">
                                                            {item.item.unit_of_measure?.abbreviation || 'units'}
                                                        </span>
                                                    </div>
                                                    {errors[`item_${index}`] && (
                                                        <p className="text-red-500 text-xs mt-1">{errors[`item_${index}`]}</p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.item_id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <Label className="text-xs text-gray-500 block mb-1">Item-specific notes</Label>
                                            <textarea
                                                value={item.notes || ''}
                                                onChange={(e) => handleItemNotesChange(index, e.target.value)}
                                                placeholder="Any specific notes for this item..."
                                                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                                rows={2}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium text-lg mb-2">No items added yet</p>
                                <p className="text-gray-400 text-sm mb-4">Start by adding items to your requisition</p>
                                <button
                                    type="button"
                                    onClick={() => setShowItemSearch(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Your First Item
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                            disabled={isSubmitting || items.length === 0}
                        >
                            {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                            {isSubmitting ? 'Creating Requisitions...' : `Create ${items.length} Requisition${items.length > 1 ? 's' : ''}`}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
