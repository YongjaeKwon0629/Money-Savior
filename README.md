# Money Coach

Personal finance coaching MVP built around a household ledger, monthly cash-flow diagnosis, and savings allocation guidance.

## Overview

This project helps a user:

- track monthly income and expenses
- generate a monthly savings recommendation
- review suggested allocation across parking account, installment savings, and ISA
- save recommendation plans
- manage a monthly ledger and connect it back into diagnosis

The repository is organized as a small monorepo:

- `apps/web`: Next.js frontend
- `apps/api`: NestJS backend
- `docs`: planning and product documents

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Package manager: pnpm workspace

## Current MVP Scope

Implemented flows:

- signup / login / token refresh / logout / current user
- monthly diagnosis input and recommendation result generation
- result view with reasoning, cautions, and next actions
- saved recommendation plans
- monthly ledger CRUD
- ledger monthly summary
- linking ledger month to diagnosis month
- dashboard, login, diagnosis, result, plans, ledger screens

## Project Structure

```text
.
├─ apps/
│  ├─ api/
│  └─ web/
├─ docs/
├─ packages/
├─ package.json
└─ pnpm-workspace.yaml
```

## Prerequisites

- Node.js 24+
- pnpm 11+
- Docker Desktop or a local PostgreSQL instance

If `pnpm` is installed globally on Windows but not recognized in a fresh shell, add this once per terminal session:

```powershell
$env:Path += ";$env:APPDATA\npm"
```

## Getting Started

### 1. Install dependencies

From the repository root:

```powershell
pnpm install
```

### 2. Start PostgreSQL

If you are using Docker, this is the container setup that has already been used for this project:

```powershell
docker run --name money-coach-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=money_coach `
  -p 5432:5432 `
  -d postgres
```

To confirm:

```powershell
docker ps
```

### 3. Configure backend environment

Create `apps/api/.env` with values like:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/money_coach?schema=public"
JWT_ACCESS_SECRET="dev-access-secret"
JWT_REFRESH_SECRET="dev-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
```

Optional frontend env:

Create `apps/web/.env.local` if you want to override the default API URL:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api/v1"
```

### 4. Run Prisma migration

From the repo root:

```powershell
pnpm --filter api exec prisma migrate dev
```

If Prisma client generation is needed:

```powershell
pnpm --filter api prisma:generate
```

### 5. Start the backend

From the repo root:

```powershell
pnpm dev:api
```

Backend default URL:

- `http://localhost:3000`
- API base: `http://localhost:3000/api/v1`

### 6. Start the frontend

Open another terminal and run:

```powershell
pnpm dev:web
```

Frontend default URL:

- `http://localhost:3001` or `http://localhost:3000` depending on port availability in your environment

If port `3000` is already being used by the API, Next.js usually moves to `3001`.

## Useful Commands

### Root

```powershell
pnpm dev:api
pnpm dev:web
```

### Backend

```powershell
pnpm --filter api start:dev
pnpm --filter api test:e2e
pnpm --filter api prisma:migrate
pnpm --filter api prisma:studio
```

### Frontend

```powershell
pnpm --filter web dev
pnpm --filter web build
```

## Testing

Backend e2e:

```powershell
pnpm --filter api test:e2e
```

Type-check examples used during development:

```powershell
pnpm exec tsc -p apps/web/tsconfig.json --noEmit --incremental false
pnpm exec tsc -p apps/api/tsconfig.json --noEmit --incremental false
```

## Main Screens

- `/`: dashboard or landing page depending on auth state
- `/login`: login / signup
- `/diagnosis`: monthly diagnosis input
- `/result/:inputId`: recommendation result
- `/plans`: saved plans
- `/ledger`: monthly ledger

## Data Model Summary

Core database models:

- `User`
- `MonthlyFinanceInput`
- `RecommendationResult`
- `SavedRecommendationPlan`
- `LedgerEntry`

See `apps/api/prisma/schema.prisma` for the full schema.

## Notes

- This project is currently optimized for MVP validation rather than production hardening.
- Recommendation output is rule-based guidance, not financial product brokerage.
- The service recommends savings style and allocation direction, not specific stock picks.

## Next Suggested Work

- align Swagger/OpenAPI docs with current frontend behavior
- add root-level convenience scripts for build and test
- improve README with screenshots after UI stabilizes
- add deployment config for web, API, and PostgreSQL
