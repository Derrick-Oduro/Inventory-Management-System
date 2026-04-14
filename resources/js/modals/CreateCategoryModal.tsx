import { useState } from 'react';
import axios from 'axios';
import { LoaderCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CreateCategoryModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateCategoryModal({ show, onClose, onSuccess }: CreateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!categoryName.trim()) {
      setErrors({ name: 'Category name is required' });
      setIsSubmitting(false);
      return;
    }

    axios.post('/api/inventory/categories', { name: categoryName })
      .then(() => {
        onSuccess();
        onClose();
        setCategoryName('');
      })
      .catch(error => {
        console.error('Error creating category:', error);
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              type="text"
              required
              autoFocus
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter category name"
              className="w-full"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
              Create Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
