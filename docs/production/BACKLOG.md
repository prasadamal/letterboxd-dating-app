# Production backlog (prioritized)

## Completed

- [x] Env validation, RLS, rate limits, validation, CI, Docker
- [x] Auth lifecycle, refresh tokens, profile gate, onboarding
- [x] Discovery prefs, deck analytics, read receipts, push + crons
- [x] Supabase Realtime chat broadcast
- [x] Premium web + mobile UI, messaging center
- [x] Admin moderation, staging runbook, Swagger/OpenAPI
- [x] Integration + Maestro E2E scaffolds
- [x] Inactivity cleanup job
- [x] Manual verification workflow

## Optional follow-ups (vendor / scale)

- [ ] Third-party ID verification (Persona/Onfido)
- [ ] Plus purchase screen (RevenueCat `react-native-purchases`, products in App Store Connect / Play Console); backend is ready
- [ ] Apply migration `20261005120000_inclusive_regions_plus.sql` to moviematch before deploying this API
- [ ] Postgres Realtime RLS policies for direct client reads (broadcast used today)
- [ ] Detox suite in CI with emulator farm

## Ideas (not started)

- **Weekly taste recap** push/card: films rated, new taste twins, your rarest agreement of the week.
- **Taste twin of the day:** one person (friend or not) with the highest match, shown on Home.
- **Hot-take duels:** a daily divisive film; see what % agreed with you and who matched you on it.
- **Blind taste mode:** photos blurred until you've exchanged hellos; taste and prompts first.
- **Date-night planner:** after matching, pick a film from *Watch together* and suggest nearby cinema showtimes.
- **Film clubs:** small groups by city or taste cluster with a monthly pick and a group chat.
- **Streak rewards:** a free Plus day at 7 / 30 days; streak freeze for a missed day.
- **Shareable match card:** "We're 86% film-compatible" image for Stories after a match (opt-in, both people).
