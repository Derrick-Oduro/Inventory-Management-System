#!/usr/bin/env sh

set -e

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache

if [ "${RUN_DATABASE_MIGRATIONS:-true}" = "true" ]; then
    attempts="${MIGRATION_RETRY_ATTEMPTS:-30}"
    attempt=1

    until php artisan migrate --force --seed --no-interaction; do
        if [ "$attempt" -ge "$attempts" ]; then
            echo "Database migrations failed after ${attempts} attempts." >&2
            exit 1
        fi

        echo "Waiting for database (${attempt}/${attempts})..." >&2
        attempt=$((attempt + 1))
        sleep 3
    done
fi

exec "$@"
