# Changelog

## [Unreleased]

### Film people: redesign, film personality, daily results, dating opt-in

- **New positioning:** "Find your film people". A social film app first; dating is an opt-in mode.
- **Here for:** *Films & friends* or *Dating too*, at signup and in Settings (`users.dating_enabled`). Films-only
  members need no gender, never appear in decks and don't count towards the launch gate (SQL function and trigger
  updated). Deck, swipe and likes-you return `DATING_OFF` (403) when dating is off.
- **Film personality:** 14 archetypes plus trait chips, scored as share² / catalog baseline with minimum share and
  lift, revealed after 8 ratings. On You, friend and match cards, compare, starters and the public taste card.
- **Daily drop:** a numbered daily set with crowd votes on every film, a reveal after each swipe, **Daily results**
  (`GET /movies/daily/results`) with agreement, crowd favourite, most divisive and a Wordle-style share text. Streak
  copy in the reminder push.
- **Mobile redesign:** new design system (marquee lime on near-black, Bricolage Grotesque, typographic genre posters,
  haptics), animated welcome, a step-by-step signup, a swipeable film deck (right / left / up), new Today, Explore,
  Match, Chats and You screens, a match overlay, likes-you and unread badges, settings and edit profile. Six tabs became
  five; Messages and Matches merged into Chats; push notifications open the right screen.
- **Web refresh:** same palette and type, a landing page with sign-up (no pre-filled demo login; *Here for* and
  optional identity), and a redesigned public taste card with the personality and posters.
- **Profile:** dating needs a name, photo and country; bio, prompts and a verified email are extras. Signup no longer
  writes a generic bio.
- **Fixes:** two people saying hello at the same time no longer fails (conversation insert race, per-person intro
  flags); referral codes also add a film friend; conversations sort by last activity with unread counts; "my comfort
  rewatch"-style starters read correctly; *Science Fiction* is one genre (*Sci-Fi*).
- **Removed:** gender counters from Home (the gate still balances the pool, per country), the old onboarding screens,
  the drag-to-bucket game, `taste_vector` writes and the filler bio.
- Migration `20261006120000_dating_optin.sql` (applied to moviematch on 6 October 2026).

### Inclusive dating, regional launch, growth, Plus

- **Inclusive dating:** gender *woman / man / non-binary* and a *Show me* choice; matching needs interest both ways.
  Existing members are backfilled to their current behaviour.
- **Regional launch:** countries open on their own at `country_target` men + women (default 150) or by hand in `/admin`;
  people in an early country meet only each other until the global launch. Country progress on Home.
- **Growth:** daily streaks, a shareable public taste card at `/taste/<code>`, conversation starters in new chats,
  and up to three film prompts on the dating card.
- **ReelMates Plus (backend + UI hooks):** *Likes you* (count for all, profiles with Plus), a minimum taste-match filter,
  a RevenueCat webhook and an admin grant. Purchase screen still to build.
- Country names are stored trimmed so regional counts add up.
- Migration `20261005120000_inclusive_regions_plus.sql` (applied to moviematch on 6 October 2026).

## [1.3.0] — standalone film app

- Like / Dislike / **Haven't seen** in the daily game and everywhere else; unseen never affects matching.
- **Explore & chart:** search any film; **People's chart** of best films ranked by members, with collections.
- Catalog 296 → 436 films from the curated list; `movies.tags` collections.
- **All-time favourite film**: on the card and in matching (same +4, liked/disliked +2).
- **Film friends** by code, taste compare, **Watch together** ideas; button from Matches.
- **Taste stats** on Profile. **Send feedback** in the app; feedback inbox in `/admin`.
- Migrations `20261004120000_favorite_film_and_friends.sql`, `20261004130000_collections_feedback_stats.sql`.

## [1.2.0] — unified launch build

One tree with the production stack, the workable-app fixes, the README/RLS sync, and App Store / Play readiness.

- Web dating, matches, and chat can report and block, matching the mobile safety sheet.
- Dating cards show shared likes and dislikes in the taste line.
- Signup links the Terms and Privacy Policy.
- App version 1.2.0 (iOS build 3, Android versionCode 3).

## [Unreleased] — launch readiness, round 2

- Owner guide `LAUNCH_GUIDE.md`, Render Blueprint, scheduled-jobs workflow, prelaunch cleanup script.
- Launch gate controlled from `/admin` (targets, open/close); env no longer overwrites it; `FORCE_DATING_OPEN` for local tests.
- Paging past Supabase's 1,000-row cap; faster deck, inbox and launch status; latest-200 chat history.
- Docker image serves the web app (reset/verify links, `/admin`); `.env.example` boots as-is.
- Realtime and push carry no message content. Daily reminders fixed. Demo data hardened.

## Launch readiness, round 1

### Security & privacy
- Other members' profiles no longer expose email, referral code or account settings.
- 1-hour access tokens; sessions revoked on password reset, suspension and account deletion.
- Exact email lookup, proxy-aware rate limiting, smaller body limits, image type checks on avatar upload.
- Account deletion now erases photos, ratings, swipes, matches, messages and tokens.

### Safety (store review)
- Report and block from the dating card and chat; block confirmation in Matches.
- Server-side content filter for chat and profile text; admin suspension endpoint.
- Terms of Service with zero-tolerance clause linked at signup; updated Privacy Policy.

### Mobile
- No sign-out when offline; release builds require a configured API URL.
- Photo picker without library permission, square crop; Android media/camera/mic permissions removed.
- Push channel on Android, device token cleanup on logout; error boundary; background polling paused.

### Database
- RLS on all tables, pinned function search paths, avatar bucket limits, missing foreign-key indexes.

## [1.1.0] — 2026-10-03

### Mobile
- Persist refresh tokens in SecureStore and rotate access tokens on `401` via `/auth/refresh`.
- Revoke refresh tokens on sign-out (`/auth/logout`).
- Register Expo push tokens after login and on session restore (`expo-notifications`).
- App version `1.1.0` (iOS build 2, Android versionCode 2).

### API
- `GET /api/v1/platform/version` — `apiVersion`, `minMobileVersion`, `recommendedMobileVersion`.
- OpenAPI info bumped to `1.1.0`.

### Notes
- Set `EXPO_PUBLIC_API_URL` and EAS `projectId` in `mobile/app.json` before store builds.

## [1.0.0] — initial production foundation

See `docs/production/IMPLEMENTATION_CHECKLIST.md` for the full v1.0 scope.
