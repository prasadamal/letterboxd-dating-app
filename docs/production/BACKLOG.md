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
- [x] Apply migrations `20261005120000_inclusive_regions_plus.sql` and `20261006120000_dating_optin.sql` to moviematch
  (done 6 October 2026)
- [ ] Postgres Realtime RLS policies for direct client reads (broadcast used today)
- [ ] Detox suite in CI with emulator farm

## Product decisions waiting on the owner

- [ ] Letterboxd import (CSV upload) — on hold
- [ ] Real poster artwork via TMDB — on hold; typographic posters are used meanwhile
- [ ] Web dashboard (`src/pages/DashboardPage.jsx`) duplicates the app's dating flow: replace it with public pages
  (landing, taste cards, the daily chart) and keep `/admin`?

## Ideas (not started)

- **Share images:** render the taste card and daily results as Story-sized images (server-side), and Open Graph tags
  for `/taste/<code>` so links unfurl with the personality.
- **Personality pages:** "Hopeless Romantics love…" lists per archetype; find friends with the same personality.
- **Friend leaderboard for the daily drop:** who agreed most with you this week.

- **Weekly taste recap** push/card: films rated, new taste twins, your rarest agreement of the week.
- **Taste twin of the day:** one person (friend or not) with the highest match, shown on Home.
- **Hot-take duels:** who matched you on today's most divisive film (the film and the % already show in Daily results).
- **Blind taste mode:** photos blurred until you've exchanged hellos; taste and prompts first.
- **Date-night planner:** after matching, pick a film from *Watch together* and suggest nearby cinema showtimes.
- **Film clubs:** small groups by city or taste cluster with a monthly pick and a group chat.
- **Streak rewards:** a free Plus day at 7 / 30 days; streak freeze for a missed day.
- **Shareable match card:** "We're 86% film-compatible" image for Stories after a match (opt-in, both people).
- **Weekly film club pick** for friends: one film, everyone rates it, compare on Sunday.
