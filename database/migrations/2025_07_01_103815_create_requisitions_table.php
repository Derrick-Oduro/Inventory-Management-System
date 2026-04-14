<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('requisitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('item_id')->constrained('inventory_items');
            $table->integer('quantity');
            $table->enum('status', ['pending', 'approved', 'declined'])->default('pending');
            $table->foreignId('location_id')->constrained('locations');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->text('admin_notes')->nullable();

            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requisitions');
    }
};
