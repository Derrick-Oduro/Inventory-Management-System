import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type Supplier = {
    id: number;
    company_name: string;
};

type LowStockItem = {
    id: number;
    name: string;
    sku: string;
    reorder_quantity: number;
    cost_price: number;
};

type PurchaseOrder = {
    id: number;
    po_number: string;
    status: string;
    total_amount: number;
    supplier?: { company_name: string };
    created_at: string;
};

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<Array<{ id: number; name: string; sku: string; reorder_quantity?: number; cost_price?: number }>>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        supplier_id: '',
        item_id: '',
        quantity: '',
        unit_price: '',
        expected_delivery_date: '',
        notes: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersResponse, suppliersResponse, suggestionsResponse, itemsResponse] = await Promise.all([
                axios.get('/api/purchase-orders'),
                axios.get('/api/suppliers', { params: { active: true } }),
                axios.get('/api/purchase-orders/suggestions/low-stock'),
                axios.get('/api/inventory/items'),
            ]);

            setOrders(ordersResponse.data);
            setSuppliers(suppliersResponse.data);
            setLowStockItems(suggestionsResponse.data);
            setInventoryItems(itemsResponse.data.items || []);
        } catch (error) {
            console.error('Failed to fetch PO data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const createPurchaseOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.supplier_id || !form.item_id || !form.quantity || !form.unit_price) {
            return;
        }

        try {
            await axios.post('/api/purchase-orders', {
                supplier_id: Number(form.supplier_id),
                expected_delivery_date: form.expected_delivery_date || null,
                notes: form.notes || null,
                items: [
                    {
                        item_id: Number(form.item_id),
                        quantity: Number(form.quantity),
                        unit_price: Number(form.unit_price),
                    },
                ],
            });

            setForm({
                supplier_id: '',
                item_id: '',
                quantity: '',
                unit_price: '',
                expected_delivery_date: '',
                notes: '',
            });

            fetchData();
        } catch (error) {
            console.error('Failed to create PO:', error);
        }
    };

    const transition = async (id: number, action: 'submit' | 'approve' | 'ordered' | 'receive' | 'cancel') => {
        try {
            if (action === 'cancel') {
                const reason = window.prompt('Cancellation reason:');
                if (!reason) {
                    return;
                }
                await axios.post(`/api/purchase-orders/${id}/cancel`, { reason });
            } else {
                await axios.post(`/api/purchase-orders/${id}/${action}`);
            }
            fetchData();
        } catch (error) {
            console.error(`Failed to ${action} PO:`, error);
        }
    };

    const currency = 'GHS';

    return (
        <AppLayout>
            <Head title="Purchase Orders" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
                    <p className="text-sm text-slate-600">Create and move purchase orders through Draft to Received stages</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="mb-3 text-base font-medium text-slate-900">Create Draft Purchase Order</h2>

                    <form onSubmit={createPurchaseOrder} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <select
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            value={form.supplier_id}
                            onChange={(e) => setForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
                            required
                        >
                            <option value="">Select supplier</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.company_name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            value={form.item_id}
                            onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedItem = inventoryItems.find((item) => item.id === selectedId) || lowStockItems.find((item) => item.id === selectedId);
                                setForm((prev) => ({
                                    ...prev,
                                    item_id: e.target.value,
                                    quantity: selectedItem?.reorder_quantity ? String(selectedItem.reorder_quantity) : prev.quantity,
                                    unit_price: selectedItem?.cost_price ? String(selectedItem.cost_price) : prev.unit_price,
                                }));
                            }}
                            required
                        >
                            <option value="">Select product</option>
                            {inventoryItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.sku})
                                </option>
                            ))}
                        </select>

                        {/* Quick suggestions for low-stock items */}
                        {lowStockItems.length > 0 && (
                            <div className="md:col-span-3">
                                <p className="text-sm text-slate-600">Suggested items (low stock):</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {lowStockItems.map((sugg) => (
                                        <button
                                            key={sugg.id}
                                            type="button"
                                            className="rounded border border-slate-300 px-3 py-1 text-sm"
                                            onClick={() => setForm((prev) => ({
                                                ...prev,
                                                item_id: String(sugg.id),
                                                quantity: String(sugg.reorder_quantity ?? prev.quantity),
                                                unit_price: String(sugg.cost_price ?? prev.unit_price),
                                            }))}
                                        >
                                            {sugg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Quantity"
                            value={form.quantity}
                            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                            required
                        />

                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Unit price"
                            value={form.unit_price}
                            onChange={(e) => setForm((prev) => ({ ...prev, unit_price: e.target.value }))}
                            required
                        />

                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            type="date"
                            value={form.expected_delivery_date}
                            onChange={(e) => setForm((prev) => ({ ...prev, expected_delivery_date: e.target.value }))}
                            required
                        />

                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Notes"
                            value={form.notes}
                            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                        />

                        <div className="md:col-span-3">
                            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
                                Create Draft PO
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    {loading ? (
                        <p className="text-sm text-slate-500">Loading purchase orders...</p>
                    ) : orders.length === 0 ? (
                        <p className="text-sm text-slate-500">No purchase orders found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500">
                                        <th className="px-2 py-2">PO Number</th>
                                        <th className="px-2 py-2">Supplier</th>
                                        <th className="px-2 py-2">Status</th>
                                        <th className="px-2 py-2">Total</th>
                                        <th className="px-2 py-2">Created</th>
                                        <th className="px-2 py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-t border-slate-100">
                                            <td className="px-2 py-2 text-slate-800">{order.po_number}</td>
                                            <td className="px-2 py-2 text-slate-600">{order.supplier?.company_name || '-'}</td>
                                            <td className="px-2 py-2 text-slate-600">{order.status}</td>
                                            <td className="px-2 py-2 text-slate-600">
                                                {Number(order.total_amount).toLocaleString('en-GH', {
                                                    style: 'currency',
                                                    currency,
                                                })}
                                            </td>
                                            <td className="px-2 py-2 text-slate-600">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {order.status === 'draft' && (
                                                        <button
                                                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                            onClick={() => transition(order.id, 'submit')}
                                                        >
                                                            Submit
                                                        </button>
                                                    )}

                                                    {order.status === 'submitted' && (
                                                        <button
                                                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                            onClick={() => transition(order.id, 'approve')}
                                                        >
                                                            Approve
                                                        </button>
                                                    )}

                                                    {order.status === 'approved' && (
                                                        <button
                                                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                            onClick={() => transition(order.id, 'ordered')}
                                                        >
                                                            Mark Ordered
                                                        </button>
                                                    )}

                                                    {(order.status === 'ordered' || order.status === 'approved') && (
                                                        <button
                                                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                            onClick={() => transition(order.id, 'receive')}
                                                        >
                                                            Receive
                                                        </button>
                                                    )}

                                                    {!['cancelled', 'received'].includes(order.status) && (
                                                        <button
                                                            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                                                            onClick={() => transition(order.id, 'cancel')}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
