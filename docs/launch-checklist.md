# Launch Checklist (Beta)

## Pre-launch
- [ ] `apps/api` build green
- [ ] `apps/mobile` typecheck green
- [ ] `apps/admin-web` build green
- [ ] `.env` values set for staging
- [ ] Firebase admin credentials configured
- [ ] Stripe keys + webhook configured
- [ ] `BOOKING_REQUIRE_ENTITLEMENT` decided

## UAT flows
- [ ] Intro -> login -> onboarding -> tabs works
- [ ] Browse list/map opens gym detail
- [ ] Booking confirms and returns booking id
- [ ] Unauthorized booking attempt is rejected
- [ ] Payment checkout URL generated
- [ ] Webhook endpoint accepts replay safely
- [ ] Admin page can reach `/health`

## Launch
- [ ] Invite-only beta cohort enabled
- [ ] Monitor Sentry and API logs first 24h
- [ ] Triage conversion blockers daily
