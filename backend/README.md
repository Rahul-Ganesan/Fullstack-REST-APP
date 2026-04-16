# Customer Analytics Backend (REST SaaS MVP)

Backend-first REST API for customer analytics built with Node.js, TypeScript, Express, Prisma, and MySQL.

## Features

- JWT authentication (`/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/register`)
- Refresh-token sessions via secure HttpOnly cookie (`/api/v1/auth/refresh`, `/api/v1/auth/logout`)
- Role-based access control (`admin`, `analyst`)
- Login rate limiting and strict CORS with credentials
- Customer CRUD with pagination, sorting, and filtering
- Analytics KPI + segmentation endpoints using CTE-based SQL aggregations
- Prisma schema with normalized tables and query-oriented indexes
- Account lifecycle APIs (forgot/reset password, admin invite, activate/deactivate, admin reset issue)

## Prerequisites

- Node.js 20+
- MySQL 8+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. Seed sample data:

```bash
npm run prisma:seed
```

## Run

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

Tests:

```bash
npm run test
```

Performance benchmark (for measurable latency-improvement claim):

```bash
npm run perf:benchmark
```

This writes a report to `outputs/perf/latency-report.json` containing:
- naive vs optimized average latency
- p95/min/max
- computed improvement percentage
- `claimMet` boolean for the 40% target

## API Overview

Base URL: `/api/v1`

- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `GET /auth/me`
- Customers
  - `GET /customers?page=1&limit=20&sortBy=createdAt&sortDir=desc&country=US&lifecycleStage=growth`
  - `GET /customers/:id`
  - `POST /customers`
  - `PATCH /customers/:id`
  - `DELETE /customers/:id`
- Analytics
  - `GET /analytics/kpis?from=2026-01-01T00:00:00.000Z&to=2026-04-01T00:00:00.000Z`
  - `GET /analytics/segments?from=2026-01-01T00:00:00.000Z&to=2026-04-01T00:00:00.000Z&minRevenue=500&page=1&limit=20`
- Users (admin-only)
  - `GET /users`
  - `POST /users/invite` — response includes `temporaryPassword` and `inviteToken` (demo: share out-of-band; production should email)
  - `PATCH /users/:id/status`
  - `POST /users/:id/reset-password`

## Secret Rotation Guidance

Use current secrets for signing, and keep prior secrets during transition:

- Access token:
  - `JWT_SECRET` (current signer)
  - `JWT_SECRET_PREVIOUS` (comma-separated verify-only secrets)
- Refresh token:
  - `JWT_REFRESH_SECRET` (current signer)
  - `JWT_REFRESH_SECRET_PREVIOUS` (comma-separated verify-only secrets)

Rotation process:
1. Generate and deploy new current secret while moving old current into `*_PREVIOUS`.
2. Wait for max token TTL to pass (`JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN`).
3. Remove stale secret from `*_PREVIOUS`.
