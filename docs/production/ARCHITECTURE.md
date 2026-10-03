# Production architecture — ReelMates

## Layers

1. **Mobile (Expo)** — primary client (`mobile/`)
2. **API (Express)** — `server/createApp.js`, versioned at `/api/v1/*` (legacy `/api/*` mirrored)
3. **Database (Supabase Postgres)** — service-role access from API only
4. **Storage (Supabase)** — `avatars` bucket for profile photos

## Security model

- **No secrets in git** — use `.env` / host secrets (see `.env.example`)
- **Startup validation** — `server/config/env.js` (Zod)
- **RLS enabled** on app tables; **anon/authenticated revoked** on direct table access
- **API uses `SUPABASE_SERVICE_ROLE_KEY`** in production only
- **Rate limits** — global + auth-specific (`helmet`, `express-rate-limit`)
- **Request IDs** — `X-Request-Id` + structured JSON logs
- **Audit logs** — `audit_logs` table for auth/safety/profile events

## Services

| Module | Responsibility |
|--------|----------------|
| `platformService.js` | Launch counters / dating gate |
| `datingService.js` | Swipes, deck, matches, referrals |
| `safetyService.js` | Block, report, delete account |
| `authLifecycleService.js` | Password reset + email verification tokens |
| `storageService.js` | Avatar uploads |
| `auditService.js` | Audit + email helper (Resend) |

## Deployment

- **Docker:** `docker build -t reelmates-api .`
- **Health:** `GET /api/v1/health` (includes DB probe)
- **OpenAPI stub:** `GET /api/v1/openapi.json`

## Staging vs production

| Variable | Staging | Production |
|----------|---------|------------|
| `JWT_SECRET` | 32+ random | 32+ random (unique) |
| `SUPABASE_SERVICE_ROLE_KEY` | required | required |
| `LAUNCH_*_TARGET` | `2` for testing | `500` |
| `RESEND_API_KEY` | optional (logs emails) | required for auth emails |
| `APP_PUBLIC_URL` | staging URL | production URL |

See `DEPLOYMENT.md` for checklists.
