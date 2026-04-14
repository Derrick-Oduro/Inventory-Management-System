import { useState, ChangeEvent, useRef } from 'react';
import axios from 'axios';
import { LoaderCircle, X, Upload, Camera, Package, Sparkles } from 'lucide-react';
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

type CreateItemModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: Category[];
    units: UnitOfMeasure[];
    locations: Location[];
};

export default function CreateItemModal({
    show,
    onClose,
    onSuccess,
    categories,
    units,
    locations
}: CreateItemModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category_id: '',
        uom_id: '',
        quantity: '0',
        reorder_level: '0',
        unit_price: '',
        location_id: '',
        is_active: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!show) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (value === '' || !isNaN(parseFloat(value))) {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            setErrors(prev => ({ ...prev, image: 'Please select an image file (JPEG, PNG, GIF)' }));
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, image: 'Image size should be less than 2MB' }));
            return;
        }

        setImageFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const generateSKU = () => {
        const prefix = formData.name.trim() ? formData.name.substring(0, 3).toUpperCase() : 'ITM';
        const timestamp = new Date().getTime().toString().slice(-6);
        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
        const sku = `${prefix}-${randomChars}${timestamp}`;
        setFormData(prev => ({ ...prev, sku }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Item name is required';
        }

        if (!formData.sku.trim()) {
            newErrors.sku = 'SKU is required';
        }

        if (formData.quantity && parseFloat(formData.quantity) < 0) {
            newErrors.quantity = 'Quantity cannot be negative';
        }

        if (formData.reorder_level && parseFloat(formData.reorder_level) < 0) {
            newErrors.reorder_level = 'Reorder level cannot be negative';
        }

        if (formData.unit_price && parseFloat(formData.unit_price) < 0) {
            newErrors.unit_price = 'Price cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const submitData = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'is_active') {
                submitData.append(key, value ? '1' : '0');
            } else {
                submitData.append(key, value.toString());
            }
        });

        if (imageFile) {
            submitData.append('image', imageFile);
        }

        axios.post('/api/inventory/items', submitData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                onSuccess();
                onClose();
                resetForm();
            })
            .catch(error => {
                console.error('Error creating inventory item:', error);

                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    setErrors({ general: 'Failed to create item. Please try again.' });
                }
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            sku: '',
            description: '',
            category_id: '',
            uom_id: '',
            quantity: '0',
            reorder_level: '0',
            unit_price: '',
            location_id: '',
            is_active: true
        });
        setImagePreview(null);
        setImageFile(null);
        setErrors({});
    };

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
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-3 shadow-lg">
                        <Package className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Create New Inventory Item</h2>
                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

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
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    placeholder="Enter item name"
                                    className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="sku" className="block text-sm font-semibold text-gray-700">
                                        SKU (Stock Keeping Unit) *
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={generateSKU}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all duration-200"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        Generate
                                    </button>
                                </div>
                                <Input
                                    type="text"
                                    id="sku"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    placeholder="Enter SKU"
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
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name} ({unit.abbreviation})
                                        </option>
                                    ))}
                                </select>
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
                                    {(locations || []).map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                                {errors.location_id && <p className="text-red-500 text-sm mt-1">{errors.location_id}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Inventory & Pricing */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory & Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Initial Quantity
                                </Label>
                                <Input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleNumberChange}
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                    className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                            </div>

                            <div>
                                <Label htmlFor="reorder_level" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reorder Level
                                </Label>
                                <Input
                                    type="number"
                                    id="reorder_level"
                                    name="reorder_level"
                                    value={formData.reorder_level}
                                    onChange={handleNumberChange}
                                    min="0"
                                    step="1"
                                    disabled={isSubmitting}
                                    className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimum quantity before restocking
                                </p>
                                {errors.reorder_level && <p className="text-red-500 text-sm mt-1">{errors.reorder_level}</p>}
                            </div>

                            <div>
                                <Label htmlFor="unit_price" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Unit Price ($)
                                </Label>
                                <Input
                                    type="number"
                                    id="unit_price"
                                    name="unit_price"
                                    value={formData.unit_price}
                                    onChange={handleNumberChange}
                                    min="0"
                                    step="0.01"
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
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                Upload Image (Optional)
                            </Label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImageChange}
                                accept="image/*"
                                disabled={isSubmitting}
                            />

                            {imagePreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-32 w-32 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg transition-all duration-200"
                                        disabled={isSubmitting}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={triggerFileInput}
                                    className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200"
                                >
                                    <div className="space-y-2 text-center">
                                        <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium text-blue-600 hover:text-blue-500">Upload an image</span>
                                            <span className="text-gray-500"> or drag and drop</span>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                    </div>
                                </div>
                            )}
                            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
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
                                disabled={isSubmitting}
                            />
                            <Label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                                Item is active and available for use
                            </Label>
                        </div>
                    </div>

                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
                            {errors.general}
                        </div>
                    )}

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
                            {isSubmitting ? 'Creating Item...' : 'Create Item'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
