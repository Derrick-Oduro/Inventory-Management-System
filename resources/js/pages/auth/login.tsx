import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    role: string;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const ROLES = [
    { value: 'Admin', label: 'Admin' },
    { value: 'IT Agent', label: 'IT Agent' },
    { value: 'Staff', label: 'Staff' },
];

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
        role: 'Admin',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full">
                    <div className="flex">
                        {/* Left: Form */}
                        <div className="w-full lg:w-1/2 p-12">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="flex justify-center items-center mb-6">
                                    <img
                                        src="/images/company-logo.jpg"
                                        alt="Company Logo"
                                        className="h-16 w-16 object-contain rounded-xl mr-3"
                                    />
                                    <div className="text-left">
                                        <h1 className="text-2xl font-bold text-gray-800">IT Support</h1>
                                        <p className="text-sm text-gray-500">System</p>
                                    </div>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                                <p className="text-gray-500">Please sign in to your account</p>
                            </div>

                            <form className="space-y-6" onSubmit={submit}>
                                {/* Role selection with modern pills */}
                                <div>
                                    <Label className="text-gray-700 font-medium mb-3 block">Sign in as</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {ROLES.map((roleOption) => (
                                            <label key={roleOption.value} className="cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={roleOption.value}
                                                    checked={data.role === roleOption.value}
                                                    onChange={e => setData('role', e.target.value)}
                                                    className="sr-only"
                                                    disabled={processing}
                                                />
                                                <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    data.role === roleOption.value
                                                        ? 'bg-blue-600 text-white shadow-lg'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}>
                                                    {roleOption.label}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.role} />
                                </div>

                                {/* Email Field */}
                                <div>
                                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                                    <div className="mt-2">
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="Enter your email"
                                            disabled={processing}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password Field */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                                        {canResetPassword && (
                                            <TextLink
                                                href={route('password.request')}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <div className="mt-2 relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            placeholder="Enter your password"
                                            disabled={processing}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onClick={() => setData('remember', !data.remember)}
                                        disabled={processing}
                                        className="rounded"
                                    />
                                    <Label htmlFor="remember" className="ml-2 text-gray-600">Remember me</Label>
                                </div>

                                {/* Login Button */}
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <LoaderCircle className="h-5 w-5 animate-spin mr-2 inline" />
                                    ) : null}
                                    Sign In
                                </Button>
                            </form>

                            {status && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="text-sm text-green-700 text-center">{status}</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Decorative Side */}
                        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-900/90"></div>

                            {/* Decorative Elements */}
                            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
                            <div className="absolute bottom-20 left-10 w-20 h-20 bg-white/10 rounded-full"></div>
                            <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-white/5 rounded-full"></div>

                            {/* Content */}
                            <div className="relative z-10 h-full flex flex-col justify-center items-center p-12 text-white text-center">
                                <div className="mb-8">
                                    <div className="text-6xl mb-4">🚢</div>
                                    <h3 className="text-4xl font-bold mb-4">Harbor Management</h3>
                                    <p className="text-xl opacity-90 leading-relaxed">
                                        Streamlining port operations with advanced IT support and management systems
                                    </p>
                                </div>

                                <div className="space-y-4 text-left">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        <span className="text-lg">Real-time monitoring</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        <span className="text-lg">Efficient ticket management</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        <span className="text-lg">Inventory tracking</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
