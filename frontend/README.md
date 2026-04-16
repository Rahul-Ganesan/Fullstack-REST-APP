# Customer Analytics Frontend

React + TypeScript dashboard for the Customer Analytics REST backend.

## Prerequisites

- Node.js 20+
- Running backend API (`http://localhost:4000`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Start development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check + production build
- `npm run test` - Run Vitest suite

## Routes

- `/login`
- `/dashboard/customers`
- `/dashboard/analytics`
- `/dashboard/users` (admin only)

## Auth and Session Notes

- Access token is stored in local storage.
- Refresh token is stored in secure HttpOnly cookie by backend.
- Frontend sends requests with `credentials: include`.
