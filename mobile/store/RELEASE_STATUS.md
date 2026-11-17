# Android and iOS release status

The mobile source targets both platforms. JavaScript bundle export is not a signed Android AAB/APK or iOS IPA and does not prove native runtime behaviour.

## Required owner configuration
1. Link this app to the owner's Expo project with `npx eas-cli@latest init`. Retain bundle identifiers only if owned: `com.reelmates.app`.
2. In Expo's preview and production environments set EXPO_PUBLIC_API_URL (HTTPS, ending /api/v1), EXPO_PUBLIC_WEB_URL (deployed web app), and EXPO_PUBLIC_EAS_PROJECT_ID (project UUID). Keep all service-role and signing secrets out of EXPO_PUBLIC variables.
3. Deploy the API with database migrations and working email delivery. Verify password reset and verification links on the deployed web host.
4. Configure Android signing/FCM and Apple signing/APNs in the owner's accounts. Provide the real App Store Connect app ID and Google Play service account securely through EAS submission configuration.
5. Build preview Android APK and iOS device build, then test on physical phones. Use production AAB for Play and production iOS build for TestFlight.

## Checks
Run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, and `npx expo export --platform android --platform ios` from mobile. `npm run check:release` requires the three environment values above and rejects missing/placeholder configuration. CI executes tests, typecheck, lint and both bundles.

The new mobile tests cover offline refresh, server failures, rejected credentials, concurrent refresh, and release configuration. Lint retains compiler diagnostics as warnings for existing imperative Animated refs and initial async effect loading; these are not native performance certification.

## Device acceptance gate
- Fresh install, signup, login, restart with saved session and token renewal.
- Airplane mode during expiration, recovery, logout and account switching.
- Profile photo picker, denied permissions, camera-free operation.
- Daily swipes, matching, chat, blocking/reporting and permanent deletion.
- Push permission denial, notification cold start and account-specific delivery.
- Password reset and verified email, legal/support URLs and accessible keyboard/screen-reader flows.
- No paid upgrade promises until store purchases and restore are implemented/tested.

No signed build, store submission, production deployment or physical-device test is claimed by this branch.

Logout calls now require bearer authentication. The mobile HTTP client retries expired sessions and revokes the latest rotated refresh token. A regression test covers this retry. Offline sign-out cannot guarantee remote revocation.
