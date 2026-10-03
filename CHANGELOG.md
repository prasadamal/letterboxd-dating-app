# Changelog

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
