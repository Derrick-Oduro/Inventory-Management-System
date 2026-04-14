<?php

use App\Http\Controllers\StockTransactionController;
use App\Http\Controllers\StockTransferController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\UserController; // ADD THIS LINE ONLY
use App\Http\Controllers\TicketController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\RequisitionController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AuditLogController; // ADD THIS LINE

Route::middleware(['web', 'auth'])->group(function () {
    // Notification routes - THESE MUST BE FIRST
    Route::get('/api/notifications', [NotificationController::class, 'index']);
    Route::post('/api/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::post('/api/notifications/{id}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::post('/api/notifications/test', [NotificationController::class, 'test']);

    // Ticket routes
    Route::get('/api/tickets', [TicketController::class, 'index']);
    Route::post('/api/tickets', [TicketController::class, 'store']);
    Route::post('/api/tickets/{id}/assign', [TicketController::class, 'assignTicket']);
    Route::post('/api/tickets/{id}/update', [TicketController::class, 'updateTicket']);
    Route::get('/api/tickets/completion-stats', [TicketController::class, 'getCompletionStats']);

    Route::get('/api/users/agents', [UsersController::class, 'getAgents']);

    // Inventory routes
    Route::get('/api/inventory/items', [InventoryController::class, 'getItems']);
    Route::get('/api/inventory/items/{id}/transactions', [InventoryController::class, 'getItemTransactions']);
    Route::post('/api/inventory/items', [InventoryController::class, 'store']);
    Route::put('/api/inventory/items/{id}', [InventoryController::class, 'update']);
    Route::post('/api/inventory/items/{id}/adjust', [InventoryController::class, 'adjustQuantity']);
    Route::post('/api/inventory/categories', [InventoryController::class, 'storeCategory']);
    Route::post('/api/inventory/units', [InventoryController::class, 'storeUnitOfMeasure']);
    Route::delete('/api/inventory/items/{id}', [InventoryController::class, 'destroy']);

    // Requisition routes
    Route::get('/api/requisitions', [RequisitionController::class, 'index']);
    Route::post('/api/requisitions', [RequisitionController::class, 'store']);
    Route::get('/api/requisitions/{id}', [RequisitionController::class, 'show']);
    Route::put('/api/requisitions/{id}', [RequisitionController::class, 'update']);

    // Location routes
    Route::get('/api/locations', [LocationController::class, 'index']);
    Route::post('/api/locations', [LocationController::class, 'store']);
    Route::put('/api/locations/{id}', [LocationController::class, 'update']);
    Route::delete('/api/locations/{id}', [LocationController::class, 'destroy']);
    Route::post('/api/locations/{id}/toggle-status', [LocationController::class, 'toggleStatus']);
    Route::get('/api/locations/stats', [LocationController::class, 'getLocationsWithStats']);

    // Category and Unit routes
    Route::get('/api/inventory/categories', [InventoryController::class, 'getCategories']);
    Route::delete('/api/inventory/categories/{id}', [InventoryController::class, 'destroyCategory']);
    Route::get('/api/inventory/units', [InventoryController::class, 'getUnits']);
    Route::delete('/api/inventory/units/{id}', [InventoryController::class, 'destroyUnit']);


    // User routes
    Route::get('/api/users', [UsersController::class, 'getAllUsers']);
    Route::post('/api/users', [UsersController::class, 'addUser']);
    Route::delete('/api/users/{id}', [UsersController::class, 'deleteUser']);
    Route::put('/api/users/{id}', [UsersController::class, 'updateUser']);
    Route::patch('/api/users/{id}/toggle-status', [UsersController::class, 'toggleStatus']);

    // Audit log routes (Admin only)
    Route::get('/api/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/api/audit-logs/export', [AuditLogController::class, 'export']);
    Route::get('/api/audit-logs/actions', [AuditLogController::class, 'getActions']);
    Route::get('/api/audit-logs/users', [AuditLogController::class, 'getUsers']);
});
