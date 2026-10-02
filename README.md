# ReelMates

Movie-taste dating: rate daily film picks (title + year), build a taste profile, match on shared likes/dislikes.

## Stack

- **Frontend:** React + Vite
- **Backend:** Express + JWT
- **Database:** [Supabase](https://supabase.com) Postgres (free tier) — project `moviematch`

## Setup

```bash
npm install
cp .env.example .env
```

In `.env`, set:

- `JWT_SECRET` — long random string
- `SUPABASE_URL` — `https://kounpkxjjkuoabbofgay.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Project Settings → API (**server only**, never commit)

## Development

```bash
npm run dev
```

Open http://localhost:3000

**Demo login:** `maya@example.com` / `123456` (after demo seed below)

## Seed movies (first deploy)

If `movies` is empty, the server auto-seeds from `server/movieCatalog.js` on startup.

Or run:

```bash
npm run db:seed
```

## Demo users (optional)

```bash
npm run db:seed:demo
```

Creates Maya, Anna, and Luca with bcrypt passwords and sample ratings.

## Production

```bash
npm run build
NODE_ENV=production npm start
```

## Security note

The Supabase project currently has **RLS disabled** on public tables (backend uses the service role). Before exposing Supabase directly to clients, enable RLS and add policies. See [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Mobile (iOS & Android)

Expo app in **`mobile/`**. Full Play Store & App Store checklist: **`docs/store/SUBMISSION_CHECKLIST.md`**.

```bash
npm run mobile          # Expo dev server
cd mobile && npm run build:android
cd mobile && npm run build:ios
```

Bundle ID / package: **`com.reelmates.app`**
