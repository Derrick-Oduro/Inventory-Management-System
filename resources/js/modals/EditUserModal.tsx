import { useState, useEffect } from 'react';
import axios from 'axios';
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

type EditUserModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: {
        id: number;
        name: string;
        email: string;
        role?: { id?: number; name?: string };
    } | null;
};

export default function EditUserModal({ show, onClose, onSuccess, user }: EditUserModalProps) {
    type FormData = {
        name: string;
        email: string;
        password?: string;
        password_confirmation?: string;
        role: number;
    };

    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 1,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form when user prop changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                password_confirmation: '',
                role: user.role?.id || 1,
            });
        }
    }, [user]);

    if (!show || !user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (roleId: number) => {
        setFormData(prev => ({ ...prev, role: roleId }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Only include password if it's provided
        const dataToSend = { ...formData };
        if (!dataToSend.password) {
            delete dataToSend.password;
            delete dataToSend.password_confirmation;
        }

        axios.put(`/api/users/${user.id}`, dataToSend)
            .then(() => {
                onSuccess();
                onClose();
            })
            .catch(error => {
                console.error('Error updating user:', error);
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
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
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    onClick={onClose}
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit User</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            autoFocus
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="Full name"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="email@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                                        checked={formData.role === role.value}
                                        onChange={() => handleRoleChange(role.value)}
                                        disabled={isSubmitting}
                                        className="form-radio h-4 w-4 text-[#071A22] border-gray-300 focus:ring-[#071A22]"
                                    />
                                    <span>{role.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">
                            Password <span className="text-xs text-gray-500">(leave blank to keep current)</span>
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="New password"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="Confirm new password"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-700 text-white py-2 px-4 rounded"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
