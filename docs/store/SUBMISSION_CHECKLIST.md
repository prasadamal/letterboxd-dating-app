# Store submission checklist — ReelMates

Use this when you wake up to ship **Android (Google Play)** and **iOS (App Store)**.

## Before you build

1. Deploy the **API** publicly over HTTPS (Render, Railway, Fly.io, etc.).
2. Set `EXPO_PUBLIC_API_URL=https://YOUR_HOST/api` in `mobile/eas.json` production profile (or EAS secrets).
3. Create an [Expo](https://expo.dev) account and run `cd mobile && npx eas-cli login`.
4. Link project: `npx eas init` → paste **project ID** into `mobile/app.json` → `extra.eas.projectId`.
5. Add Supabase **service role** + `JWT_SECRET` on the server host.

## Build commands

```bash
cd mobile
npm install
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

Preview APK (internal testers):

```bash
npx eas build -p android --profile preview
```

## Google Play Console

| Item | Location in repo |
|------|------------------|
| App name, short & full description | `docs/store/google-play/listing.md` |
| Privacy policy URL | GitHub raw link to `docs/legal/PRIVACY_POLICY.md` (or host on your domain) |
| Data safety form answers | `docs/store/google-play/data-safety.md` |
| Content rating | Dating / Users interact — expect **Mature 17+** |
| Category | Dating |
| Contact email | support@reelmates.app |
| Icon 512 | Export from `mobile/assets/icon.png` |
| Feature graphic 1024×500 | Create from brand (see `docs/store/assets/README.md`) |
| Phone screenshots | 2–8 PNGs (1080×1920 min) — capture from device or emulator |

**Signing:** EAS manages keystore on first Android production build. Download credentials from Expo dashboard.

**Service account (optional auto-submit):** Place JSON at `mobile/store/google-play-service-account.json` (gitignored) and run `npx eas submit -p android`.

## App Store Connect

| Item | Location in repo |
|------|------------------|
| Listing copy | `docs/store/app-store/listing.md` |
| Privacy policy URL | Same as Play |
| Age rating | 17+ (Mature themes / user-generated content) |
| Category | Social Networking or Lifestyle |
| Bundle ID | `com.reelmates.app` |
| Encryption | Uses standard HTTPS only → **ITSAppUsesNonExemptEncryption: false** (already in app.json) |
| Screenshots | 6.7" + 5.5" iPhone sets (see assets README) |

**Certificates:** EAS creates distribution cert + provisioning on first iOS build (Apple Developer account required, $99/yr).

Submit:

```bash
npx eas submit -p ios --latest
```

## Store assets still needed from you

- Final **production API URL**
- **Apple Developer** + **Google Play Developer** accounts ($99 + $25 one-time)
- **Real support email** (replace `support@reelmates.app` if needed)
- **Marketing screenshots** (templates in `docs/store/assets/README.md`)

## Quick test locally

```bash
# Terminal 1 — API
npm run server

# Terminal 2 — Expo
cd mobile && cp .env.example .env
npx expo start
```

## Final QA

Complete `docs/production/QA_CHECKLIST.md` before submitting builds.

Generate Play feature graphic template:

```bash
node scripts/generate-store-assets.mjs
```

Use Expo Go on your phone; set `EXPO_PUBLIC_API_URL` to your LAN IP.
