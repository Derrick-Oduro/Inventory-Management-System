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
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable(); // Add this line
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true); // Add this line
            $table->unsignedBigInteger('created_by')->nullable(); // Add this line
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null'); // Add this line
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
