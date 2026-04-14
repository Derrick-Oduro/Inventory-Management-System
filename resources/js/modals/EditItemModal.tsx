import { useState, useRef, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import { LoaderCircle, X, Upload, Camera, Package, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Category = {
    id: number;
    name: string;
};

type UnitOfMeasure = {
    id: number;
    name: string;
    abbreviation: string;
};

type Location = {
    id: number;
    name: string;
};

type InventoryItem = {
    id: number;
    name: string;
    sku: string;
    description: string | null;
    category_id: number | null;
    uom_id: number | null;
    location_id: number | null;
    quantity: number;
    reorder_level: number;
    unit_price: number | null;
    is_active: boolean;
    image_path: string | null;
};

type EditItemModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item: InventoryItem | null;
    categories: Category[];
    units: UnitOfMeasure[];
    locations: Location[];
};

export default function EditItemModal({ show, onClose, onSuccess, item, categories, units, locations }: EditItemModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category_id: '',
        uom_id: '',
        location_id: '',        // Change from location_id to location
        reorder_level: '0',
        unit_price: '',
        is_active: true,
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Update form when item prop changes
    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                sku: item.sku || '',
                description: item.description || '',
                category_id: item.category_id ? String(item.category_id) : '',
                uom_id: item.uom_id ? String(item.uom_id) : '',
                location_id: item.location_id ? String(item.location_id) : '',  // Change from location_id to location
                reorder_level: String(item.reorder_level) || '0',
                unit_price: item.unit_price ? String(item.unit_price) : '',
                is_active: item.is_active,
            });

            // Set image preview if item has an image
            if (item.image_path) {
                setImagePreview(`/storage/${item.image_path}`);
            } else {
                setImagePreview(null);
            }
            setSelectedImage(null); // Reset selected image when item changes
        }
    }, [item]);

    if (!show || !item) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);

            // Create a preview URL
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string || null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        console.log('Submitting form data:', formData); // Debug log

        const formDataToSend = new FormData();

        // Append all form fields with correct column names
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'is_active') {
                formDataToSend.append(key, value ? '1' : '0');
            } else if (value !== '') {
                // Make sure we're using the correct column names
                let columnName = key;
                if (key === 'category_id' || key === 'uom_id' || key === 'location_id') {
                    columnName = key; // These are already correct
                }
                formDataToSend.append(columnName, String(value));
            }
        });

        // Add image if selected
        if (selectedImage) {
            formDataToSend.append('image', selectedImage);
        }

        // Add method override for PUT request
        formDataToSend.append('_method', 'PUT');

        // Debug: Log what we're sending
        console.log('FormData contents:');
        for (let pair of formDataToSend.entries()) {
            console.log(pair[0], pair[1]);
        }

        axios.post(`/api/inventory/items/${item.id}`, formDataToSend, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-HTTP-Method-Override': 'PUT'
            }
        })
            .then(response => {
                console.log('Update successful:', response.data);
                onSuccess();
                onClose();
            })
            .catch(error => {
                console.error('Error updating inventory item:', error);
                console.error('Error response:', error.response?.data);

                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else if (error.response?.data?.message) {
                    setErrors({ general: error.response.data.message });
                } else {
                    setErrors({ general: 'Failed to update item. Please try again.' });
                }
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleDelete = () => {
        if (!item) return;

        setIsDeleting(true);

        axios.delete(`/api/inventory/items/${item.id}`)
            .then(() => {
                onSuccess();
                onClose();
            })
            .catch(error => {
                console.error('Error deleting item:', error);
                setErrors({ general: 'Failed to delete item. Please try again.' });
            })
            .finally(() => {
                setIsDeleting(false);
                setShowDeleteConfirm(false);
            });
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-3 shadow-lg">
                        <Package className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Inventory Item</h2>
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
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Item Name *
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    placeholder="Enter item name"
                                    className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="sku" className="block text-sm font-semibold text-gray-700 mb-2">
                                    SKU *
                                </Label>
                                <Input
                                    id="sku"
                                    name="sku"
                                    type="text"
                                    required
                                    value={formData.sku}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    placeholder="Stock keeping unit"
                                    className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                            </Label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                placeholder="Item description"
                                className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                rows={3}
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                        </div>
                    </div>

                    {/* Organization */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="category_id" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category
                                </Label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="uom_id" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Unit of Measure
                                </Label>
                                <select
                                    id="uom_id"
                                    name="uom_id"
                                    value={formData.uom_id}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                >
                                    <option value="">Select a unit</option>
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>
                                    ))}
                                </select>
                                {errors.uom_id && <p className="text-red-500 text-sm mt-1">{errors.uom_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="location_id" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Storage Location
                                </Label>
                                <select
                                    id="location_id"
                                    name="location_id"
                                    value={formData.location_id}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                >
                                    <option value="">Select a location</option>
                                    {(locations || []).map(location => (
                                        <option key={location.id} value={location.id}>{location.name}</option>
                                    ))}
                                </select>
                                {errors.location_id && <p className="text-red-500 text-sm mt-1">{errors.location_id}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Inventory & Pricing */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory & Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="reorder_level" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reorder Level *
                                </Label>
                                <Input
                                    id="reorder_level"
                                    name="reorder_level"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={formData.reorder_level}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {errors.reorder_level && <p className="text-red-500 text-sm mt-1">{errors.reorder_level}</p>}
                            </div>

                            <div>
                                <Label htmlFor="unit_price" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Unit Price (Optional)
                                </Label>
                                <Input
                                    id="unit_price"
                                    name="unit_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.unit_price}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    placeholder="0.00"
                                    className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {errors.unit_price && <p className="text-red-500 text-sm mt-1">{errors.unit_price}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Image</h3>
                        <div>
                            <Label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-2">
                                Upload Image (Optional)
                            </Label>
                            <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={isSubmitting}
                                className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}

                            {imagePreview && (
                                <div className="mt-4">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-32 w-32 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleCheckboxChange}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <Label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                                Item is active and available for use
                            </Label>
                        </div>
                        {errors.is_active && <p className="text-red-500 text-sm mt-1">{errors.is_active}</p>}
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
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>

                {/* Delete Section */}
                {showDeleteConfirm ? (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                                        Delete Item Confirmation
                                    </h3>
                                    <p className="text-sm text-red-700 mb-4">
                                        Are you sure you want to delete "{item.name}"? This action cannot be undone and will permanently remove the item and all associated transaction history.
                                    </p>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            {isDeleting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                                            {isDeleting ? 'Deleting...' : 'Yes, Delete Item'}
                                        </Button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all duration-200"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center text-red-600 hover:text-red-800 font-medium transition-all duration-200"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete this item
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                            Remove this item completely from inventory
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
