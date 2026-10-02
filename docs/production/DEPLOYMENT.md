# Deployment checklist

## Secrets (never commit)

Set on your host:

- `JWT_SECRET` (32+ chars)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` + `EMAIL_FROM` (for reset/verify emails)
- `APP_PUBLIC_URL` (links in emails)

Copy from `.env.example` and fill values locally.

## Supabase

1. Apply migrations under `supabase/migrations/`
2. Confirm RLS is enabled (API-only access)
3. Create `avatars` bucket if not present
4. Rotate keys if anon key was ever exposed in git history

## API

```bash
npm ci
npm run build
npm start
# or
docker build -t reelmates-api .
docker run -p 4000:4000 --env-file .env reelmates-api
```

## Mobile

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://YOUR_API/api eas build -p android --profile production
EXPO_PUBLIC_API_URL=https://YOUR_API/api eas build -p ios --profile production
```

## Smoke test

```bash
curl https://YOUR_API/api/v1/health
curl https://YOUR_API/api/v1/platform/status
```
