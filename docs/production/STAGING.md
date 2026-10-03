# Staging environment runbook

Use a dedicated Supabase project (or branch) and a staging API host before promoting to production.

## 1. Environment variables

Copy `.env.example` to `.env.staging` on the host:

| Variable | Staging value |
|----------|----------------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Unique 32+ char secrets (not dev placeholders) |
| `SUPABASE_URL` | Staging project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role |
| `LAUNCH_MALE_TARGET` / `LAUNCH_FEMALE_TARGET` | `2` for QA dating flow |
| `CLIENT_URL` | Staging web origin |
| `APP_PUBLIC_URL` | Staging public URL (email links) |
| `ADMIN_API_KEY` | Random key for `/api/v1/admin/*` |
| `CRON_SECRET` | Random key for `/api/v1/internal/daily-reminders` |
| `POSTHOG_API_KEY` | Optional analytics |
| `SENTRY_DSN` | Optional error tracking |

Mobile EAS profile:

```bash
EXPO_PUBLIC_API_URL=https://staging-api.example.com/api eas build -p android --profile preview
```

## 2. Database

```bash
# Apply all files in supabase/migrations/ to staging (Supabase CLI or MCP)
npm run db:seed
npm run db:seed:demo
```

Verify:

```bash
curl https://STAGING/api/v1/health
curl https://STAGING/api/v1/platform/status
```

## 3. Cron jobs

Schedule a daily POST (GitHub Actions, Cloud Scheduler, etc.):

```bash
curl -X POST https://STAGING/api/v1/internal/daily-reminders \
  -H "x-cron-secret: $CRON_SECRET"

curl -X POST https://STAGING/api/v1/internal/inactivity-cleanup \
  -H "x-cron-secret: $CRON_SECRET"
```

## API docs

- Swagger UI: `https://STAGING/api/v1/docs`
- OpenAPI JSON: `https://STAGING/api/v1/openapi.json`

Sends Expo push reminders to users who have not rated any film today.

## 4. Smoke script (manual QA)

1. Sign up male + female test accounts with `LAUNCH_*=2`.
2. Complete onboarding (photo, bio, country) until profile ≥80%.
3. Play daily taste game (10 films).
4. Confirm dating tabs unlock; swipe until mutual match.
5. Send intro messages; verify read receipts and inbox tab.
6. Report a user; open web `/admin` with `ADMIN_API_KEY` and resolve queue item.

## 5. Observability

- Server logs: JSON via `server/lib/logger.js` (request IDs on every response).
- Optional PostHog: set `POSTHOG_API_KEY`; events logged via `server/lib/observability.js`.
- Optional Sentry: set `SENTRY_DSN`; 500 errors call `captureException` (wire SDK in host when ready).

## 6. Rollback

- Redeploy previous Docker image / Node release.
- Do **not** revert applied migrations without a down migration plan.
- Rotate `JWT_SECRET` only with forced re-login.

See also `DEPLOYMENT.md` and `docs/store/SUBMISSION_CHECKLIST.md`.
