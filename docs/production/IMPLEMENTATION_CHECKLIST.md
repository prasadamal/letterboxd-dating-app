# Production implementation checklist (commit-by-commit)

Use branch prefix: `cursor/production-*-e9d8`. Merge to `main` via PR after each phase passes CI.

## Phase 1 — Foundation ✅

- [x] Env validation, security middleware, RLS, auth lifecycle, CI/Docker/tests

## Phase 2 — Trust & profile gate ✅

- [x] Refresh tokens, profile gate, onboarding, inbox, notifications register

## Phase 3 — Social & realtime ✅

- [x] Discovery filters, deck analytics, read receipts, push (match/message/daily cron)
- [x] Supabase Realtime chat (broadcast channels + mobile subscriber)

## Phase 4 — Premium UI ✅

- [x] Web components/pages/tokens, mobile swipe deck, taste cards, messaging center

## Phase 5 — Launch ops ✅

- [x] Staging runbook, observability hooks, admin moderation UI
- [x] OpenAPI + Swagger UI (`/api/v1/docs`)
- [x] Integration test scaffold (`INTEGRATION_TEST=1`)
- [x] Maestro E2E smoke (`mobile/.maestro/`)
- [x] Inactivity cleanup cron (`/internal/inactivity-cleanup`)
- [x] Manual age/location verification (user request + admin PATCH)
- [x] Store asset template + `docs/production/QA_CHECKLIST.md`

## Definition of done (launch)

- [x] No secrets in git; RLS on; service role only in prod
- [x] Email verify + password reset flow (Resend optional)
- [x] Profile photo + ≥80% completion before dating deck
- [x] Block/report/delete + moderation queue
- [x] CI green: test, typecheck, build
- [ ] EAS builds succeed for iOS + Android (run on your Expo account)
