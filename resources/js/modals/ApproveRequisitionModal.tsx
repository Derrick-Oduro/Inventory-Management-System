import { useState } from 'react';
import axios from 'axios';
import { LoaderCircle, X, CheckCircle, X as XIcon, Package, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Requisition } from '@/types/requisition';

type ApproveRequisitionModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requisition: Requisition | null;
};

export default function ApproveRequisitionModal({ show, onClose, onSuccess, requisition }: ApproveRequisitionModalProps) {
  const [decision, setDecision] = useState<'approved' | 'declined' | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !requisition) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!decision) {
      setErrors({ decision: 'Please select whether to approve or decline this requisition' });
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      status: decision,
      notes: notes
    };

    axios.put(`/api/requisitions/${requisition.id}`, reviewData)
      .then(response => {
        onSuccess();
        onClose();
      })
      .catch(error => {
        console.error('Error reviewing requisition:', error);

        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else {
          setErrors({ general: 'Failed to process review. Please try again.' });
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Check if item is available in sufficient quantity
  const isItemAvailable = requisition.item && requisition.quantity <= requisition.item.quantity;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Review Requisition</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-blue-900">
                Item: {requisition.item?.name || 'Unknown Item'}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Requested by: <span className="font-medium">{requisition.created_by?.name || 'Unknown User'}</span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Date: {formatDate(requisition.created_at)}
              </div>
            </div>
            <div>
              <Badge className={requisition.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                             requisition.status === 'approved' ? 'bg-green-100 text-green-800' :
                             'bg-red-100 text-red-800'}>
                {requisition.status.charAt(0).toUpperCase() + requisition.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Item Details
            </h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">SKU:</span>
                <span className="ml-2 text-gray-800">{requisition.item?.sku || 'N/A'}</span>
              </div>
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Quantity Requested:</span>
                <span className="ml-2 text-gray-800">{requisition.quantity} {requisition.item?.unit_of_measure?.abbreviation || 'units'}</span>
              </div>
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Location:</span>
                <span className="ml-2 text-gray-800">{requisition.location?.name || 'Unknown Location'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Current Stock
            </h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Available Stock:</span>
                <span className={`ml-2 font-medium ${isItemAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {requisition.item?.quantity || 0} {requisition.item?.unit_of_measure?.abbreviation || 'units'}
                </span>
              </div>

              {!isItemAvailable && (
                <div className="mt-3 bg-red-50 p-2 rounded flex items-start">
                  <Info className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    Insufficient stock available to fulfill this request. Consider declining or waiting until more stock is available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
              placeholder="Add any notes or explanation for your decision"
              disabled={isSubmitting}
            ></textarea>
          </div>

          <div className="mb-6">
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Decision
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 rounded-md border-2 ${
                  decision === 'approved'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setDecision('approved')}
                disabled={isSubmitting}
              >
                <CheckCircle className={`h-8 w-8 mb-2 ${decision === 'approved' ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="font-medium">Approve</span>
                <span className="text-xs text-gray-500 mt-1">Approve this requisition</span>
              </button>

              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 rounded-md border-2 ${
                  decision === 'declined'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setDecision('declined')}
                disabled={isSubmitting}
              >
                <XIcon className={`h-8 w-8 mb-2 ${decision === 'declined' ? 'text-red-500' : 'text-gray-400'}`} />
                <span className="font-medium">Decline</span>
                <span className="text-xs text-gray-500 mt-1">Decline this requisition</span>
              </button>
            </div>
            {errors.decision && <p className="text-red-500 text-xs mt-1">{errors.decision}</p>}
          </div>

          {errors.general && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
              {errors.general}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
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
              className={`${
                decision === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : decision === 'declined'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={isSubmitting || !decision}
            >
              {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              {decision === 'approved'
                ? 'Approve Requisition'
                : decision === 'declined'
                  ? 'Decline Requisition'
                  : 'Submit Decision'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
