<?php
// filepath: /home/derrick/Development/it-support-system/database/migrations/2025_07_02_create_inventory_items_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('item_categories')->nullOnDelete();
            $table->foreignId('uom_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
            $table->decimal('quantity', 10, 2)->default(0);
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('image_path')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
