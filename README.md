# ReelMates

Movie-taste dating app: rate films, get a taste profile, and discover compatible matches.

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000 (Vite proxies `/api` to the backend on port 4000).

**Demo login:** `maya@example.com` / `123456`

## Production

```bash
npm install
cp .env.example .env   # set JWT_SECRET and CLIENT_URL
npm run build
NODE_ENV=production npm start
```

Serves the built SPA from `dist/` on the same port as the API (`PORT`, default 4000).

## API

- `POST /api/auth/signup|login`, `GET /api/auth/me`
- `GET /api/movies/daily`, `POST /api/movies/:id/rate`
- `GET /api/matches`, `GET /api/matches/:id`, `POST /api/matches/:id/like`
- `GET|PUT /api/users/profile`
- `GET /api/messages/:userId`, `POST /api/messages`

Data is in-memory (resets on restart). Swap `server/db.js` for Postgres when you outgrow the MVP.
