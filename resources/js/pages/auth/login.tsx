import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

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
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
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

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center lg:min-h-[calc(100vh-4rem)]">
                    <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 lg:grid-cols-2">
                        <div className="relative hidden overflow-hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                            <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-sky-400/20 blur-2xl" />
                            <div className="absolute -bottom-10 -right-8 h-44 w-44 rounded-full bg-indigo-400/20 blur-2xl" />

                            <div className="relative">
                                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
                                    Inventory Management System
                                </span>
                                <h1 className="mt-5 text-3xl font-semibold leading-tight">
                                    Welcome back
                                </h1>
                                <p className="mt-3 max-w-md text-sm text-slate-200">
                                    Sign in to manage inventory, suppliers, purchase orders, and reports in one place.
                                </p>
                            </div>

                            <div className="relative space-y-3 text-sm text-slate-200">
                                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Centralized stock and product visibility</div>
                                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Supplier and purchase workflow control</div>
                                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Audit-ready operations and reporting</div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-10 lg:p-12">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold text-slate-900">Log in</h2>
                                <p className="mt-2 text-sm text-slate-600">Use your assigned credentials to continue.</p>
                            </div>

                            <form className="space-y-5" onSubmit={submit}>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        disabled={processing}
                                        className="mt-1 h-11"
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        {canResetPassword && (
                                            <TextLink href={route('password.request')} className="text-sm">
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        disabled={processing}
                                        className="mt-1 h-11"
                                    />
                                    <InputError message={errors.password} className="mt-1" />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onClick={() => setData('remember', !data.remember)}
                                        disabled={processing}
                                    />
                                    <Label htmlFor="remember" className="text-sm text-slate-700">
                                        Remember me
                                    </Label>
                                </div>

                                <Button type="submit" className="h-11 w-full" disabled={processing}>
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Log in
                                </Button>
                            </form>

                            {status && (
                                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    {status}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
