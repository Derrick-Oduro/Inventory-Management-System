<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketNotification;

class CheckExpiredTickets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for expired tickets and send notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired tickets...');

        // Check for expired tickets
        $expiredTickets = Ticket::where('expires_at', '<', now())
            ->where('is_expired', false)
            ->whereNotIn('status', ['resolved', 'closed'])
            ->get();

        foreach ($expiredTickets as $ticket) {
            $ticket->update(['is_expired' => true]);

            // Notify admins about expired ticket
            $admins = User::whereHas('role', function($query) {
                $query->where('name', 'Admin');
            })->get();

            foreach ($admins as $admin) {
                $admin->notify(new TicketNotification([
                    'title' => 'Ticket Expired',
                    'message' => "Ticket #{$ticket->id} '{$ticket->title}' has expired and needs attention",
                    'ticket_id' => $ticket->id,
                    'action_url' => '/tickets',
                    'icon' => 'ticket'
                ]));
            }

            $this->warn("Ticket #{$ticket->id} marked as expired");
        }

        // Check for tickets expiring soon (within 1 hour)
        $expiringSoon = Ticket::expiringSoon(1)->get();

        foreach ($expiringSoon as $ticket) {
            // Notify assigned agent if exists, otherwise notify admins
            $usersToNotify = [];

            if ($ticket->assigned_to) {
                $usersToNotify[] = $ticket->assignedTo;
            } else {
                $usersToNotify = User::whereHas('role', function($query) {
                    $query->where('name', 'Admin');
                })->get()->toArray();
            }

            foreach ($usersToNotify as $user) {
                $user->notify(new TicketNotification([
                    'title' => 'Ticket Expiring Soon',
                    'message' => "Ticket #{$ticket->id} '{$ticket->title}' expires in less than 1 hour",
                    'ticket_id' => $ticket->id,
                    'action_url' => '/tickets',
                    'icon' => 'ticket'
                ]));
            }

            $this->info("Notified about ticket #{$ticket->id} expiring soon");
        }

        $expiredCount = $expiredTickets->count();
        $expiringSoonCount = $expiringSoon->count();

        $this->info("Found {$expiredCount} expired tickets and {$expiringSoonCount} tickets expiring soon");

        return 0;
    }
}
