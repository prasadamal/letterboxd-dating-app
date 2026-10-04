# ReelMates — product & technical README

**ReelMates** is a **native-first** dating app for people who match on **movie taste**. Users play a daily 10-film sorting game before dating goes live. Dating unlocks when registration reaches **500 men and 500 women** (configurable).

---

## Product flow (your spec)

### 1. Registration (first screen)

Collect:

- **Name**
- **Age** (18+ enforced)
- **Country**
- **Gender** (`male` / `female`) — used for launch balance counters
- **One line about you** and the world of movies (`bio`)
- **Email + password**
- **Terms & Privacy** acceptance (required)
- Optional **referral code**

### 2. Pre-launch phase (taste-only)

- Home tab shows **live counters**: men registered / 500, women registered / 500.
- **Daily taste game** (10 films per calendar day, first open):
  - Titles only (name + year), global catalog (~300 films in DB).
  - User **drags** each film into **I like** or **I don't like** (kid-game buckets).
  - Everyone gets the **same films** each day, so people build up films in common; the catalog cycles, so films come back later to refine taste.
- Backend stores ratings and a **taste vector** (genres/languages weighted from likes/dislikes).
- **Dating tabs are hidden** until launch thresholds are met.

### 3. Launch gate

- When **male count ≥ target** AND **female count ≥ target** (default **500 / 500**), `dating_launched_at` is set automatically.
- **Dating** and **Matches** tabs appear.

Env overrides (for dev/staging):

```env
LAUNCH_MALE_TARGET=500
LAUNCH_FEMALE_TARGET=500
DAILY_MOVIE_COUNT=10
```

To test dating locally, set `FORCE_DATING_OPEN=true` in `.env`: it opens dating for that API instance only and never touches the shared database. In production, change targets or open dating from `/admin`.

### 4. Dating (Tinder v1 basics)

- One profile card at a time: **photo**, **name**, **age**, **country**, **bio line**.
- Taste copy examples:
  - `Anna liked The Shawshank Redemption (1994) and The Godfather (1972) like you`
  - `Anna didn't like Avengers (2018) and Pink Panther (1963) like you`
- **Pass** or **Like** (swipe actions via buttons; native card UI).
- **Mutual like** creates a match row.

### 5. Chat

- Only **mutual matches** can message.
- **Intro rule:** each person sends **one hello**; after **both** have sent, **full chat unlocks**.
- **Block**, **report**, and **delete account** are available (store safety baseline).

### 6. Referrals

- Each user gets a **referral code**; friends can apply it at signup or in Profile.

---

## Architecture

| Layer | Tech |
|--------|------|
| **Mobile (primary)** | Expo 57, React Native, Expo Router — `mobile/` |
| **API** | Express + JWT + bcrypt — `server/` |
| **Database** | Supabase Postgres (project `moviematch`) |
| **Web** | React + Vite (secondary/demo) — `src/` |

### Main API routes

| Route | Purpose |
|--------|---------|
| `POST /api/auth/signup` | Register with gender, country, terms |
| `GET /api/auth/me` | Profile + platform status |
| `GET /api/platform/status` | Public launch counters |
| `GET /api/movies/daily` | 10 daily films |
| `POST /api/movies/:id/rate` | `love` / `hate` / `skip` |
| `GET /api/dating/deck` | Next dating profile (post-launch) |
| `POST /api/dating/swipe` | `{ targetId, action: like\|pass }` |
| `GET /api/dating/matches` | Mutual matches |
| `GET/POST /api/messages/...` | Chat with intro gating |
| `POST /api/safety/block` | Block user |
| `POST /api/safety/report` | Report user |
| `DELETE /api/safety/account` | Delete account |
| `GET /api/dating/referral` | Referral code + share text |

### Matching algorithm (scalable to ~1k users now)

1. Per-user **love/hate** sets from daily game.
2. Compatibility score: shared loves (+), shared hates (+), conflicts (−).
3. Genre/language weights stored in `users.taste_vector` JSON.
4. Dating deck: opposite-gender candidates, exclude swipes/blocks, sort by score.

For **10k+** users: add Postgres indexes on `gender`, `user_swipes`, precompute candidate pools, or move deck generation to a background job.

---

## Mobile app tabs

| Tab | When visible |
|-----|----------------|
| **Launch** | Always — counters & explanation |
| **Daily game** | Always — drag 10 films |
| **Dating** | After launch |
| **Matches** | After launch |
| **Profile** | Always — edit bio, referral, safety, logout, delete |

---

## Development

```bash
# Install
npm install
cd mobile && npm install

# API + web
cp .env.example .env   # set SUPABASE_* and JWT_SECRET
npm run dev

# Native app (Expo)
npm run server         # terminal 1
cd mobile && npm start # terminal 2 — Expo Go / simulator
```

**Demo users** (local development only; refused when `NODE_ENV=production`):

```bash
DEMO_PASSWORD=pick-one npm run db:seed:demo   # maya@ / anna@ / luca@example.com
npm run db:prelaunch-cleanup -- --yes         # removes them again (run before launch)
```

---

## Production & stores

- **Owner launch guide (start here):** [`LAUNCH_GUIDE.md`](LAUNCH_GUIDE.md) — every account, key and command, in order
- **Launch checklist (status):** `docs/production/LAUNCH_CHECKLIST.md`
- **Architecture / backlog / deploy:** `docs/production/ARCHITECTURE.md`, `BACKLOG.md`, `DEPLOYMENT.md`, `STAGING.md`
- Deploy API over **HTTPS**; set `EXPO_PUBLIC_API_URL` in EAS.
- Run `npm test` in CI; use Docker for API hosting.
- See `docs/store/SUBMISSION_CHECKLIST.md` for Play/App Store steps.
- Legal: `docs/legal/PRIVACY_POLICY.md`, `docs/legal/TERMS_OF_SERVICE.md`.

---

## Database migrations

- `supabase/migrations/20261002120000_reelmates_dating_launch_v1.sql`
- `supabase/migrations/20261002200000_production_hardening_v1.sql` (+ remote `production_hardening_v1`)
- `supabase/migrations/20261002210000_production_phase2_v1.sql`
- `supabase/migrations/20261002220000_production_phase3_v1.sql`
- `supabase/migrations/20261003000000_production_complete_v1.sql`
- `supabase/migrations/20261003210000_enable_rls_remaining_tables.sql`

RLS is enabled on every `public` table with no policies, so client keys get no table access. The API must use `SUPABASE_SERVICE_ROLE_KEY`.

---

## Shipped since v1.0

- Supabase Realtime chat broadcast (`chat:{conversationId}`), with polling as a fallback
- OpenAPI spec and Swagger UI at `/api/v1/docs`
- Manual age/location verification (user request + admin review)
- Inactivity cleanup job (`POST /api/v1/internal/inactivity-cleanup`)
- Integration tests (`npm run test:integration`) and a Maestro smoke flow (`mobile/.maestro/smoke.yaml`)

See `CHANGELOG.md` and `docs/production/BACKLOG.md`.

## What's intentionally out of scope (next passes)

- Third-party ID verification vendor (Persona/Onfido), payments
- Postgres Realtime RLS policies for direct client reads (broadcast is used today)
- Detox suite in CI
