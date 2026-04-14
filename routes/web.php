<?php

use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified', 'active.user'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('inventory', function () {
        return Inertia::render('inventory');
    })->name('inventory');

    Route::get('suppliers', function () {
        return Inertia::render('suppliers');
    })->name('suppliers');

    Route::get('purchase-orders', function () {
        return Inertia::render('purchase-orders');
    })->name('purchase-orders');

    Route::get('reports', function () {
        return Inertia::render('reports');
    })->name('reports');

    Route::get('users', [UsersController::class, 'index'])
        ->name('users.index')
        ->middleware('role:Admin');

    Route::get('settings/locations', function () {
        return Inertia::render('settings/locations');
    })->name('settings.locations')->middleware('role:Admin');

    Route::get('settings/audit-logs', function () {
        return Inertia::render('settings/audit-logs');
    })->name('settings.audit-logs')->middleware('role:Admin');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
