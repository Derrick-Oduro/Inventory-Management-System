<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    // Get all users with their role name
    public function getAllUsers()
    {
        $users = User::with('role')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role ? $user->role->name : null,
            ];
        });
        return response()->json($users);
    }

    // Add a new user
    public function addUser(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $request->role_id,
                'is_active' => true, // New users are active by default
            ]);

            return response()->json($user->load('role'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create user'], 500);
        }
    }

    // Update an existing user
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role_id' => ['required', 'exists:roles,id'],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        try {
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'role_id' => $request->role_id,
            ];

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            return response()->json($user->load('role'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update user'], 500);
        }
    }

    // Replace delete with deactivate/activate
    public function toggleStatus(User $user)
    {
        try {
            // Prevent deactivating yourself
            if (Auth::id() === $user->id) {
                return response()->json(['error' => 'You cannot deactivate your own account'], 400);
            }

            $user->update(['is_active' => !$user->is_active]);

            $status = $user->is_active ? 'activated' : 'deactivated';

            return response()->json([
                'message' => "User has been {$status} successfully",
                'user' => $user->load('role')
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update user status'], 500);
        }
    }

    public function getRoles()
    {
        try {
            $roles = Role::all();
            return response()->json($roles);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch roles'], 500);
        }
    }

    public function getItAgents(Request $request)
    {
        try {
            $query = User::whereHas('role', function($q) {
                $q->where('name', 'IT Agent');
            });

            // Filter only active users if requested
            if ($request->query('active_only') === 'true') {
                $query->where('is_active', true);
            }

            $agents = $query->with('role')->get();
            return response()->json($agents);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch IT agents'], 500);
        }
    }
}
