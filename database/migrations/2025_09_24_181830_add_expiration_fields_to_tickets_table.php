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
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('updated_at');
            $table->boolean('is_expired')->default(false)->after('expires_at');
            $table->timestamp('last_activity_at')->nullable()->after('is_expired');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['expires_at', 'is_expired', 'last_activity_at']);
        });
    }
};
