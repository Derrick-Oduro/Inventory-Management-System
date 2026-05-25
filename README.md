# Inventory Management System

This project is now scoped as a web-based Inventory Management System for retail/manufacturing operations.

## Core Modules

- Authentication with account lockout protection
- Role-based access: Admin, Inventory Manager, Staff
- Product and stock management
- Supplier management
- Purchase order lifecycle: Draft -> Submitted -> Approved -> Ordered -> Received -> Cancelled
- Stock movement tracking with adjustment approval flow
- In-app and email-capable notification preferences
- Dashboard summaries and downloadable CSV reports

## Main APIs

- /api/dashboard/summary
- /api/inventory/*
- /api/stock-movements/*
- /api/suppliers/*
- /api/purchase-orders/*
- /api/reports/*

## Run

1. Install dependencies:
	composer install
	npm install
2. Configure environment and database.
3. Migrate and seed:
	php artisan migrate --seed
4. Start dev servers:
	composer run dev

## Docker

Run the app and a local PostgreSQL database with Docker:

1. Make sure `.env` has an application key.
2. Start the stack:

	docker compose up --build

The app container waits for PostgreSQL, runs migrations, and seeds the database on startup.

## Render

Deploy with the included `render.yaml` blueprint:

1. Create a new Render Blueprint from this repository.
2. Set the required secrets in Render, especially `APP_KEY` and `APP_URL`.
3. Set the admin seed credentials: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, and `SEED_ADMIN_PASSWORD`.
4. Provision the managed PostgreSQL instance from the blueprint.

The web service uses `Dockerfile`, connects through `DATABASE_URL`, and runs `php artisan migrate --force --seed` during startup.
