# ReelMates Mobile (iOS & Android)

Expo app sharing the same ReelMates API as the web client.

## Setup

```bash
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` to your backend (include `/api`).

## Run

```bash
npm run server   # from repo root, in another terminal
npm start        # scan QR with Expo Go
```

## Production builds (EAS)

See **`docs/store/SUBMISSION_CHECKLIST.md`** in the repo root.

```bash
npx eas login
npx eas init
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

Bundle IDs: **`com.reelmates.app`**
