<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    private const DEFAULT_TYPES = [
        'low_stock',
        'po_approved',
        'po_received',
        'po_cancelled',
    ];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $existing = $user->notificationPreferences()->get()->keyBy('notification_type');

        $preferences = collect(self::DEFAULT_TYPES)->map(function (string $type) use ($existing) {
            $entry = $existing->get($type);

            return [
                'notification_type' => $type,
                'delivery_channel' => $entry?->delivery_channel ?? 'in_app',
                'enabled' => $entry?->enabled ?? true,
            ];
        })->values();

        return response()->json($preferences);
    }

    public function upsert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notification_type' => 'required|in:low_stock,po_approved,po_received,po_cancelled',
            'delivery_channel' => 'required|in:in_app,email,both',
            'enabled' => 'required|boolean',
        ]);

        $preference = NotificationPreference::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'notification_type' => $validated['notification_type'],
            ],
            [
                'delivery_channel' => $validated['delivery_channel'],
                'enabled' => $validated['enabled'],
            ]
        );

        return response()->json($preference);
    }
}
