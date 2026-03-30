# Gym App Monorepo

Consumer mobile app + NestJS API + operator admin web for gym discovery, booking, and membership.

## Apps
- `apps/api`: NestJS backend (auth, gyms, bookings, payments, analytics stubs)
- `apps/mobile`: Expo Router mobile app (auth -> onboarding -> tabs -> browse -> booking)
- `apps/admin-web`: Next.js operator/admin scaffold
- `packages/contracts`: shared DTO/contracts package scaffold

## Local setup

### 1) Start infrastructure
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2) API
```bash
cd apps/api
cp .env.example .env
npm install
npx prisma generate
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
