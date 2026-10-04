-- Applied remotely to moviematch on 2026-10-04.
-- One all-time favourite film per person (used in matching and shown on profile cards).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_movie_id integer REFERENCES public.movies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS users_favorite_movie_idx ON public.users (favorite_movie_id) WHERE favorite_movie_id IS NOT NULL;

-- Film friends: taste compatibility with anyone (not dating), stored in both directions.
CREATE TABLE IF NOT EXISTS public.film_friends (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);
ALTER TABLE public.film_friends ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS film_friends_friend_idx ON public.film_friends (friend_id);
