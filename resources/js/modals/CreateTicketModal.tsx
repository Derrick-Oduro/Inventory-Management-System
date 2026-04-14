import { useState } from 'react';
import axios from 'axios';
import { LoaderCircle, X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CreateTicketModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateTicketModal({ show, onClose, onSuccess }: CreateTicketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'low',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    axios.post('/api/tickets', formData)
      .then(() => {
        onSuccess();
        onClose();
        setFormData({ title: '', description: '', priority: 'low' });
      })
      .catch(error => {
        console.error('Error creating ticket:', error);
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
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Support Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              autoFocus
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Brief description of your issue"
              className="w-full"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Detailed Description</Label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Please provide details about your issue, including what you were doing when it occurred"
              className="w-full p-2 border rounded-md min-h-[120px]"
              rows={4}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-gray-500" />
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
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
              Submit Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
