<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \DB::table('roles')->insert([
            ['name' => 'Admin', 'description' => 'Administrator with full access'],
            ['name' => 'IT Agent', 'description' => 'IT support agent'],
            ['name' => 'Staff', 'description' => 'Regular staff member'],
        ]);
    }
}
