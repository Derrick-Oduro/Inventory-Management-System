<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AuditLogController extends Controller
{
    /**
     * Get audit logs (Admin only)
     */
    public function index(Request $request)
    {
        try {
            \Log::info('Audit logs request received', ['user' => Auth::user()->id, 'params' => $request->all()]);

            // Check if user is admin
            if (Auth::user()->role->name !== 'Admin') {
                \Log::warning('Non-admin user trying to access audit logs', ['user' => Auth::user()->id]);
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $query = AuditLog::with('user')->orderBy('created_at', 'desc');

            // Count total logs before filters
            $totalLogs = AuditLog::count();
            \Log::info('Total audit logs in database: ' . $totalLogs);

            // Apply search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('entity_type', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Apply date filter
            if ($request->has('date_from') && $request->date_from) {
                $query->where('created_at', '>=', Carbon::parse($request->date_from)->startOfDay());
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->where('created_at', '<=', Carbon::parse($request->date_to)->endOfDay());
            }

            // Apply action filter
            if ($request->has('action') && $request->action) {
                $query->where('action', $request->action);
            }

            // Apply user filter
            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            // Count filtered logs
            $filteredCount = $query->count();
            \Log::info('Filtered audit logs count: ' . $filteredCount);

            // Pagination
            $perPage = $request->get('per_page', 50);
            $logs = $query->paginate($perPage);

            \Log::info('Returning logs', ['count' => $logs->count(), 'total' => $logs->total()]);

            return response()->json($logs);
        } catch (\Exception $e) {
            \Log::error('Error fetching audit logs: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch audit logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export audit logs (Admin only)
     */
    public function export(Request $request)
    {
        // Check if user is admin
        if (Auth::user()->role->name !== 'Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $query = AuditLog::with('user')->orderBy('created_at', 'desc');

            // Apply same filters as index
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('entity_type', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->where('created_at', '>=', Carbon::parse($request->date_from)->startOfDay());
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->where('created_at', '<=', Carbon::parse($request->date_to)->endOfDay());
            }

            $logs = $query->limit(10000)->get(); // Limit for performance

            $csvData = "User,Action,Description,Entity,Timestamp,IP Address\n";

            foreach ($logs as $log) {
                $csvData .= sprintf(
                    '"%s","%s","%s","%s","%s","%s"' . "\n",
                    $log->user ? $log->user->name : 'System',
                    $log->action,
                    $log->description,
                    $log->entity_type . ($log->entity_id ? " #{$log->entity_id}" : ''),
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->ip_address
                );
            }

            return response($csvData)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="audit_logs_' . date('Y-m-d') . '.csv"');

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to export audit logs'], 500);
        }
    }

    /**
     * Get unique actions for filtering
     */
    public function getActions()
    {
        try {
            \Log::info('Getting actions for user: ' . Auth::user()->id);

            if (Auth::user()->role->name !== 'Admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $actions = AuditLog::distinct('action')->pluck('action')->sort()->values();
            \Log::info('Found actions: ', $actions->toArray());

            return response()->json($actions);
        } catch (\Exception $e) {
            \Log::error('Error fetching actions: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch actions'], 500);
        }
    }

    /**
     * Get users who have audit logs for filtering
     */
    public function getUsers()
    {
        try {
            \Log::info('Getting users for audit logs');

            if (Auth::user()->role->name !== 'Admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $users = AuditLog::with('user')
                ->select('user_id')
                ->distinct()
                ->whereNotNull('user_id')
                ->get()
                ->pluck('user')
                ->filter() // Remove null values
                ->sortBy('name')
                ->values();

            \Log::info('Found users for audit logs: ', $users->pluck('name')->toArray());

            return response()->json($users);
        } catch (\Exception $e) {
            \Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }
}
