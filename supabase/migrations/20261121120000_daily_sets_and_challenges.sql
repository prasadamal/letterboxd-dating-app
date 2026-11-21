-- The daily ten, chosen once per UTC day for everyone (server/lib/films/dailyPicker.js), with the slot
-- each film fills. Earlier days are the picker's memory: films and directors rest before coming back.
CREATE TABLE IF NOT EXISTS public.daily_sets (
  day date PRIMARY KEY,
  movie_ids integer[] NOT NULL,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  face_off text,
  algorithm text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_sets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.daily_sets FROM anon, authenticated;
GRANT SELECT, INSERT ON public.daily_sets TO service_role;

-- Taste challenges: a member shares their answers to one day's ten films as a link; anyone who opens it
-- answers the same ten and sees how connected they are. One challenge per member per day.
CREATE TABLE IF NOT EXISTS public.challenges (
  code text PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  movie_ids integer[] NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, day)
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.challenges FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO service_role;

CREATE TABLE IF NOT EXISTS public.challenge_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL REFERENCES public.challenges(code) ON DELETE CASCADE,
  responder_name text NOT NULL CHECK (char_length(responder_name) BETWEEN 1 AND 40),
  responder_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  answers jsonb NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  same_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challenge_responses_code_idx ON public.challenge_responses (code, created_at DESC);
CREATE INDEX IF NOT EXISTS challenge_responses_responder_idx ON public.challenge_responses (responder_id) WHERE responder_id IS NOT NULL;
ALTER TABLE public.challenge_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.challenge_responses FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.challenge_responses TO service_role;
