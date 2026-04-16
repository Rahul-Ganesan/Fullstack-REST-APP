# Fullstack REST App — Customer Analytics

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" /></a>
  <a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" /></a>
</p>
<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
</p>

Monorepo: **Express + Prisma + MySQL** API and **React + Vite** SPA for customer analytics, auth, and KPI/segmentation endpoints.

## Reproducibility matrix

| Component | Version (tested expectation) |
|-----------|------------------------------|
| Node.js | **>= 20** |
| npm | **>= 10** |
| MySQL | **>= 8** |

Pin your local toolchain to satisfy the table above before installing dependencies. The backend documents the same constraints in `backend/Requirements.txt`.

## Repository layout

```text
REST-app/
  backend/          # REST API (TypeScript, Express, Prisma)
  frontend/         # SPA (React, Vite)
```

## Prerequisites

1. **Node.js 20+** and **npm 10+**  
   Verify:

   ```bash
   node -v
   npm -v
   ```

2. **MySQL 8+** running locally (or reachable network host) with permission to create a database.

3. **Git** (for clone/checkout).

## One-time: database

Create an empty database matching your `DATABASE_URL` (default name from `.env.example`: `customer_analytics`).

Example (MySQL client):

```sql
CREATE DATABASE customer_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ensure the user in `DATABASE_URL` has `CREATE`, `ALTER`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` on that schema (Prisma migrations need DDL).

## Backend setup (`backend/`)

All commands below are run from `backend/`.

### 1) Environment

Copy the example file and edit secrets:

```bash
cd backend
cp .env.example .env
```

Required / validated behavior (see `src/config/env.ts`):

- `DATABASE_URL` — non-empty MySQL URL.
- `JWT_SECRET` — **at least 16 characters**.
- `JWT_REFRESH_SECRET` — **at least 16 characters** (or omit and the app may derive from `JWT_SECRET` in development only; set explicitly in production).

Example shape (adjust user, password, host, port, database):

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/customer_analytics"
JWT_SECRET="replace-with-strong-access-secret-min-16-chars"
JWT_REFRESH_SECRET="replace-with-strong-refresh-secret-min-16-chars"
CORS_ORIGIN="http://localhost:5173"
```

Keep `.env` out of version control; use `.env.example` as the contract.

### 2) Install dependencies

```bash
npm install
```

### 3) Prisma: generate, migrate, seed

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

**Reproducibility note:** After pulling new commits, run `npm install` and `npm run prisma:migrate` again so your schema matches `prisma/migrations`.

### 4) Run API (development)

```bash
npm run dev
```

Default: listens on **`http://localhost:4000`** (override with `PORT` in `.env`).

### 5) Production-style run

```bash
npm run build
npm run start
```

### 6) Backend tests

```bash
npm run test
```

### 7) Optional: performance benchmark

```bash
npm run perf:benchmark
```

Writes a report under `backend/outputs/perf/` (see `backend/README.md`).

## Frontend setup (`frontend/`)

All commands below are run from `frontend/`.

### 1) Environment

```bash
cd frontend
cp .env.example .env
```

Default API base:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Change this if the API runs on another host/port. Must match backend `CORS_ORIGIN` (browser origin) and the actual API URL.

### 2) Install and run

```bash
npm install
npm run dev
```

Vite dev server defaults to **`http://localhost:5173`**, which aligns with `CORS_ORIGIN` in `backend/.env.example`.

### 3) Frontend tests

```bash
npm run test
```

### 4) Production build

```bash
npm run build
npm run preview   # optional local preview of production bundle
```

## End-to-end smoke check

1. Backend: `cd backend && npm run dev` — confirm log shows API on port **4000**.
2. Frontend: `cd frontend && npm run dev` — open **http://localhost:5173**.
3. Register or log in via the UI (auth routes under `/api/v1/auth/*`).

If login fails with CORS errors, align `CORS_ORIGIN` with the exact origin Vite prints (scheme + host + port).

## API reference

Base path: **`/api/v1`**.

Detailed route list and behaviors: **`backend/README.md`**.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Invalid environment configuration` on backend start | Missing/short `JWT_SECRET` or `JWT_REFRESH_SECRET`, or missing `DATABASE_URL`. |
| Prisma migration errors | Wrong `DATABASE_URL`, DB user lacks DDL rights, or MySQL not running. |
| CORS / cookie auth issues | `CORS_ORIGIN` does not match the SPA origin; `COOKIE_SECURE` vs HTTPS mismatch in production. |
| Frontend cannot reach API | Wrong `VITE_API_BASE_URL`; API not running; rebuild frontend after changing `.env` (Vite embeds env at build time for production). |

## Security

- Do not commit `backend/.env` or `frontend/.env`.
- Use strong, independent values for JWT secrets in any shared or production environment.

## License

See repository files for license terms (if applicable).
