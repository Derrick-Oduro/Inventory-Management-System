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
