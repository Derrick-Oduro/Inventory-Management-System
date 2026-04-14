<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketUpdate;
use App\Models\User;
use App\Models\AuditLog; // Add this import at the top
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Notifications\TicketNotification;

class TicketController extends Controller
{
    /**
     * Display tickets based on user role
     */
    public function index()
    {
        try {
            $user = Auth::user();
            $role = $user->role->name ?? null;

            // Start with the base query
            $query = Ticket::with(['submittedBy', 'assignedTo', 'updates.user']);

            if ($role === 'Staff') {
                $query = $query->where('submitted_by', $user->id);
            } elseif ($role === 'IT Agent') {
                $query = $query->where('assigned_to', $user->id);
            }

            $tickets = $query->orderBy('created_at', 'desc')->get();

            // Add debugging for IT Agent
            if ($role === 'IT Agent') {
                \Log::info('IT Agent Filter Applied', [
                    'user_id' => $user->id,
                    'tickets_found' => $tickets->count(),
                    'ticket_assignments' => $tickets->pluck('assigned_to')->unique()->values()->toArray()
                ]);
            }

            // Check expiration status for each ticket
            foreach ($tickets as $ticket) {
                $ticket->checkExpiration();
                $ticket->time_until_expiration = $ticket->getTimeUntilExpiration();
                $ticket->expiration_status = $ticket->getExpirationStatus();
            }

            return response()->json($tickets);
        } catch (\Exception $e) {
            \Log::error('Error fetching tickets: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch tickets'], 500);
        }
    }

    /**
     * Store a new ticket (Staff only)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role->name !== 'Staff') {
            return response()->json(['message' => 'Only staff members can create tickets'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high,critical',
        ]);

        $ticket = Ticket::create([
            'title' => $request->title,
            'description' => $request->description,
            'status' => 'new',
            'priority' => $request->priority,
            'submitted_by' => $user->id,
        ]);

        // Notify all admins about new ticket
        $admins = User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->get();

        foreach ($admins as $admin) {
            $admin->notify(new TicketNotification([
                'title' => 'New Ticket Created',
                'message' => "New {$request->priority} priority ticket: {$request->title}",
                'ticket_id' => $ticket->id,
                'action_url' => '/tickets',
                'icon' => 'ticket'
            ]));
        }

        $ticket->save();

        AuditLog::log(
            'TICKET_CREATE',
            "Created ticket: {$ticket->title}",
            'Ticket',
            $ticket->id,
            null,
            $ticket->toArray()
        );

        return response()->json($ticket, 201);
    }

    /**
     * Assign a ticket to an IT agent (Admin only)
     */
    public function assignTicket(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role->name !== 'Admin') {
            return response()->json(['message' => 'Only admins can assign tickets'], 403);
        }

        $request->validate([
            'agent_id' => 'required|exists:users,id',
        ]);

        $ticket = Ticket::findOrFail($id);

        if ($ticket->status !== 'new') {
            return response()->json(['message' => 'Only new tickets can be assigned'], 400);
        }

        $agent = User::findOrFail($request->agent_id);

        if ($agent->role->name !== 'IT Agent') {
            return response()->json(['message' => 'Selected user is not an IT agent'], 400);
        }

        // Check if the agent is active
        if (!$agent->is_active) {
            return response()->json(['message' => 'Cannot assign ticket to inactive user'], 400);
        }

        $ticket->assigned_to = $request->agent_id;
        $ticket->save();

        TicketUpdate::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => 'Ticket has been assigned to ' . $agent->name,
        ]);

        // Only notify if agent is active
        $agent->notify(new TicketNotification([
            'title' => 'Ticket Assigned to You',
            'message' => "You have been assigned ticket: {$ticket->title}",
            'ticket_id' => $ticket->id,
            'action_url' => '/tickets',
            'icon' => 'ticket'
        ]));

        // Notify the ticket submitter
        $ticket->submittedBy->notify(new TicketNotification([
            'title' => 'Ticket Update',
            'message' => "Your ticket '{$ticket->title}' has been assigned to {$agent->name}",
            'ticket_id' => $ticket->id,
            'action_url' => '/tickets',
            'icon' => 'ticket'
        ]));

        $agent = User::findOrFail($request->agent_id);
        AuditLog::log(
            'TICKET_ASSIGN',
            "Assigned ticket '{$ticket->title}' to {$agent->name}",
            'Ticket',
            $ticket->id,
            ['assigned_to' => null],
            ['assigned_to' => $agent->id]
        );

        return response()->json(['message' => 'Ticket assigned successfully']);
    }

    /**
     * Update a ticket's progress (IT Agent only)
     */
    public function updateTicket(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role->name !== 'IT Agent') {
            return response()->json(['message' => 'Only IT agents can update tickets'], 403);
        }

        $request->validate([
            'message' => 'required|string',
            'status' => 'sometimes|string|in:in_progress,resolved',
        ]);

        $ticket = Ticket::findOrFail($id);

        if ($ticket->assigned_to !== $user->id) {
            return response()->json(['message' => 'You can only update tickets assigned to you'], 403);
        }

        $oldStatus = $ticket->status;

        if ($request->filled('status')) {
            $ticket->status = $request->status;
            $ticket->save();
        }

        TicketUpdate::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => $request->message,
        ]);

        // Notify ticket submitter about update
        $statusMessage = $request->filled('status') && $request->status !== $oldStatus
            ? " Status changed to: " . ucfirst(str_replace('_', ' ', $request->status))
            : "";

        $ticket->submittedBy->notify(new TicketNotification([
            'title' => 'Ticket Update',
            'message' => "Update on your ticket '{$ticket->title}': {$request->message}{$statusMessage}",
            'ticket_id' => $ticket->id,
            'action_url' => '/tickets',
            'icon' => 'ticket'
        ]));

        // If resolved, notify admins
        if ($request->status === 'resolved') {
            $admins = User::whereHas('role', function($query) {
                $query->where('name', 'Admin');
            })->get();

            foreach ($admins as $admin) {
                $admin->notify(new TicketNotification([
                    'title' => 'Ticket Resolved',
                    'message' => "Ticket '{$ticket->title}' has been resolved by {$user->name}",
                    'ticket_id' => $ticket->id,
                    'action_url' => '/tickets',
                    'icon' => 'ticket'
                ]));
            }
        }

        AuditLog::log(
            'TICKET_UPDATE',
            "Updated ticket status: {$ticket->title} -> {$ticket->status}",
            'Ticket',
            $ticket->id,
            ['status' => $ticket->getOriginal('status')],
            ['status' => $ticket->status]
        );

        return response()->json(['message' => 'Ticket updated successfully']);
    }

    /**
     * Get ticket completion statistics
     */
    public function getCompletionStats()
    {
        try {
            $user = Auth::user();
            $role = $user->role->name ?? null;

            $query = Ticket::with(['submittedBy', 'assignedTo']);

            // Filter tickets based on user role
            if ($role === 'Staff') {
                $query->where('submitted_by', $user->id);
            } elseif ($role === 'IT Agent') {
                $query->where('assigned_to', $user->id);
            }
            // Admin can see all tickets (no filtering needed)

            // Get completed tickets with completion time
            $completedTickets = $query->whereIn('status', ['resolved', 'closed'])
                ->get()
                ->map(function ($ticket) {
                    $createdAt = new \Carbon\Carbon($ticket->created_at);
                    $completedAt = new \Carbon\Carbon($ticket->updated_at);
                    $completionTimeHours = $createdAt->diffInHours($completedAt);

                    return [
                        'id' => $ticket->id,
                        'title' => $ticket->title,
                        'priority' => $ticket->priority,
                        'completion_time_hours' => $completionTimeHours,
                        'completion_time_formatted' => $this->formatCompletionTime($completionTimeHours),
                        'created_at' => $ticket->created_at,
                        'completed_at' => $ticket->updated_at,
                    ];
                });

            // Calculate average completion time
            $avgCompletionHours = $completedTickets->avg('completion_time_hours') ?? 0;

            // Group by priority for priority-based completion times
            $completionByPriority = $completedTickets->groupBy('priority')->map(function ($tickets) {
                return [
                    'count' => $tickets->count(),
                    'avg_hours' => $tickets->avg('completion_time_hours'),
                    'avg_formatted' => $this->formatCompletionTime($tickets->avg('completion_time_hours')),
                ];
            });

            // Get completion time trends (last 30 days)
            $completionTrends = $completedTickets
                ->filter(function ($ticket) {
                    return \Carbon\Carbon::parse($ticket['completed_at'])->greaterThan(now()->subDays(30));
                })
                ->groupBy(function ($ticket) {
                    return \Carbon\Carbon::parse($ticket['completed_at'])->format('Y-m-d');
                })
                ->map(function ($tickets) {
                    return [
                        'count' => $tickets->count(),
                        'avg_hours' => $tickets->avg('completion_time_hours'),
                        'avg_formatted' => $this->formatCompletionTime($tickets->avg('completion_time_hours')),
                    ];
                })
                ->sortKeys();

            return response()->json([
                'average_completion_hours' => round($avgCompletionHours, 2),
                'average_completion_formatted' => $this->formatCompletionTime($avgCompletionHours),
                'total_completed_tickets' => $completedTickets->count(),
                'completion_by_priority' => $completionByPriority,
                'completion_trends' => $completionTrends,
                'recent_completed_tickets' => $completedTickets->take(5)->toArray(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching completion stats: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch completion stats',
                'average_completion_hours' => 0,
                'average_completion_formatted' => '0 minutes',
                'total_completed_tickets' => 0,
                'completion_by_priority' => [],
                'completion_trends' => [],
                'recent_completed_tickets' => [],
            ], 200); // Return 200 with empty data instead of 500
        }
    }

    private function formatCompletionTime($hours)
    {
        if (!$hours || $hours <= 0) {
            return '0 minutes';
        }

        if ($hours < 1) {
            $minutes = round($hours * 60);
            return $minutes . ' minute' . ($minutes !== 1 ? 's' : '');
        } elseif ($hours < 24) {
            $h = floor($hours);
            $m = round(($hours - $h) * 60);

            if ($m === 0) {
                return $h . ' hour' . ($h !== 1 ? 's' : '');
            }

            return $h . 'h ' . $m . 'm';
        } else {
            $days = floor($hours / 24);
            $remainingHours = round($hours % 24);

            if ($remainingHours === 0) {
                return $days . ' day' . ($days !== 1 ? 's' : '');
            }

            return $days . 'd ' . $remainingHours . 'h';
        }
    }
}
