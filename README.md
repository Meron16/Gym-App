 # Gym App Monorepo

Consumer mobile app + NestJS API + operator admin web for gym discovery, booking, and membership.

## Apps
- `apps/api`: NestJS backend (auth, gyms, bookings, payments, analytics stubs)
- `apps/mobile`: Expo Router mobile app (auth -> onboarding -> tabs -> browse -> booking)
- `apps/admin-web`: Next.js operator/admin scaffold
- `packages/contracts`: shared DTO/contracts package scaffold

## Local setup

The API **requires PostgreSQL** (via Prisma). You do **not** have to use Docker.

### 1) PostgreSQL

Set **`DATABASE_URL`** in **`apps/api/.env`** only (the repo root `.env` is **not** read by the API).

**Hosted (e.g. Neon):** paste the connection string into `apps/api/.env`, then from `apps/api` run `npx prisma db push` and optionally `npm run prisma:seed`.

**Optional local Postgres via Docker:** `docker compose -f infra/docker-compose.yml up -d` and use the default URL from `apps/api/.env.example`.

### 2) API
```bash
cd apps/api
cp .env.example .env
# Edit .env: JWT_SECRET, DATABASE_URL if not using compose defaults, optional AUTH_DEV_ALLOW_PLACEHOLDER_TOKEN=true
npm install
npx prisma generate
npx prisma db push
npm run build
npm run start:dev
```

API default: `http://localhost:3001`

### 3) Mobile
```bash
cd apps/mobile
cp .env.example .env
npm install
npm run start
```

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`:
- emulator/web: `http://localhost:3001`
- physical device: `http://<YOUR_LAN_IP>:3001`

### 4) Admin web
```bash
cd apps/admin-web
cp .env.example .env.local
npm install
npm run dev
```

Admin default: `http://localhost:3002`

## CI
GitHub Actions workflow: `.github/workflows/ci.yml`
- API build
- Mobile TypeScript check
- Admin web build

## Deployment docs
- `docs/runbook.md`
- `docs/launch-checklist.md`
