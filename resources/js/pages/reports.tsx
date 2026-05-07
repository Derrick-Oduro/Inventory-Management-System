import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

type DateRange = {
    from_date: string;
    to_date: string;
};

export default function ReportsPage() {
    const [stockPreview, setStockPreview] = useState<any[]>([]);
    const [poPreview, setPoPreview] = useState<any[]>([]);
    const [range, setRange] = useState<DateRange>({
        from_date: '',
        to_date: '',
    });

    const fetchCurrentStock = async () => {
        try {
            const response = await axios.get('/api/reports/current-stock');
            setStockPreview(response.data);
        } catch (error) {
            console.error('Failed to fetch stock report:', error);
        }
    };

    const fetchPurchaseOrders = async () => {
        try {
            const response = await axios.get('/api/reports/purchase-orders', {
                params: {
                    from_date: range.from_date || undefined,
                    to_date: range.to_date || undefined,
                },
            });
            setPoPreview(response.data);
        } catch (error) {
            console.error('Failed to fetch purchase order report:', error);
        }
    };

    const downloadReport = async (url: string, filename: string, params: Record<string, string | undefined> = {}) => {
        try {
            const response = await axios.get(url, {
                params: {
                    ...params,
                    download: '1',
                },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Failed to download report:', error);
        }
    };

    return (
        <AppLayout>
            <Head title="Reports" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
                    <p className="text-sm text-slate-600">Generate current stock and purchase order reports</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="text-base font-medium text-slate-900">Current Stock Report</h2>
                    <p className="mb-3 text-sm text-slate-600">Products with stock quantity, location, cost, and value</p>

                    <div className="mb-4 flex flex-wrap gap-2">
                        <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={fetchCurrentStock}>
                            Preview
                        </button>
                        <button
                            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                            onClick={() => downloadReport('/api/reports/current-stock', 'current-stock-report.csv')}
                        >
                            Download CSV (Excel)
                        </button>
                    </div>

                    {stockPreview.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500">
                                        <th className="px-2 py-2">Product</th>
                                        <th className="px-2 py-2">SKU</th>
                                        <th className="px-2 py-2">Location</th>
                                        <th className="px-2 py-2">Quantity</th>
                                        <th className="px-2 py-2">Cost</th>
                                        <th className="px-2 py-2">Total Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockPreview.slice(0, 20).map((row, index) => (
                                        <tr key={`${row.sku}-${index}`} className="border-t border-slate-100">
                                            <td className="px-2 py-2">{row.product_name}</td>
                                            <td className="px-2 py-2">{row.sku}</td>
                                            <td className="px-2 py-2">{row.location}</td>
                                            <td className="px-2 py-2">{row.quantity}</td>
                                            <td className="px-2 py-2">{Number(row.cost_price ?? 0).toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</td>
                                            <td className="px-2 py-2">{Number(row.total_value ?? 0).toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="text-base font-medium text-slate-900">Purchase Order Report</h2>
                    <p className="mb-3 text-sm text-slate-600">Purchase orders by date range, status, supplier, and total cost</p>

                    <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input
                            className="rounded border border-slate-300 px-3 py-2 text-sm"
                            type="date"
                            value={range.from_date}
                            onChange={(e) => setRange((prev) => ({ ...prev, from_date: e.target.value }))}
                        />
                        <input
                            className="rounded border border-slate-300 px-3 py-2 text-sm"
                            type="date"
                            value={range.to_date}
                            onChange={(e) => setRange((prev) => ({ ...prev, to_date: e.target.value }))}
                        />
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                        <button className="rounded border border-slate-300 px-3 py-2 text-sm" onClick={fetchPurchaseOrders}>
                            Preview
                        </button>
                        <button
                            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                            onClick={() =>
                                downloadReport('/api/reports/purchase-orders', 'purchase-order-report.csv', {
                                    from_date: range.from_date || undefined,
                                    to_date: range.to_date || undefined,
                                })
                            }
                        >
                            Download CSV (Excel)
                        </button>
                    </div>

                    {poPreview.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500">
                                        <th className="px-2 py-2">PO Number</th>
                                        <th className="px-2 py-2">Supplier</th>
                                        <th className="px-2 py-2">Status</th>
                                        <th className="px-2 py-2">Total</th>
                                        <th className="px-2 py-2">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poPreview.slice(0, 20).map((row) => (
                                        <tr key={row.id} className="border-t border-slate-100">
                                            <td className="px-2 py-2">{row.po_number}</td>
                                            <td className="px-2 py-2">{row.supplier?.company_name || '-'}</td>
                                            <td className="px-2 py-2">{row.status}</td>
                                            <td className="px-2 py-2">{Number(row.total_amount ?? 0).toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}</td>
                                            <td className="px-2 py-2">{new Date(row.created_at).toLocaleDateString()}</td>
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
