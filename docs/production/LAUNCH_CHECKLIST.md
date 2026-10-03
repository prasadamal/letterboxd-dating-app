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

## 4. Owner steps to ship (in order)

1. ⬜ **Deploy the API** over HTTPS (Render, Fly.io, Railway…) with the `Dockerfile`. Required env:
   `NODE_ENV=production`, `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ random chars each), `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_URL`, `APP_PUBLIC_URL`, `ADMIN_API_KEY`, `CRON_SECRET`.
   Check `GET https://YOUR_HOST/api/v1/health` returns `"db":"up"`.
2. ⬜ **Email:** create a Resend account, verify your domain, set `RESEND_API_KEY` and `EMAIL_FROM`.
   Without it password reset and email verification can't work in production.
3. ⬜ **Cron:** schedule `POST /api/v1/internal/daily-reminders` (daily) and `/internal/inactivity-cleanup` (weekly) with the `x-cron-secret` header.
4. ⬜ **Expo project:** `cd mobile && npx eas-cli login && npx eas init`. This writes `owner` and `extra.eas.projectId`
   into `app.json`; push notifications stay off until it exists.
5. ⬜ **API URL in builds:** replace `https://YOUR_PRODUCTION_API_HOST/api` in `mobile/eas.json` (`preview` and `production`).
   Also set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` there for live chat (optional; polling works without).
6. ⬜ **Push credentials:** `npx eas credentials` → upload an FCM V1 service-account key (Android) and let EAS create the APNs key (iOS).
7. ⬜ **Support email:** make sure `support@reelmates.app` receives mail, or change it in `mobile/app.json` and `docs/legal/*`.
8. ⬜ **Build:** `npx eas build -p android --profile preview` → test on a real phone; then `--profile production` for both platforms.
9. ⬜ **Run the QA list** in `docs/production/QA_CHECKLIST.md` on both platforms.
10. ⬜ **Store listings:** copy from `docs/store/`, Play data-safety answers from `docs/store/google-play/data-safety.md`,
    App Privacy answers matching `docs/legal/PRIVACY_POLICY.md`, age rating 17+/Mature, category Dating.
11. ⬜ **Review access:** dating is gated at 500/500 sign-ups, so reviewers would only see the daily game. Create a reviewer account
    and either lower `LAUNCH_MALE_TARGET`/`LAUNCH_FEMALE_TARGET` on a review backend or launch with the gate open; put the login
    and a note about the launch gate in App Review notes and Play's "App access" section.
12. ⬜ **Submit:** fill the placeholders in `eas.json` → `submit.production` (Apple ID, ASC app ID, team ID; Play service-account JSON), then `npx eas submit`.
13. ⬜ **Legal review:** the Terms and Privacy Policy are a reasonable baseline, not legal advice; have them checked for your countries (GDPR if you launch in the EU/UK).

## 5. After launch

- Watch the moderation queue daily (`/admin` on the web app with `ADMIN_API_KEY`).
- Set `SENTRY_DSN` for crash and error reporting.
- Before ~10k users: move deck generation off the request path (it scans all candidates of one gender per request).
