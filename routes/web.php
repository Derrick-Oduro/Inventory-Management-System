<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\LocationController;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('tickets', function () {
        return Inertia::render('tickets');
    })->name('tickets');

    Route::get('inventory', function () {
        return Inertia::render('inventory');
    })->name('inventory');

    Route::get('requisitions', function () {
        return Inertia::render('requisitions');
    })->name('requisitions');

    Route::get('stock-transfers', function () {
        return Inertia::render('stock-transfers');
    })->name('stock-transfers');

    Route::get('settings', function () {
        return Inertia::render('settings');
    })->name('settings');

    // Add new settings routes
    Route::get('settings/permissions', function () {
        return Inertia::render('settings/permissions');
    })->name('settings.permissions')->middleware('role:Admin');

    Route::get('settings/inventory-options', function () {
        return Inertia::render('settings/inventory-options');
    })->name('settings.inventory-options')->middleware('role:Admin');

    Route::get('settings/locations', function () {
        return Inertia::render('settings/locations');
    })->name('settings.locations')->middleware('role:Admin');


    Route::get('settings/audit-logs', function () {
        return Inertia::render('settings/audit-logs');
    })->name('settings.audit-logs')->middleware('role:Admin');

    Route::get('users', [UsersController::class, 'index'])->name('users.index');

    // Add location routes
    Route::get('/locations', [LocationController::class, 'index'])->name('locations.index');
    Route::post('/locations', [LocationController::class, 'store'])->name('locations.store');
    Route::post('/locations/{id}/toggle-status', [LocationController::class, 'toggleStatus'])->name('locations.toggle-status');
});

//Route::middleware(['auth', 'role:Admin'])->group(function () {
//Route::resource('users', UsersController::class)->except(['show', 'edit', 'update']);
//});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/api.php';

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
