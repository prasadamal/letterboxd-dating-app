-- A member's film diary: every time they watched a film, when, how much they liked it and a note.
-- Private to the member. Only the API (service role) reads or writes it. Rewatches are separate rows.
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  movie_id integer NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  watched_on date NOT NULL,
  -- Half stars: 1 = half a star, 10 = five stars. Null means "no rating, just logged".
  stars smallint CHECK (stars BETWEEN 1 AND 10),
  note text CHECK (char_length(note) <= 1000),
  rewatch boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diary_entries_user_watched_idx ON public.diary_entries (user_id, watched_on DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS diary_entries_movie_idx ON public.diary_entries (movie_id);
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.diary_entries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries TO service_role;
