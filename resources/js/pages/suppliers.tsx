import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type Supplier = {
    id: number;
    company_name: string;
    contact_person?: string | null;
    email?: string | null;
    phone?: string | null;
    payment_terms?: string | null;
    expected_delivery_days: number;
    is_active: boolean;
    items_count?: number;
};

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        payment_terms: 'Net 30',
        expected_delivery_days: 7,
    });

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/suppliers', {
                params: search ? { search } : {},
            });
            setSuppliers(response.data);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const submitSupplier = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await axios.post('/api/suppliers', form);
            setForm({
                company_name: '',
                contact_person: '',
                email: '',
                phone: '',
                payment_terms: 'Net 30',
                expected_delivery_days: 7,
            });
            fetchSuppliers();
        } catch (error) {
            console.error('Failed to create supplier:', error);
        }
    };

    return (
        <AppLayout>
            <Head title="Suppliers" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>
                    <p className="text-sm text-slate-600">Manage supplier records and sourcing details</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <form onSubmit={submitSupplier} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Company name"
                            value={form.company_name}
                            onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                            required
                        />
                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Contact person"
                            value={form.contact_person}
                            onChange={(e) => setForm((prev) => ({ ...prev, contact_person: e.target.value }))}
                        />
                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Phone"
                            value={form.phone}
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Payment terms"
                            value={form.payment_terms}
                            onChange={(e) => setForm((prev) => ({ ...prev, payment_terms: e.target.value }))}
                        />
                        <input
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Expected delivery days"
                            type="number"
                            min={0}
                            value={form.expected_delivery_days}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, expected_delivery_days: Number(e.target.value) || 0 }))
                            }
                        />
                        <div className="md:col-span-3">
                            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
                                Add Supplier
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex gap-2">
                        <input
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Search supplier by company, contact, email, or product"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                            type="button"
                            onClick={fetchSuppliers}
                        >
                            Search
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-slate-500">Loading suppliers...</p>
                    ) : suppliers.length === 0 ? (
                        <p className="text-sm text-slate-500">No suppliers found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500">
                                        <th className="px-2 py-2">Company</th>
                                        <th className="px-2 py-2">Contact</th>
                                        <th className="px-2 py-2">Email</th>
                                        <th className="px-2 py-2">Terms</th>
                                        <th className="px-2 py-2">Lead Time</th>
                                        <th className="px-2 py-2">Products</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliers.map((supplier) => (
                                        <tr key={supplier.id} className="border-t border-slate-100">
                                            <td className="px-2 py-2 text-slate-800">{supplier.company_name}</td>
                                            <td className="px-2 py-2 text-slate-600">{supplier.contact_person || '-'}</td>
                                            <td className="px-2 py-2 text-slate-600">{supplier.email || '-'}</td>
                                            <td className="px-2 py-2 text-slate-600">{supplier.payment_terms || '-'}</td>
                                            <td className="px-2 py-2 text-slate-600">{supplier.expected_delivery_days} days</td>
                                            <td className="px-2 py-2 text-slate-600">{supplier.items_count ?? 0}</td>
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
