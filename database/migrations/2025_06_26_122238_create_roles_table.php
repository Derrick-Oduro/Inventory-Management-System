<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateRolesTable extends Migration
{
    public function up()
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Admin, IT Agent, Staff
            $table->timestamps();
        });

        DB::table('roles')->get();
    }

    public function down()
    {
        Schema::dropIfExists('roles');
    }
}