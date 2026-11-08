# Release verification gate

This branch improves authentication and operational readiness; it does not certify a production release.

## Changes
- Consume refresh and reset/verification tokens with conditional database updates, preventing multiple successful claims of the same token.
- Surface refresh-token persistence/revocation errors rather than returning false success.
- Check account status for authenticated requests, including /auth/me.
- Return HTTP 503 for unhealthy database readiness checks.
- Stop logging email bodies that may contain reset links.

## Required before release
- Run isolated staging tests for simultaneous refresh/reset claims against real Postgres, including database failures. The new session RPCs commit token claims and replacements together; failed writes roll back. Verify concurrent calls against the staging database as well as the embedded PostgreSQL regression tests.
- Exercise signup, verification, login, reset, match, chat, block/report and deletion with separate test accounts.
- Verify email delivery, HTTPS URLs, service credentials, moderation access and scheduled jobs.
- Validate native iOS/Android session renewal, notifications, uploads and account switching on real devices.
- Load-test discovery and chat; broad candidate retrieval is still a scaling limitation.
- Complete or hide paid purchase flows until purchases and entitlement restoration are verified.
- Test backup restore, migrations and rollback in staging. Configure error monitoring and alerts.

Do not use production accounts for automated destructive tests. No production deployment or database migration was performed by this change.

## November 8 session security update

Apply `supabase/migrations/20261108120000_atomic_auth_sessions.sql` **before** deploying this API. It adds `users.auth_version` and three service-role-only RPCs. Without the migration, login, refresh and password reset fail closed. Existing sessions start at version zero and remain valid until reset. Password resets increment the version, revoke refresh tokens, and consume outstanding reset links in one transaction. Login/rotation lock the same user row so they cannot bypass a simultaneous reset.

Logout now requires a valid access token and limits push/refresh token changes to that account. The mobile client refreshes an expired access token and submits the latest refresh token for revocation. Direct API clients must send a bearer token to logout. Offline logout still clears local state; server-side revocation requires connectivity.

Rollback: keep the additive column/functions in place. Deploy only an API that checks auth_version; rolling back to an older API removes immediate access-token invalidation. Rehearse the deployment and rollback on staging first.

Automated verification on this branch: 69 API/database/HTTP tests pass; three live API integration tests remain skipped. The actual migration executes in embedded PostgreSQL (PGlite), covering replay, version checks, grants and rollback after a simulated write failure. This is not a live multi-connection Postgres concurrency test. Mobile tests, TypeScript, lint, web build and both platform exports must also pass; lint currently has 44 existing warnings.

Still required for launch: staging database migration and concurrent-session tests; verified deployed API/email; Expo project/environment configuration; signed Android/iOS builds; physical-device acceptance; purchase/restore validation or disabled purchases; load, monitoring and backup-restore checks. No live migration, signed build, store submission or production deployment is claimed.
