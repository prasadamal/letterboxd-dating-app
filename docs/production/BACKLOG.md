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
- [x] Real poster artwork via TMDB — not planned (commercial licence $149/month); typographic posters stay
- [x] Web dashboard replaced by public pages (landing, taste cards, cities, legal) and a short account page

## Ideas (not started)

- [x] **Share images and link previews** (October 2026)
- **Match card share:** "We're 86% film-compatible" Story image after a match (opt-in, both people).
- **Grow the catalog to 1,500–3,000** with the same hand-checked approach; keep Indian films around two thirds.
- **Plus paywall** (RevenueCat, server ready) once a few hundred people play every week.
- **Monthly "ReelMates Night" screenings** with film societies in launch cities (IFFK, December).
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
