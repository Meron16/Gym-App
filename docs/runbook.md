# Production Runbook (MVP)

## Services
- API (`apps/api`) on port `3001`
- Mobile app (`apps/mobile`) built via Expo/EAS
- Admin web (`apps/admin-web`) on port `3002`
- Postgres + Redis via `infra/docker-compose.yml`

## Deploy Steps (staging/prod)
1. Build + test in CI (`.github/workflows/ci.yml`).
2. Deploy API container with env from `apps/api/.env.example`.
3. Run Prisma migration: `npx prisma migrate deploy`.
4. Deploy admin-web container with `NEXT_PUBLIC_API_URL`.
5. Smoke test: `GET /health`, `/gyms`, `/bookings/availability`, admin homepage.

## Alerts (minimum)
- API 5xx spike (>2% in 5 min)
- Checkout webhook failures
- Booking conflict anomalies

## Rollback
1. Roll back API/admin image to previous tag.
2. Disable new mobile rollout (EAS/Store staged rollout).
3. If migration caused issue, apply forward-fix migration (avoid destructive rollback).
