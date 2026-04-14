import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, Boxes, DollarSign, Package } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type DashboardSummary = {
    total_products: number;
    total_stock_quantity: number;
    total_stock_value: number;
    low_stock_items: Array<{
        id: number;
        name: string;
        sku: string;
        category?: string | null;
        current_quantity: number;
        reorder_level: number;
    }>;
    open_alerts_count: number;
    recent_purchase_orders: Array<{
        id: number;
        po_number: string;
        status: string;
        total_amount: number;
        supplier?: { company_name: string };
        created_at: string;
    }>;
    generated_at: string;
};

const initialSummary: DashboardSummary = {
    total_products: 0,
    total_stock_quantity: 0,
    total_stock_value: 0,
    low_stock_items: [],
    open_alerts_count: 0,
    recent_purchase_orders: [],
    generated_at: '',
};

export default function Dashboard() {
    const { auth } = usePage<{ auth: { user: { name: string; role?: { name: string } } } }>().props;
    const [summary, setSummary] = useState<DashboardSummary>(initialSummary);
    const [loading, setLoading] = useState(true);

    const fetchSummary = async () => {
        try {
            const response = await axios.get('/api/dashboard/summary');
            setSummary(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard summary:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        const interval = setInterval(fetchSummary, 60000);
        return () => clearInterval(interval);
    }, []);

    const lastUpdated = useMemo(() => {
        if (!summary.generated_at) return 'Not yet available';
        return new Date(summary.generated_at).toLocaleString();
    }, [summary.generated_at]);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold text-slate-900">Inventory Dashboard</h1>
                    <p className="text-sm text-slate-600">
                        Hello {auth.user.name}. Last refresh: {lastUpdated}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard icon={Package} label="Total Products" value={summary.total_products} />
                    <SummaryCard icon={Boxes} label="Total Stock Quantity" value={summary.total_stock_quantity.toLocaleString()} />
                    <SummaryCard
                        icon={DollarSign}
                        label="Total Stock Value"
                        value={summary.total_stock_value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                    />
                    <SummaryCard icon={AlertTriangle} label="Open Low-Stock Alerts" value={summary.open_alerts_count} />
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <h2 className="text-lg font-medium text-slate-900">Low Stock Items</h2>
                        <p className="mb-3 text-sm text-slate-600">Items at or below their reorder level</p>

                        {loading ? (
                            <p className="text-sm text-slate-500">Loading...</p>
                        ) : summary.low_stock_items.length === 0 ? (
                            <p className="text-sm text-slate-500">No low stock items right now.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-slate-500">
                                            <th className="px-2 py-2">Product</th>
                                            <th className="px-2 py-2">SKU</th>
                                            <th className="px-2 py-2">Current</th>
                                            <th className="px-2 py-2">Reorder</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.low_stock_items.map((item) => (
                                            <tr key={item.id} className="border-t border-slate-100">
                                                <td className="px-2 py-2 text-slate-800">{item.name}</td>
                                                <td className="px-2 py-2 text-slate-600">{item.sku}</td>
                                                <td className="px-2 py-2 text-amber-700">{item.current_quantity}</td>
                                                <td className="px-2 py-2 text-slate-600">{item.reorder_level}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <h2 className="text-lg font-medium text-slate-900">Recent Purchase Orders</h2>
                        <p className="mb-3 text-sm text-slate-600">Latest procurement activity</p>

                        {loading ? (
                            <p className="text-sm text-slate-500">Loading...</p>
                        ) : summary.recent_purchase_orders.length === 0 ? (
                            <p className="text-sm text-slate-500">No purchase orders available.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {summary.recent_purchase_orders.map((po) => (
                                    <li key={po.id} className="rounded-lg border border-slate-100 px-3 py-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-medium text-slate-800">{po.po_number}</span>
                                            <span className="text-xs uppercase tracking-wide text-slate-500">{po.status}</span>
                                        </div>
                                        <div className="mt-1 text-slate-600">
                                            {po.supplier?.company_name || 'Unknown supplier'}
                                        </div>
                                        <div className="mt-1 text-slate-500">
                                            {Number(po.total_amount).toLocaleString(undefined, {
                                                style: 'currency',
                                                currency: 'USD',
                                            })}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm text-slate-600">{label}</div>
            <div className="text-xl font-semibold text-slate-900">{value}</div>
        </div>
    );
}
