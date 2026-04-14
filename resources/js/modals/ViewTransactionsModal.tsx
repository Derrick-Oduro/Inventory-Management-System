import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LoaderCircle,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Repeat2,
  SlidersHorizontal,
  Undo2,
  Package,
  Clock,
  User,
  MapPin,
} from 'lucide-react';

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  quantity: number | string;
  unit_of_measure?: {
    abbreviation: string;
  };
};

type MovementType = 'stock_in' | 'stock_out' | 'transfer' | 'adjustment' | 'return';

type Transaction = {
  id: number;
  quantity: number | string;
  movement_type: MovementType;
  status: 'pending_approval' | 'approved' | 'rejected' | 'completed';
  notes: string | null;
  created_at: string;
  from_location?: {
    id: number;
    name: string;
  } | null;
  to_location?: {
    id: number;
    name: string;
  } | null;
  performed_by?: {
    id: number;
    name: string;
  } | null;
  approved_by?: {
    id: number;
    name: string;
  } | null;
};

type ViewTransactionsModalProps = {
  show: boolean;
  onClose: () => void;
  item: InventoryItem | null;
};

export default function ViewTransactionsModal({ show, onClose, item }: ViewTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && item) {
      fetchTransactions();
    }
  }, [show, item]);

  const fetchTransactions = () => {
    if (!item) return;

    setIsLoading(true);
    setError('');

    axios.get(`/api/inventory/items/${item.id}/transactions`)
      .then(response => {
        setTransactions(response.data);
      })
      .catch(error => {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!show || !item) return null;

  const getMovementMeta = (movementType: MovementType) => {
    switch (movementType) {
      case 'stock_in':
        return {
          label: 'Stock In',
          Icon: ArrowUpCircle,
          iconClass: 'bg-emerald-500',
          badgeClass: 'bg-emerald-100 text-emerald-700',
        };
      case 'stock_out':
        return {
          label: 'Stock Out',
          Icon: ArrowDownCircle,
          iconClass: 'bg-red-500',
          badgeClass: 'bg-red-100 text-red-700',
        };
      case 'transfer':
        return {
          label: 'Transfer',
          Icon: Repeat2,
          iconClass: 'bg-blue-500',
          badgeClass: 'bg-blue-100 text-blue-700',
        };
      case 'adjustment':
        return {
          label: 'Adjustment',
          Icon: SlidersHorizontal,
          iconClass: 'bg-amber-500',
          badgeClass: 'bg-amber-100 text-amber-700',
        };
      case 'return':
        return {
          label: 'Return',
          Icon: Undo2,
          iconClass: 'bg-indigo-500',
          badgeClass: 'bg-indigo-100 text-indigo-700',
        };
      default:
        return {
          label: movementType,
          Icon: Package,
          iconClass: 'bg-slate-500',
          badgeClass: 'bg-slate-100 text-slate-700',
        };
    }
  };

  const getStatusClass = (status: Transaction['status']) => {
    if (status === 'pending_approval') return 'bg-amber-100 text-amber-700';
    if (status === 'approved') return 'bg-blue-100 text-blue-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const formatQuantity = (quantity: number | string) => {
    const parsed = Number(quantity);
    return Number.isFinite(parsed) ? parsed.toLocaleString() : String(quantity);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateString || 'Unknown date';
    }
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
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-3 shadow-lg">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
          <div className="flex items-center">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800 mb-1">{item.name}</h3>
              <p className="text-sm text-gray-600 font-mono bg-white px-2 py-0.5 rounded mb-1">SKU: {item.sku}</p>
              <p className="text-sm font-semibold text-blue-600">
                Current Stock: <span className="text-lg">{item.quantity}</span>
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="text-gray-600 font-medium">Loading transaction history...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchTransactions}
              className="text-red-600 hover:text-red-700 underline mt-2 font-medium"
            >
              Try again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 mx-auto mb-4 w-20 h-20 flex items-center justify-center">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg">No transaction history available</p>
            <p className="text-gray-500 text-sm mt-1">This item hasn't been adjusted yet</p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flow-root">
              <ul className="-mb-8">
                {transactions.map((transaction, index) => (
                  <li key={transaction.id}>
                    {(() => {
                      const meta = getMovementMeta(transaction.movement_type);
                      const Icon = meta.Icon;

                      return (
                    <div className="relative pb-8">
                      {index !== transactions.length - 1 ? (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ring-8 ring-white shadow-lg ${meta.iconClass}`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-base flex items-center gap-2">
                              <span className="font-bold text-gray-900">{meta.label}</span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(transaction.status)}`}>
                                {transaction.status.replace('_', ' ')}
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
                                Qty: {formatQuantity(transaction.quantity)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(transaction.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {transaction.performed_by ? transaction.performed_by.name : 'Unknown User'}
                              </span>
                            </p>
                          </div>
                          <div className="mt-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 text-sm text-gray-700">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                From: {transaction.from_location?.name || '-'}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                To: {transaction.to_location?.name || '-'}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                              <span className="font-medium">Notes:</span> {transaction.notes || 'No notes provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
