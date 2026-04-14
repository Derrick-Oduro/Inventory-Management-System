import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permissions settings',
        href: '/settings/permissions',
    },
];

export default function Permissions() {
    const [roles, setRoles] = useState([
        { id: 1, name: 'Admin', permissions: ['all'] },
        { id: 2, name: 'IT Agent', permissions: ['tickets', 'inventory_view'] },
        { id: 3, name: 'Employee', permissions: ['tickets_create', 'requisitions'] },
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Permissions settings" description="Manage user roles and permissions" />

                    <div className="space-y-4">
                        {roles.map(role => (
                            <div key={role.id} className="border rounded-lg p-4">
                                <h3 className="font-medium text-lg mb-2">{role.name}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Dashboard', 'Tickets', 'Inventory', 'Requisitions', 'Stock Transfers', 'Users', 'Settings'].map(permission => (
                                        <label key={permission} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                defaultChecked={role.permissions.includes('all') || role.permissions.includes(permission.toLowerCase())}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm">{permission}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button>Save Permissions</Button>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
