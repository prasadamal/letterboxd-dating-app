# Production implementation checklist (commit-by-commit)

Use branch prefix: `cursor/production-*-e9d8`. Merge to `main` via PR after each phase passes CI.

## Phase 1 — Foundation ✅ (PR #6)

- [x] `server/config/env.js` — Zod env validation
- [x] Remove secrets from `.env.example`
- [x] `server/createApp.js` — helmet, rate limits, request IDs, errors
- [x] `server/middleware/validate.js` — Zod schemas
- [x] RLS migration + audit_logs + auth_tokens
- [x] Password reset + email verify (Resend optional)
- [x] Avatar upload + profile completeness API
- [x] CI + Docker + `npm test`

## Phase 2 — Trust & profile gate ✅

- [x] Migration: `refresh_tokens`, `push_tokens`, `profile_photos`, `moderation_queue`
- [x] `JWT_REFRESH_SECRET` + `/auth/refresh` + `/auth/logout`
- [x] Matchmaking gate: `profile_completion >= 80` + `matchmaking_enabled`
- [x] `GET /messages/conversations` inbox
- [x] `notificationService` + `POST /notifications/register`
- [x] Validate **all** route bodies (movies, platform, dating, safety)
- [x] `/api/v1/health/db` and `/health/storage`
- [x] Mobile onboarding wizard + cinematic theme tokens
- [x] `expo-image-picker` profile photo flow

## Phase 3 — Social & realtime (this pass)

- [x] Discovery filters from `discovery_prefs` in deck API
- [x] Seen-profile / swipe history analytics (`meta` on deck + `user_deck_stats`)
- [ ] Supabase Realtime for chat (polling v2 shipped instead)
- [x] Read receipts on messages
- [x] Push: new match, new message (Expo push sender; daily reminder hook pending)

## Phase 4 — Premium UI (web + mobile)

- [ ] Web: `src/components/*`, `src/pages/*`, design tokens CSS
- [ ] Mobile: reanimated swipe deck, Lottie empty states
- [ ] Taste profile card component (shared loves/hates)
- [ ] Conversation list + messaging center UI

## Phase 5 — Launch ops

- [ ] Staging env + runbook
- [ ] Sentry + analytics (PostHog/Mixpanel)
- [ ] Admin moderation UI for `moderation_queue`
- [ ] Store assets + final QA

---

## File touch list (Phase 2)

| File | Action |
|------|--------|
| `server/services/authService.js` | NEW refresh tokens |
| `server/services/notificationService.js` | NEW push register |
| `server/services/profileService.js` | NEW completion + gate |
| `server/routes/auth.js` | refresh/logout |
| `server/routes/messages.js` | conversations list |
| `server/routes/notifications.js` | NEW |
| `server/datingService.js` | profile gate |
| `server/createApp.js` | health routes, notifications mount |
| `mobile/app/onboarding/*` | NEW wizard |
| `mobile/lib/theme.ts` | cinematic palette |
| `.env.example` | JWT_REFRESH_SECRET, SMTP optional |

## Definition of done (launch)

- No secrets in git; RLS on; service role only in prod
- Email verify + password reset working with provider
- Profile photo + ≥80% completion before dating deck
- Block/report/delete + moderation queue populated on report
- CI green: test, typecheck, build
- EAS builds succeed for iOS + Android
