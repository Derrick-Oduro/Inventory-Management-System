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
        Schema::table('audit_logs', function (Blueprint $table) {
            // Add entity_type and entity_id first (they're referenced in other column positions)
            if (!Schema::hasColumn('audit_logs', 'entity_type')) {
                $table->string('entity_type')->nullable()->after('description');
            }
            if (!Schema::hasColumn('audit_logs', 'entity_id')) {
                $table->unsignedBigInteger('entity_id')->nullable()->after('entity_type');
            }

            // Then add the other columns
            if (!Schema::hasColumn('audit_logs', 'ip_address')) {
                $table->string('ip_address')->nullable()->after('entity_id');
            }
            if (!Schema::hasColumn('audit_logs', 'user_agent')) {
                $table->text('user_agent')->nullable()->after('ip_address');
            }
            if (!Schema::hasColumn('audit_logs', 'old_values')) {
                $table->json('old_values')->nullable()->after('user_agent');
            }
            if (!Schema::hasColumn('audit_logs', 'new_values')) {
                $table->json('new_values')->nullable()->after('old_values');
            }
        });

        // Add indexes if they don't exist
        Schema::table('audit_logs', function (Blueprint $table) {
            try {
                if (!$this->indexExists('audit_logs', 'audit_logs_user_id_created_at_index')) {
                    $table->index(['user_id', 'created_at']);
                }
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }

            try {
                if (!$this->indexExists('audit_logs', 'audit_logs_entity_type_entity_id_index')) {
                    $table->index(['entity_type', 'entity_id']);
                }
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }

            try {
                if (!$this->indexExists('audit_logs', 'audit_logs_created_at_index')) {
                    $table->index('created_at');
                }
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Remove indexes first
            try {
                $table->dropIndex(['user_id', 'created_at']);
            } catch (\Exception $e) {
                // Index might not exist, ignore
            }

            try {
                $table->dropIndex(['entity_type', 'entity_id']);
            } catch (\Exception $e) {
                // Index might not exist, ignore
            }

            try {
                $table->dropIndex(['created_at']);
            } catch (\Exception $e) {
                // Index might not exist, ignore
            }

            // Remove columns
            $table->dropColumn(['entity_type', 'entity_id', 'ip_address', 'user_agent', 'old_values', 'new_values']);
        });
    }

    /**
     * Check if index exists
     */
    private function indexExists($table, $name)
    {
        try {
            $connection = Schema::getConnection();
            $doctrineSchemaManager = $connection->getDoctrineSchemaManager();
            $doctrineTable = $doctrineSchemaManager->listTableDetails($table);
            return $doctrineTable->hasIndex($name);
        } catch (\Exception $e) {
            return false;
        }
    }
};
