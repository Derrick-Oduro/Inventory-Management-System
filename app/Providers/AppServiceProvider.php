<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Inertia::share('auth', function () {
            $user = Auth::id() ? \App\Models\User::with('role')->find(Auth::id()) : null;
            return [
                'user' => $user ? $user->toArray() : null,
            ];
        });

        // Share application-level settings (like currency) with Inertia pages
        Inertia::share('app', function () {
            return [
                'currency' => config('app.currency', 'GHS'),
                'available_currencies' => config('app.available_currencies', ['GHS', 'USD']),
            ];
        });
    }
}
