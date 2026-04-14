import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES = [
    { value: 1, label: 'Admin' },
    { value: 2, label: 'IT Agent' },
    { value: 3, label: 'Staff' },
];

type RegisterUserModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: number;
};

export default function RegisterUserModal({ show, onClose, onSuccess }: RegisterUserModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: ROLES[0].value,
    });

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('create-user'), {
            onSuccess: () => {
                console.log("Begin user data submission");
                reset('password', 'password_confirmation');
                onSuccess();
                onClose();
            },
            onError: (errors) => {
                // Errors are automatically handled by Inertia
                console.error('Registration errors:', errors);
            },
        });
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add New User</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <div className="flex gap-4">
                            {ROLES.map(role => (
                                <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        checked={data.role === role.value}
                                        onChange={() => setData('role', role.value)}
                                        disabled={processing}
                                        className="form-radio h-4 w-4 text-[#071A22] border-gray-300 focus:ring-[#071A22]"
                                    />
                                    <span>{role.label}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.role} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-700 text-white py-2 px-4 rounded"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            className="bg-green-500 hover:bg-green-700 text-white"
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                            Save User
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
