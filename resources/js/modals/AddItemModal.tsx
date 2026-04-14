import { useState } from 'react';
import axios from 'axios';
import { LoaderCircle, X } from 'lucide-react';
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

type AddItemModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  units: UnitOfMeasure[];
  locations: Location[];
};

export default function AddItemModal({ show, onClose, onSuccess, categories, units, locations }: AddItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    uom_id: '',
    location_id: '',
    quantity: '0',
    reorder_level: '0',
    unit_price: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    const formDataToSend = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '') {
        formDataToSend.append(key, value);
      }
    });

    if (selectedImage) {
      formDataToSend.append('image', selectedImage);
    }

    axios.post('/api/inventory/items', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(() => {
        onSuccess();
        onClose();
        resetForm();
      })
      .catch(error => {
        console.error('Error creating inventory item:', error);
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
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
      location_id: '',
      quantity: '0',
      reorder_level: '0',
      unit_price: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Item name"
              className="w-full"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              type="text"
              required
              value={formData.sku}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Stock keeping unit"
              className="w-full"
            />
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Item description"
              className="w-full p-2 border rounded-md min-h-[80px]"
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category_id">Category</Label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="uom_id">Unit of Measure</Label>
            <select
              id="uom_id"
              name="uom_id"
              value={formData.uom_id}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a unit</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>
              ))}
            </select>
            {errors.uom_id && <p className="text-red-500 text-xs mt-1">{errors.uom_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.quantity}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full"
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
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
                className="w-full"
              />
              {errors.reorder_level && <p className="text-red-500 text-xs mt-1">{errors.reorder_level}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unit_price">Unit Price (optional)</Label>
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
              className="w-full"
            />
            {errors.unit_price && <p className="text-red-500 text-xs mt-1">{errors.unit_price}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location_id">Storage Location</Label>
            <select
              id="location_id"
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a location</option>
              {(locations || []).map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
            {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Item Image (optional)</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmitting}
              className="w-full"
            />
            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}

            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded border p-1"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              Add Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
