<?php

namespace Database\Seeders;

use App\Models\User;
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

        // User::factory(10)->create();

        

        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'derekoduro111@gmail.com',
            'role_id' => 1, // or the correct ID for Admin
            'password' => Hash::make('Derek.555'), // set your desired password here
        ]);
    }
}
