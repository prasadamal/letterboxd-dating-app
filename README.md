# ReelMates

ReelMates is a movie-taste-based dating app where people with similar cinema preferences can meet, match, and chat.

## Features

- Daily movie rating flow
- Profile creation from loved and hated movies
- Compatibility engine based on taste overlap
- Match discovery UI with profile summaries
- JWT auth and Express backend
- PostgreSQL-ready architecture with in-memory fallback for local development

## Quick start

1. Install dependencies:
   npm install

2. Configure environment:
   cp .env.example .env

3. Start the app:
   npm run dev

4. Open:
   http://localhost:3000

## API endpoints

- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- GET /api/movies/daily
- POST /api/movies/:id/rate
- GET /api/matches
- GET /api/profile
- GET /api/health

## Production deployment note

This MVP is designed to be deployed with a PostgreSQL database. If DATABASE_URL is not configured, the app uses a seeded in-memory dataset so it still runs locally and can be developed without a database server.
