<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if the table exists first
        if (!Schema::hasTable('inventory_transactions')) {
            return;
        }

        // Only proceed if the column exists
        if (Schema::hasColumn('inventory_transactions', 'reason')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->dropColumn('reason');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if the table exists first
        if (!Schema::hasTable('inventory_transactions')) {
            return;
        }

        // Add the reason column back if rolling back and it doesn't exist
        if (!Schema::hasColumn('inventory_transactions', 'reason')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->text('reason')->nullable();
            });
        }
    }
};
