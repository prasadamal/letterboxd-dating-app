-- Applied remotely to moviematch on 2026-10-04.
-- Collections (from the curated film list) and the 140 films added from it live in server/movieCatalog.js;
-- `npm run db:seed` upserts them, including tags.
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS movies_tags_idx ON public.movies USING gin (tags);

-- In-app feedback (Profile → Send feedback), read in /admin.
CREATE TABLE IF NOT EXISTS public.feedback (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('bug', 'idea', 'film', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 3 AND 2000),
  app_version text,
  platform text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback (status, created_at DESC);

-- Community chart: how many people liked / disliked / haven't seen each film.
CREATE OR REPLACE VIEW public.movie_rating_stats WITH (security_invoker = true) AS
  SELECT movie_id,
         count(*) FILTER (WHERE rating = 'love')::int AS likes,
         count(*) FILTER (WHERE rating = 'hate')::int AS dislikes,
         count(*) FILTER (WHERE rating = 'skip')::int AS not_seen
  FROM public.user_ratings GROUP BY movie_id;
REVOKE ALL ON public.movie_rating_stats FROM anon, authenticated;
