-- Films a member wants to watch later. Only the API (service role) reads or writes it.
CREATE TABLE IF NOT EXISTS public.watchlist (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  movie_id integer NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, movie_id)
);
CREATE INDEX IF NOT EXISTS watchlist_user_created_idx ON public.watchlist (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS watchlist_movie_idx ON public.watchlist (movie_id);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.watchlist FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.watchlist TO service_role;
