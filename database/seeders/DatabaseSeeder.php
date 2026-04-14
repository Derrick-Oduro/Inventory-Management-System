<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
        ]);

        $adminRoleId = DB::table('roles')->where('name', 'Admin')->value('id');

        // User::factory(10)->create();

        User::query()->updateOrCreate([
            'email' => 'derekoduro111@gmail.com',
        ], [
            'name' => 'Admin User',
            'role_id' => $adminRoleId,
            'password' => Hash::make('Derek.555'), // set your desired password here
        ]);
    }
}
