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

- [ ] Signup with *Films & friends* (no gender asked) and with *Dating too* (identity + Show me), country, terms
- [ ] Photo step at the end of signup; profile ≥ 80% with name, photo and country
- [ ] Today: swipe right / left / up saves ratings; crowd reveal after each swipe; Daily results + share text
- [ ] Film personality appears after 8 ratings (You, friend cards, taste card)
- [ ] City launch (set the city target to 1 in staging): a city opens, others stay closed; films-only members don't count
- [ ] Settings: city and "Show people from" (my city / every open city); both people must widen
- [ ] Share images: daily results and film personality open the share sheet with a picture
- [ ] Website: `/cities`, `/privacy`, `/terms`, `/support`, `/delete-account` (deletes, then sign-in fails)
- [ ] Taste-card link pasted into WhatsApp shows the preview image
- [ ] Match deck respects Show me, age range and min match (Plus); undo works
- [ ] Mutual match → match overlay → intro chat unlock; conversation starters
- [ ] Read receipts + Supabase Realtime “Live chat connected” banner
- [ ] Chats: likes-you card, new matches row, unread badges
- [ ] Settings: switch *Here for* → Match tab hides / shows
- [ ] Taste card link opens on the web (`/taste/<code>`)
- [ ] Block / report → `/admin` queue resolve
- [ ] Push token register (physical device); tapping a push opens the right screen
- [ ] Cron: daily reminders (streak copy) + inactivity cleanup (staging)

## Store readiness

- [ ] `docs/store/SUBMISSION_CHECKLIST.md` completed
- [ ] `node scripts/generate-store-assets.mjs` run; export PNGs for listings
- [ ] EAS production builds succeed (Android + iOS)
- [ ] Privacy policy URL live

Sign-off: _______________  Date: _______________
