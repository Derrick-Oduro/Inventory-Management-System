<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // Remove out-of-scope modules from the previous IT support build.
        foreach (['ticket_updates', 'tickets', 'requisitions', 'stock_transactions', 'inventory_transactions', 'alerts'] as $legacyTable) {
            Schema::dropIfExists($legacyTable);
        }

        if (!Schema::hasTable('item_categories')) {
            Schema::create('item_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('units_of_measure')) {
            Schema::create('units_of_measure', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('abbreviation');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('locations')) {
            Schema::create('locations', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->text('address')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventory_items')) {
            Schema::create('inventory_items', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('sku')->unique();
                $table->text('description')->nullable();
                $table->unsignedBigInteger('category_id')->nullable();
                $table->unsignedBigInteger('uom_id')->nullable();
                $table->decimal('quantity', 12, 2)->default(0);
                $table->decimal('reorder_level', 12, 2)->default(0);
                $table->decimal('reorder_quantity', 12, 2)->default(0);
                $table->decimal('cost_price', 12, 2)->default(0);
                $table->decimal('selling_price', 12, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('location_id')->nullable();
                $table->string('image_path')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('inventory_items', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_items', 'reorder_quantity')) {
                    $table->decimal('reorder_quantity', 12, 2)->default(0);
                }

                if (!Schema::hasColumn('inventory_items', 'cost_price')) {
                    $table->decimal('cost_price', 12, 2)->default(0);
                }

                if (!Schema::hasColumn('inventory_items', 'selling_price')) {
                    $table->decimal('selling_price', 12, 2)->default(0);
                }
            });

            if (Schema::hasColumn('inventory_items', 'unit_price')) {
                DB::table('inventory_items')
                    ->where(function ($query) {
                        $query->where('cost_price', 0)->orWhereNull('cost_price');
                    })
                    ->update(['cost_price' => DB::raw('COALESCE(unit_price, 0)')]);

                DB::table('inventory_items')
                    ->where(function ($query) {
                        $query->where('selling_price', 0)->orWhereNull('selling_price');
                    })
                    ->update(['selling_price' => DB::raw('COALESCE(unit_price, 0)')]);
            }
        }

        if (!Schema::hasTable('suppliers')) {
            Schema::create('suppliers', function (Blueprint $table) {
                $table->id();
                $table->string('company_name');
                $table->string('contact_person')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                $table->string('payment_terms')->nullable();
                $table->unsignedInteger('expected_delivery_days')->default(0);
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->index('company_name');
            });
        }

        if (!Schema::hasTable('inventory_item_supplier')) {
            Schema::create('inventory_item_supplier', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
                $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
                $table->boolean('is_preferred')->default(false);
                $table->string('supplier_sku')->nullable();
                $table->decimal('last_purchase_price', 12, 2)->nullable();
                $table->timestamps();

                $table->unique(['item_id', 'supplier_id']);
            });
        }

        if (!Schema::hasTable('item_stocks')) {
            Schema::create('item_stocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
                $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
                $table->decimal('quantity', 12, 2)->default(0);
                $table->timestamps();

                $table->unique(['item_id', 'location_id']);
            });
        }

        // Backfill location stock rows from existing single-quantity inventory data.
        if (Schema::hasColumn('inventory_items', 'quantity') && Schema::hasColumn('inventory_items', 'location_id')) {
            $defaultLocationId = DB::table('locations')->value('id');

            if (!$defaultLocationId) {
                $defaultLocationId = DB::table('locations')->insertGetId([
                    'name' => 'Main Warehouse',
                    'description' => 'Default location created by IMS migration',
                    'address' => null,
                    'is_active' => true,
                    'created_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('inventory_items')
                ->select('id', 'quantity', 'location_id')
                ->orderBy('id')
                ->chunk(200, function ($items) use ($defaultLocationId) {
                    foreach ($items as $item) {
                        if ((float) $item->quantity <= 0) {
                            continue;
                        }

                        $locationId = $item->location_id ?: $defaultLocationId;

                        DB::table('item_stocks')->updateOrInsert(
                            [
                                'item_id' => $item->id,
                                'location_id' => $locationId,
                            ],
                            [
                                'quantity' => $item->quantity,
                                'updated_at' => now(),
                                'created_at' => now(),
                            ]
                        );
                    }
                });
        }

        if (!Schema::hasTable('purchase_orders')) {
            Schema::create('purchase_orders', function (Blueprint $table) {
                $table->id();
                $table->string('po_number')->unique();
                $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
                $table->enum('status', ['draft', 'submitted', 'approved', 'ordered', 'received', 'cancelled'])->default('draft');
                $table->date('expected_delivery_date')->nullable();
                $table->text('notes')->nullable();
                $table->text('cancel_reason')->nullable();
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
                $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->timestamp('ordered_at')->nullable();
                $table->timestamp('received_at')->nullable();
                $table->timestamps();

                $table->index('status');
                $table->index('expected_delivery_date');
            });
        }

        if (!Schema::hasTable('purchase_order_items')) {
            Schema::create('purchase_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
                $table->foreignId('item_id')->constrained('inventory_items')->restrictOnDelete();
                $table->decimal('ordered_quantity', 12, 2);
                $table->decimal('received_quantity', 12, 2)->default(0);
                $table->decimal('unit_price', 12, 2);
                $table->decimal('line_total', 12, 2);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('stock_movements')) {
            Schema::create('stock_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('inventory_items')->restrictOnDelete();
                $table->enum('movement_type', ['stock_in', 'stock_out', 'transfer', 'adjustment', 'return']);
                $table->decimal('quantity', 12, 2);
                $table->foreignId('from_location_id')->nullable()->constrained('locations')->nullOnDelete();
                $table->foreignId('to_location_id')->nullable()->constrained('locations')->nullOnDelete();
                $table->enum('status', ['pending_approval', 'approved', 'rejected', 'completed'])->default('completed');
                $table->text('notes')->nullable();
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->foreignId('performed_by')->constrained('users')->restrictOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();

                $table->index(['item_id', 'created_at']);
                $table->index('movement_type');
                $table->index('status');
            });
        }

        if (!Schema::hasTable('inventory_alerts')) {
            Schema::create('inventory_alerts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
                $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
                $table->decimal('current_quantity', 12, 2);
                $table->decimal('reorder_level', 12, 2);
                $table->enum('status', ['open', 'acknowledged', 'resolved'])->default('open');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();

                $table->index(['item_id', 'status']);
            });
        }

        if (!Schema::hasTable('notification_preferences')) {
            Schema::create('notification_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('notification_type');
                $table->enum('delivery_channel', ['in_app', 'email', 'both'])->default('in_app');
                $table->boolean('enabled')->default(true);
                $table->timestamps();

                $table->unique(['user_id', 'notification_type']);
            });
        }

        // Align roles to IMS requirements.
        if (Schema::hasTable('roles')) {
            DB::table('roles')
                ->where('name', 'IT Agent')
                ->update([
                    'name' => 'Inventory Manager',
                    'description' => 'Manages products, stock, suppliers, and purchase orders',
                    'updated_at' => now(),
                ]);

            $requiredRoles = [
                'Admin' => 'System administrator with full access',
                'Inventory Manager' => 'Manages products, stock, suppliers, and purchase orders',
                'Staff' => 'Can view stock and record stock movements',
            ];

            foreach ($requiredRoles as $name => $description) {
                DB::table('roles')->updateOrInsert(
                    ['name' => $name],
                    ['description' => $description, 'updated_at' => now(), 'created_at' => now()]
                );
            }

            $adminRoleId = DB::table('roles')->where('name', 'Admin')->value('id');
            if ($adminRoleId && Schema::hasTable('users') && Schema::hasColumn('users', 'role_id')) {
                DB::table('users')->whereNull('role_id')->update(['role_id' => $adminRoleId]);
            }
        }

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('inventory_alerts');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('item_stocks');
        Schema::dropIfExists('inventory_item_supplier');
        Schema::dropIfExists('suppliers');

        if (Schema::hasTable('inventory_items')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                if (Schema::hasColumn('inventory_items', 'reorder_quantity')) {
                    $table->dropColumn('reorder_quantity');
                }
                if (Schema::hasColumn('inventory_items', 'cost_price')) {
                    $table->dropColumn('cost_price');
                }
                if (Schema::hasColumn('inventory_items', 'selling_price')) {
                    $table->dropColumn('selling_price');
                }
            });
        }

        Schema::enableForeignKeyConstraints();
    }
};
