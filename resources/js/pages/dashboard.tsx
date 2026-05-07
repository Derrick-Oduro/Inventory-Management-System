import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js';
import { AlertTriangle, Boxes, DollarSign, Package } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useEffect, useMemo, useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

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

    const lowStockChartData = useMemo(() => {
        const items = summary.low_stock_items.slice(0, 8);
        return {
            labels: items.map((item) => item.name),
            datasets: [
                {
                    label: 'Restock Needed',
                    data: items.map((item) => Math.max(item.reorder_level - item.current_quantity, 0)),
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderRadius: 8,
                },
            ],
        };
    }, [summary.low_stock_items]);

    const purchaseOrderStatusData = useMemo(() => {
        const base = {
            draft: 0,
            submitted: 0,
            approved: 0,
            ordered: 0,
            received: 0,
            cancelled: 0,
        };

        for (const purchaseOrder of summary.recent_purchase_orders) {
            if (purchaseOrder.status in base) {
                base[purchaseOrder.status as keyof typeof base] += 1;
            }
        }

        return {
            labels: ['Draft', 'Submitted', 'Approved', 'Ordered', 'Received', 'Cancelled'],
            datasets: [
                {
                    data: [base.draft, base.submitted, base.approved, base.ordered, base.received, base.cancelled],
                    backgroundColor: ['#94A3B8', '#6366F1', '#3B82F6', '#8B5CF6', '#10B981', '#F43F5E'],
                    borderWidth: 0,
                },
            ],
        };
    }, [summary.recent_purchase_orders]);

    const purchaseOrderTrendData = useMemo(() => {
        const today = new Date();
        const labels: string[] = [];
        const totals: number[] = [];

        for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
            const dayDate = new Date(today);
            dayDate.setDate(today.getDate() - dayOffset);
            const dayKey = dayDate.toISOString().slice(0, 10);
            labels.push(dayDate.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }));

            const dayTotal = summary.recent_purchase_orders
                .filter((purchaseOrder) => purchaseOrder.created_at.slice(0, 10) === dayKey)
                .reduce((sum, purchaseOrder) => sum + Number(purchaseOrder.total_amount || 0), 0);

            totals.push(dayTotal);
        }

        return {
            labels,
            datasets: [
                {
                    label: 'PO Value (₵)',
                    data: totals,
                    borderColor: '#0F172A',
                    backgroundColor: 'rgba(15, 23, 42, 0.12)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                },
            ],
        };
    }, [summary.recent_purchase_orders]);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Inventory Dashboard</h1>
                            <p className="mt-1 text-sm text-slate-200">Welcome back, {auth.user.name}. Track stock, value, and procurement in real time.</p>
                        </div>
                        <div className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-slate-100">
                            Last refresh: {lastUpdated}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard icon={Package} label="Total Products" value={summary.total_products} tone="blue" />
                    <SummaryCard icon={Boxes} label="Total Stock Quantity" value={summary.total_stock_quantity.toLocaleString()} tone="violet" />
                    <SummaryCard
                        icon={DollarSign}
                        label="Total Stock Value"
                        value={summary.total_stock_value.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}
                        tone="green"
                    />
                    <SummaryCard icon={AlertTriangle} label="Open Low-Stock Alerts" value={summary.open_alerts_count} tone="amber" />
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
                        <div className="mb-3">
                            <h2 className="text-lg font-medium text-slate-900">Purchase Order Value Trend (7 Days)</h2>
                            <p className="text-sm text-slate-600">Daily total of recent purchase order amounts</p>
                        </div>
                        <div className="h-64">
                            <Line
                                data={purchaseOrderTrendData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: {
                                            ticks: {
                                                callback: (value) =>
                                                    Number(value).toLocaleString('en-GH', {
                                                        style: 'currency',
                                                        currency: 'GHS',
                                                        maximumFractionDigits: 0,
                                                    }),
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3">
                            <h2 className="text-lg font-medium text-slate-900">PO Status Mix</h2>
                            <p className="text-sm text-slate-600">Current distribution by workflow status</p>
                        </div>
                        <div className="h-64">
                            <Doughnut
                                data={purchaseOrderStatusData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: { boxWidth: 10, usePointStyle: true },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </section>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                        <h2 className="text-lg font-medium text-slate-900">Low Stock Severity</h2>
                        <p className="text-sm text-slate-600">Top items by restock quantity gap</p>
                    </div>
                    <div className="h-64">
                        <Bar
                            data={lowStockChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                            }}
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
                                                <td className="px-2 py-2">
                                                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                        {item.current_quantity}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2 text-slate-600">{item.reorder_level}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusBadgeClass(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-slate-600">
                                            {po.supplier?.company_name || 'Unknown supplier'}
                                        </div>
                                        <div className="mt-1 text-slate-500">
                                            {Number(po.total_amount).toLocaleString('en-GH', {
                                                style: 'currency',
                                                currency: 'GHS',
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

function statusBadgeClass(status: string): string {
    if (status === 'received') return 'bg-emerald-100 text-emerald-700';
    if (status === 'approved') return 'bg-blue-100 text-blue-700';
    if (status === 'submitted') return 'bg-indigo-100 text-indigo-700';
    if (status === 'ordered') return 'bg-violet-100 text-violet-700';
    if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    tone: 'blue' | 'violet' | 'green' | 'amber';
}) {
    const toneMap = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        violet: 'bg-violet-50 text-violet-700 border-violet-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
    } as const;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${toneMap[tone]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm text-slate-600">{label}</div>
            <div className="text-xl font-semibold text-slate-900">{value}</div>
        </div>
    );
}
