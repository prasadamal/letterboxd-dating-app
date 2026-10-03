# Changelog

## [Unreleased] — launch readiness

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
