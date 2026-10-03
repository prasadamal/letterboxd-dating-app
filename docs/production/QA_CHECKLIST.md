# Final QA checklist — ReelMates launch

Run in **staging** before merging to production and before EAS store builds.

## Automated (CI)

- [ ] `npm test` (unit + validation)
- [ ] `npm run build` (web)
- [ ] `cd mobile && npm run typecheck`
- [ ] Optional: `INTEGRATION_TEST=1 INTEGRATION_API_URL=http://127.0.0.1:4000 npm test` with API running

## API smoke

- [ ] `GET /api/v1/health` → `ok: true`
- [ ] `GET /api/v1/docs` loads Swagger UI
- [ ] `GET /api/v1/platform/status` returns launch counters
- [ ] Signup → login → refresh token → logout

## Product flows (manual)

- [ ] Registration with gender, country, terms
- [ ] Onboarding photo + bio + country → profile ≥80%
- [ ] Daily 10-film game saves ratings
- [ ] Launch gate (use `LAUNCH_*=2` in staging)
- [ ] Dating deck respects discovery prefs + swipe stats meta
- [ ] Mutual match + intro chat unlock
- [ ] Read receipts + Supabase Realtime “Live chat connected” banner
- [ ] Messages tab inbox
- [ ] Block / report → `/admin` queue resolve
- [ ] Verification request → admin PATCH verification
- [ ] Push token register (physical device)
- [ ] Cron: daily reminders + inactivity cleanup (staging)

## Store readiness

- [ ] `docs/store/SUBMISSION_CHECKLIST.md` completed
- [ ] `node scripts/generate-store-assets.mjs` run; export PNGs for listings
- [ ] EAS production builds succeed (Android + iOS)
- [ ] Privacy policy URL live

Sign-off: _______________  Date: _______________
