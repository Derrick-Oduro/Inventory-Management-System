<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationPreferenceController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'active.user'])->group(function () {
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/test', [NotificationController::class, 'test']);

    Route::get('/notification-preferences', [NotificationPreferenceController::class, 'index']);
    Route::put('/notification-preferences', [NotificationPreferenceController::class, 'upsert']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Inventory (products)
    Route::get('/inventory/items', [InventoryController::class, 'getItems']);
    Route::get('/inventory/items/{id}/transactions', [InventoryController::class, 'getItemTransactions']);
    Route::post('/inventory/items', [InventoryController::class, 'store']);
    Route::put('/inventory/items/{id}', [InventoryController::class, 'update']);
    Route::post('/inventory/items/{id}/adjust', [InventoryController::class, 'adjustQuantity']);
    Route::delete('/inventory/items/{id}', [InventoryController::class, 'destroy']);
    Route::post('/inventory/import', [InventoryController::class, 'importCsv']);

    Route::get('/inventory/categories', [InventoryController::class, 'getCategories']);
    Route::post('/inventory/categories', [InventoryController::class, 'storeCategory']);
    Route::delete('/inventory/categories/{id}', [InventoryController::class, 'destroyCategory']);

    Route::get('/inventory/units', [InventoryController::class, 'getUnits']);
    Route::post('/inventory/units', [InventoryController::class, 'storeUnitOfMeasure']);
    Route::delete('/inventory/units/{id}', [InventoryController::class, 'destroyUnit']);

    // Stock movements
    Route::get('/stock-movements', [StockMovementController::class, 'index']);
    Route::post('/stock-movements', [StockMovementController::class, 'store']);
    Route::post('/stock-movements/{id}/approve', [StockMovementController::class, 'approve']);
    Route::post('/stock-movements/{id}/reject', [StockMovementController::class, 'reject']);

    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    Route::patch('/suppliers/{id}/activate', [SupplierController::class, 'activate']);
    Route::patch('/suppliers/{id}/deactivate', [SupplierController::class, 'deactivate']);
    Route::put('/suppliers/{id}/items', [SupplierController::class, 'syncItems']);

    // Purchase orders
    Route::get('/purchase-orders/suggestions/low-stock', [PurchaseOrderController::class, 'lowStockSuggestions']);
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
    Route::put('/purchase-orders/{id}', [PurchaseOrderController::class, 'update']);
    Route::post('/purchase-orders/{id}/submit', [PurchaseOrderController::class, 'submit']);
    Route::post('/purchase-orders/{id}/approve', [PurchaseOrderController::class, 'approve']);
    Route::post('/purchase-orders/{id}/ordered', [PurchaseOrderController::class, 'markOrdered']);
    Route::post('/purchase-orders/{id}/receive', [PurchaseOrderController::class, 'receive']);
    Route::post('/purchase-orders/{id}/cancel', [PurchaseOrderController::class, 'cancel']);

    // Reports
    Route::get('/reports/current-stock', [ReportController::class, 'currentStock']);
    Route::get('/reports/purchase-orders', [ReportController::class, 'purchaseOrders']);

    // Location routes
    Route::get('/locations', [LocationController::class, 'index']);
    Route::post('/locations', [LocationController::class, 'store']);
    Route::put('/locations/{id}', [LocationController::class, 'update']);
    Route::delete('/locations/{id}', [LocationController::class, 'destroy']);
    Route::post('/locations/{id}/toggle-status', [LocationController::class, 'toggleStatus']);
    Route::get('/locations/stats', [LocationController::class, 'getLocationsWithStats']);

    // User routes
    Route::get('/users', [UsersController::class, 'getAllUsers']);
    Route::post('/users', [UsersController::class, 'store']);
    Route::delete('/users/{id}', [UsersController::class, 'deleteUser']);
    Route::put('/users/{id}', [UsersController::class, 'updateUser']);
    Route::patch('/users/{id}/toggle-status', [UsersController::class, 'toggleStatus']);

    // Audit logs (admin)
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/export', [AuditLogController::class, 'export']);
    Route::get('/audit-logs/actions', [AuditLogController::class, 'getActions']);
    Route::get('/audit-logs/users', [AuditLogController::class, 'getUsers']);
});
