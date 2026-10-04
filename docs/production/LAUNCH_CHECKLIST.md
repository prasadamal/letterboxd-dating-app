# ReelMates launch checklist (Android + iOS)

Status as of 2026-10-03. Items marked ✅ are done in code or on the `moviematch` Supabase project.
Items marked ⬜ need an account, a secret or a decision from the owner, in the order listed.

## 1. Security and privacy

- ✅ Other members' profiles no longer include email, referral code, discovery prefs or account state (`mapPublicUser`).
- ✅ RLS enabled on every `public` table with no policies: client keys get nothing, the API uses the service role.
- ✅ Launch-gate functions have a pinned `search_path` (Supabase security advisor is clean apart from expected INFO notices).
- ✅ Access tokens last 1 hour; refresh tokens rotate and are revoked on logout, password reset, suspension and deletion.
- ✅ Email lookup is an exact lower-case match (no `ILIKE` wildcards).
- ✅ Rate limits work behind a hosting proxy (`trust proxy`); the strict limit applies only to login, signup, reset and verification.
- ✅ Request bodies capped at 200 KB (4 MB for avatar upload); avatars must be real JPEG/PNG/WebP files.
- ✅ `avatars` bucket limited to 3 MB and image MIME types; old avatars are deleted on re-upload.
- ✅ Admin and cron secrets compared in constant time.
- ⬜ Rotate any Supabase keys that were ever committed or shared, then set them only as host secrets.

## 2. Store policy requirements

| Requirement | Status |
|---|---|
| In-app account deletion that deletes the data (Apple 5.1.1(v), Play) | ✅ Profile → Delete account erases profile, photo, ratings, swipes, matches, messages, tokens |
| Report **and** block from every place you see another person (Apple 1.2) | ✅ Dating card, Matches (block), Chat (report + block) |
| Filter objectionable content before posting (Apple 1.2) | ✅ Server filter on chat, bio, name; extend with `CONTENT_BLOCKLIST` |
| Terms with zero tolerance for abuse, accepted at signup (Apple 1.2) | ✅ Linked on the signup screen and in Profile |
| Act on reports within 24 hours | ✅ Admin queue + `PATCH /api/v1/admin/users/:id/suspension`; ⬜ someone must actually watch the queue daily |
| Privacy policy reachable in app and on the store listing | ✅ Profile → Privacy Policy (public GitHub URL) |
| Photo permission text on iOS; no broad media permissions on Android (Play photo policy) | ✅ System photo picker, `NSPhotoLibraryUsageDescription`, media/camera/mic/overlay permissions blocked |
| 18+ only | ✅ Signup rejects under-18; store age rating must be 17+ / Mature |
| Contact / support link | ✅ Profile → Contact support |

## 3. Reliability fixes shipped

- ✅ Opening the app offline no longer signs you out (retry screen instead); server errors during refresh keep the session.
- ✅ Release builds refuse to run against a placeholder or missing API URL instead of calling a LAN address.
- ✅ Blocked, suspended or deleted users can't send or read messages; the chat shows "no longer available".
- ✅ Dating deck shows only complete, active profiles; simultaneous mutual likes no longer error.
- ✅ Push: Android notification channel, device token removed on logout and re-assigned on account switch, dead Expo tokens pruned.
- ✅ Platform polling pauses in the background; read receipts sent only when new messages arrive.
- ✅ Photo picker crops to a square at 50% quality so uploads fit the size cap.
- ✅ Errors on profile save, delete, verification, upload and block are shown instead of silently failing.
- ✅ Root error boundary; API shuts down gracefully on deploy (`SIGTERM`).

## 4. Launch-readiness round 2 (done)

- ✅ Stock `.env.example` now boots the API (empty values were rejected; `EMAIL_FROM` "Name <email>" was rejected).
- ✅ Launch gate lives in the database: running APIs no longer overwrite targets from env. `/admin` can change targets or
  open/close dating; `FORCE_DATING_OPEN=true` opens it for one local API only (refused in production).
- ✅ Launch status cached 15 s and counted in SQL; the app polls every 60 s instead of 15 s.
- ✅ Supabase 1,000-row cap handled everywhere it mattered (deck candidates, ratings, swipes, blocks, matches, inbox,
  reminders, deletion); long `in(...)` filters chunked. Deck scores the 300 most recently active eligible people.
- ✅ Chat loads the latest 200 messages (full history would drop the newest past 1,000).
- ✅ Daily reminder job fixed (it filtered on a non-existent `created_at` column and never sent anything).
- ✅ Docker image ships the web app, so password-reset / verify-email links and `/admin` work in production; runs as non-root.
  Email links default to Render's public URL.
- ✅ Realtime channels carry no message content (signal only); push payloads carry no message text; sends no longer wait
  on push/realtime.
- ✅ `/api/v1/health` reports which features are unconfigured; production logs warn at startup.
- ✅ Demo seed refuses production and no longer uses a public password; `npm run db:prelaunch-cleanup` removes demo/test users.
- ✅ `render.yaml` (one-click deploy), `.github/workflows/scheduled-jobs.yml` (free cron), Supabase publishable key in `eas.json`,
  `expo-dev-client` for the `development` profile, iOS `simulator` profile.

## Owner steps

Follow **[`LAUNCH_GUIDE.md`](../../LAUNCH_GUIDE.md)** at the repo root: every account, key and command, in order.
Outstanding owner items: secret key in `.env`/Render, Render deploy, Resend, GitHub cron secrets, `eas init`, API URL in
`eas.json`, push credentials, Supabase Pro, `db:prelaunch-cleanup` (3 demo accounts are still in the database), store accounts.

## After launch

- Watch the moderation queue daily (`/admin` on the web app with `ADMIN_API_KEY`).
- Set `SENTRY_DSN` for crash and error reporting.
- Before ~10k users: precompute deck candidates in a background job (today each deck request reads the light columns of every eligible candidate).
