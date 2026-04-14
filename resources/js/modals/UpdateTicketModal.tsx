import { useState } from 'react';
import axios from 'axios';
import { LoaderCircle, X, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Ticket = {
  id: number;
  title: string;
  status: string;
};

type UpdateTicketModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticket: Ticket | null;
};

export default function UpdateTicketModal({ show, onClose, onSuccess, ticket }: UpdateTicketModalProps) {
  const [formData, setFormData] = useState({
    message: '',
    status: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !ticket) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!formData.message.trim()) {
      setErrors({ message: 'Please provide an update message' });
      setIsSubmitting(false);
      return;
    }

    axios.post(`/api/tickets/${ticket.id}/update`, formData)
      .then(() => {
        onSuccess();
        onClose();
        setFormData({ message: '', status: '' });
      })
      .catch(error => {
        console.error('Error updating ticket:', error);
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else {
          setErrors({ general: 'Failed to update ticket. Please try again.' });
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">Open</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">Resolved</span>;
      case 'closed':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">Closed</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">{status}</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-3 shadow-lg">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Update Ticket Progress</h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
          <p className="font-semibold text-gray-900 text-lg mb-2">{ticket.title}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Current status:</span>
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-3">
              Update Status (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                  formData.status === 'in_progress'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 text-white shadow-lg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => handleStatusChange('in_progress')}
              >
                <Clock className="h-4 w-4 mr-2" />
                In Progress
              </button>
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                  formData.status === 'resolved'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 text-white shadow-lg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => handleStatusChange('resolved')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolved
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Progress Update *
            </Label>
            <textarea
              id="message"
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Describe the progress or resolution of this ticket..."
              className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={5}
            />
            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
              {errors.general}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
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
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Updating...' : 'Submit Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
