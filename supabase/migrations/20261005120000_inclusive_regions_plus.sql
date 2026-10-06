-- Inclusive dating, regional launch, streaks, profile prompts, shareable taste card and ReelMates Plus.
-- Not yet applied to moviematch: run with `supabase db push` (or paste into the SQL editor) before deploying the API.

-- 1. Who you are and who you want to see. Matching requires interest both ways (server/lib/datingEligibility.js).
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_gender_check CHECK (gender IN ('male', 'female', 'nonbinary', 'other'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS interested_in text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_interested_in_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_interested_in_check CHECK (interested_in <@ ARRAY['male', 'female', 'nonbinary']::text[]);

-- Existing members keep today's behaviour (men see women, women see men) until they change it.
UPDATE public.users SET interested_in = ARRAY['female'] WHERE gender = 'male' AND interested_in = '{}';
UPDATE public.users SET interested_in = ARRAY['male'] WHERE gender = 'female' AND interested_in = '{}';

-- 2. Daily-game streaks (UTC days in a row with at least one rating).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS streak_current integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_best integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_day date;

-- 3. Up to three film prompts on the profile card, e.g. {"key": "defend_forever", "answer": "Speed Racer"}.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS prompts jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_prompts_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_prompts_check CHECK (jsonb_typeof(prompts) = 'array' AND jsonb_array_length(prompts) <= 3);

-- 4. Public taste card at /taste/<friend code>. Off until the member shares it.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS taste_card_public boolean NOT NULL DEFAULT false;

-- 5. ReelMates Plus: active while plus_until is in the future (set by the RevenueCat webhook or /admin).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plus_until timestamptz;

-- 6. Regional launch: a country opens on its own once it has country_target men AND women,
--    or when an admin adds it to open_countries. The global 500/500 gate still opens everywhere.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS country_target integer NOT NULL DEFAULT 150 CHECK (country_target > 0),
  ADD COLUMN IF NOT EXISTS open_countries text[] NOT NULL DEFAULT '{}';

-- The API now stores country names trimmed with single spaces; tidy existing rows so they count together.
UPDATE public.users SET country = regexp_replace(btrim(country), '\s+', ' ', 'g')
  WHERE country IS DISTINCT FROM regexp_replace(btrim(country), '\s+', ' ', 'g');

CREATE INDEX IF NOT EXISTS users_country_lower_idx ON public.users (lower(country)) WHERE deleted_at IS NULL;
-- "Likes you": incoming likes are looked up by target.
CREATE INDEX IF NOT EXISTS user_swipes_target_action_idx ON public.user_swipes (target_id, action);
