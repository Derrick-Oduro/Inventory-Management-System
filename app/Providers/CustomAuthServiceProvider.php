<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

class CustomAuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->app['auth']->provider('custom_eloquent', function ($app, array $config) {
            return new CustomEloquentUserProvider($app['hash'], $config['model']);
        });
    }
}

class CustomEloquentUserProvider extends EloquentUserProvider
{
    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        // First check if the user is active
        if (method_exists($user, 'isActive') && !$user->isActive()) {
            return false;
        }

        // Then validate the credentials normally
        return parent::validateCredentials($user, $credentials);
    }

    public function retrieveByCredentials(array $credentials)
    {
        $user = parent::retrieveByCredentials($credentials);

        // Return null if user is inactive
        if ($user && method_exists($user, 'isActive') && !$user->isActive()) {
            return null;
        }

        return $user;
    }
}
