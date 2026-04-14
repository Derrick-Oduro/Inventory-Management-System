import { useState, useEffect } from 'react';
import axios from 'axios';
import { LoaderCircle, X, ArrowUp, ArrowDown, Package, Clock, User } from 'lucide-react';

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_of_measure?: {
    abbreviation: string;
  };
};

type Transaction = {
  id: number;
  quantity: number;
  previous_quantity: number;
  transaction_type: string;
  reason: string;
  created_at: string;
  created_by?: {
    name: string;
  };
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
        console.log('Transaction data:', response.data); // Debug response
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
                    <div className="relative pb-8">
                      {index !== transactions.length - 1 ? (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ring-8 ring-white shadow-lg ${
                            transaction.transaction_type === 'add'
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : transaction.transaction_type === 'remove'
                                ? 'bg-gradient-to-br from-red-500 to-red-600'
                                : 'bg-gradient-to-br from-gray-500 to-gray-600'
                          }`}>
                            {transaction.transaction_type === 'add' ? (
                              <ArrowUp className="h-6 w-6 text-white" />
                            ) : transaction.transaction_type === 'remove' ? (
                              <ArrowDown className="h-6 w-6 text-white" />
                            ) : (
                              <Package className="h-6 w-6 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-base">
                              <span className="font-bold text-gray-900">
                                {transaction.transaction_type === 'add'
                                  ? 'Stock Added'
                                  : transaction.transaction_type === 'remove'
                                    ? 'Stock Removed'
                                    : 'Adjustment'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(transaction.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {transaction.created_by ? transaction.created_by.name : 'Unknown User'}
                              </span>
                            </p>
                          </div>
                          <div className="mt-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                transaction.transaction_type === 'add'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.transaction_type === 'add'
                                  ? `+${transaction.quantity}`
                                  : `-${transaction.quantity}`}
                              </span>
                              <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                                {transaction.previous_quantity} → {
                                  // Calculate the new quantity based on transaction type
                                  transaction.previous_quantity +
                                  (transaction.transaction_type === 'add' ? transaction.quantity : -transaction.quantity)
                                }
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                              <span className="font-medium">Reason:</span> {transaction.reason || 'No reason provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
