# Release verification gate

This branch improves authentication and operational readiness; it does not certify a production release.

## Changes
- Consume refresh and reset/verification tokens with conditional database updates, preventing multiple successful claims of the same token.
- Surface refresh-token persistence/revocation errors rather than returning false success.
- Check account status for authenticated requests, including /auth/me.
- Return HTTP 503 for unhealthy database readiness checks.
- Stop logging email bodies that may contain reset links.

## Required before release
- Run isolated staging tests for simultaneous refresh/reset claims against real Postgres, including database failures. Rotation consumes the old token before issuing its replacement; a failed replacement requires signing in again.
- Exercise signup, verification, login, reset, match, chat, block/report and deletion with separate test accounts.
- Verify email delivery, HTTPS URLs, service credentials, moderation access and scheduled jobs.
- Validate native iOS/Android session renewal, notifications, uploads and account switching on real devices.
- Load-test discovery and chat; broad candidate retrieval is still a scaling limitation.
- Complete or hide paid purchase flows until purchases and entitlement restoration are verified.
- Test backup restore, migrations and rollback in staging. Configure error monitoring and alerts.

Do not use production accounts for automated destructive tests. No production deployment or database migration was performed by this change.
