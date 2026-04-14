import { useState } from 'react';
import axios from 'axios';
import { LoaderCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CreateUnitModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateUnitModal({ show, onClose, onSuccess }: CreateUnitModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      setErrors({
        name: !formData.name.trim() ? 'Unit name is required' : '',
        abbreviation: !formData.abbreviation.trim() ? 'Abbreviation is required' : ''
      });
      setIsSubmitting(false);
      return;
    }

    axios.post('/api/inventory/units', formData)
      .then(() => {
        onSuccess();
        onClose();
        setFormData({ name: '', abbreviation: '' });
      })
      .catch(error => {
        console.error('Error creating unit of measure:', error);
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
          <h2 className="text-xl font-bold">Create Unit of Measure</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Unit Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., Kilogram, Liter, Piece"
              className="w-full"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="abbreviation">Abbreviation</Label>
            <Input
              id="abbreviation"
              name="abbreviation"
              type="text"
              required
              value={formData.abbreviation}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., kg, L, pc"
              className="w-full"
            />
            {errors.abbreviation && <p className="text-red-500 text-xs mt-1">{errors.abbreviation}</p>}
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
              Create Unit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
