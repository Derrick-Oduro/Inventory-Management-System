<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsersController extends Controller
{
    public function index()
    {
        // Optionally restrict to admin:
        // if (!Auth::user() || Auth::user()->role->name !== 'Admin') {
        //     abort(403, 'Unauthorized');
        // }

        $users = User::with('role')->get();

        // Return users to Inertia
        return Inertia::render('users', [
            'users' => $users
        ]);
    }


    public function getAllUsers()
    {
        $users = User::with('role')->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'required'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role
        ]);

        AuditLog::log(
            'USER_CREATE',
            "Created user account: {$user->name} ({$user->email})",
            'User',
            $user->id,
            null,
            $user->toArray()
        );
    }

    public function deleteUser($id)
    {
        // Optional: Check if the current user has admin privileges
        // if (!Auth::user() || Auth::user()->role->name !== 'Admin') {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        try {
            $user = User::findOrFail($id);

            // Prevent self-deletion
            if (Auth::id() === $user->id) {
                return response()->json(['message' => 'You cannot delete your own account'], 400);
            }

            AuditLog::log(
                'USER_DELETE',
                "Deleted user: {$user->name} ({$user->email})",
                'User',
                $user->id,
                $user->toArray(),
                null
            );

            $user->delete();

            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting user: ' . $e->getMessage()], 500);
        }
    }

    public function updateUser(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . $id,
                'role' => 'required|numeric'
            ]);

            $user->name = $request->name;
            $user->email = $request->email;
            $user->role_id = $request->role;

            // Only update password if provided
            if ($request->filled('password')) {
                $request->validate([
                    'password' => ['required', 'confirmed', Password::defaults()],
                ]);
                $user->password = Hash::make($request->password);
            }

            $oldValues = $user->getOriginal();

            $user->save();

            AuditLog::log(
                'USER_UPDATE',
                "Updated user: {$user->name}",
                'User',
                $user->id,
                $oldValues,
                $user->getChanges()
            );

            return response()->json([
                'message' => 'User updated successfully',
                'user' => $user->load('role')
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error updating user: ' . $e->getMessage()], 500);
        }
    }
    /**
     * Get IT agents for ticket assignment
     */
    public function getAgents(Request $request)
    {
        try {
            // Get users with IT Agent role (role_id = 2)
            $query = User::with('role')
                ->whereHas('role', function ($query) {
                    $query->where('name', 'IT Agent');
                })
                ->orWhere('role_id', 2);

            // Filter only active users if requested
            if ($request->query('active_only') === 'true') {
                $query->where('is_active', true);
            }

            $agents = $query->get(['id', 'name', 'email', 'is_active']);

            return response()->json($agents);
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Error in getAgents: ' . $e->getMessage());

            // Return a helpful error response
            return response()->json([
                'message' => 'Failed to retrieve IT Agents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle user status between active and inactive
     */
    public function toggleStatus($id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deactivating yourself
            if (Auth::id() == $user->id) {
                return response()->json(['error' => 'You cannot deactivate your own account'], 400);
            }

            $user->update(['is_active' => !$user->is_active]);

            $status = $user->is_active ? 'activated' : 'deactivated';
            AuditLog::log(
                'USER_STATUS_CHANGE',
                "User {$user->name} has been {$status}",
                'User',
                $user->id,
                ['is_active' => !$user->is_active],
                ['is_active' => $user->is_active]
            );

            return response()->json([
                'message' => "User has been {$status} successfully",
                'user' => $user->load('role')
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update user status'], 500);
        }
    }
}
