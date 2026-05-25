<?php

namespace Database\Seeders;

use App\Models\User;
use RuntimeException;
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
        $adminEmail = env('SEED_ADMIN_EMAIL', 'derekoduro111@gmail.com');
        $adminName = env('SEED_ADMIN_NAME', 'Admin User');
        $adminPassword = env('SEED_ADMIN_PASSWORD');

        throw_unless(
            is_string($adminPassword) && $adminPassword !== '',
            new RuntimeException('SEED_ADMIN_PASSWORD must be set before seeding the admin user.')
        );

        // User::factory(10)->create();

        User::query()->updateOrCreate([
            'email' => $adminEmail,
        ], [
            'name' => $adminName,
            'role_id' => $adminRoleId,
            'password' => Hash::make($adminPassword),
        ]);
    }
}
