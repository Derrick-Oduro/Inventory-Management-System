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
    }
}