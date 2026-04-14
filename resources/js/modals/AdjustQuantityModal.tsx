import { useState } from 'react';
import axios from 'axios';
import { LoaderCircle, X, Plus, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_of_measure?: {
    abbreviation: string;
  };
};

type AdjustQuantityModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem | null;
};

export default function AdjustQuantityModal({ show, onClose, onSuccess, item }: AdjustQuantityModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!quantity || parseFloat(quantity) <= 0) {
      setErrors({ quantity: 'Please enter a valid quantity' });
      setIsSubmitting(false);
      return;
    }

    if (!reason.trim()) {
      setErrors({ reason: 'Please provide a reason for the adjustment' });
      setIsSubmitting(false);
      return;
    }

    const adjustmentData = {
      quantity: parseFloat(quantity),
      adjustment_type: adjustmentType,
      reason: reason
    };

    axios.post(`/api/inventory/items/${item.id}/adjust`, adjustmentData)
      .then(() => {
        onSuccess();
        onClose();
        // Reset form
        setAdjustmentType('add');
        setQuantity('1');
        setReason('');
      })
      .catch(error => {
        console.error('Error adjusting quantity:', error);
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else if (error.response?.data?.message) {
          setErrors({ general: error.response.data.message });
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
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-3 shadow-lg">
            <Package className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Adjust Inventory Quantity</h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{item.name}</p>
              <p className="text-sm text-gray-600 font-medium">
                Current Stock: <span className="text-blue-600 font-bold">{item.quantity}</span>
              </p>
              <p className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded mt-1">
                SKU: {item.sku}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-3">Adjustment Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                  adjustmentType === 'add'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 text-white shadow-lg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => setAdjustmentType('add')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </button>
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                  adjustmentType === 'remove'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-500 text-white shadow-lg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => setAdjustmentType('remove')}
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove Stock
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter quantity"
            />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <Label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Adjustment *
            </Label>
            <textarea
              id="reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              placeholder="Explain why you're adjusting the quantity..."
              className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
            />
            {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
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
              className={`px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 ${
                adjustmentType === 'add'
                  ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting
                ? 'Processing...'
                : adjustmentType === 'add'
                  ? 'Add to Inventory'
                  : 'Remove from Inventory'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
