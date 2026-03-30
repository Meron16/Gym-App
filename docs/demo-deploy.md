# Demo Deployment (Company Preview)

## 1) Admin website on Vercel

From `apps/admin-web`:

1. Set env var in Vercel project settings:
   - `NEXT_PUBLIC_API_URL` = your deployed API URL
2. Deploy:
   - Option A: connect GitHub repo to Vercel and set root directory to `apps/admin-web`
   - Option B CLI:
     ```bash
     cd apps/admin-web
     npx vercel
     npx vercel --prod
     ```

## 2) API deployment (required before mobile demo)

Deploy `apps/api` to your backend host (Render/Railway/Fly/EC2/etc) with:
- `DATABASE_URL`
- `JWT_SECRET`
- `AUTH_DEV_ALLOW_PLACEHOLDER_TOKEN` (true for demo, false for prod)
- Stripe/Firebase keys when ready

Verify:
- `GET /health`
- `GET /gyms`

## 3) Android APK build (demo install)

From `apps/mobile`:

```bash
npm install
npx eas login
npx eas build:configure
npm run apk
```

Download APK from the EAS build URL and share with company testers.

## 4) Important mobile env for real devices

In `apps/mobile/.env` (or EAS env):
- `EXPO_PUBLIC_API_URL=https://your-api-domain.com`
- `EXPO_PUBLIC_DEV_FIREBASE_ID_TOKEN=admin` (for admin demo) or `dev` (user demo)

## 5) Fast demo checklist

- [ ] API publicly reachable
- [ ] Admin web loads on Vercel
- [ ] APK installs on Android
- [ ] Login works
- [ ] Browse -> Gym detail -> Booking works
- [ ] Admin dashboard shows overview/bookings
