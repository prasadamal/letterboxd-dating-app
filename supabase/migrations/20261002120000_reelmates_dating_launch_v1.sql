-- ReelMates dating launch v1 (see README)
-- Applied via Supabase migration reelmates_dating_launch_v1

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS country text DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS taste_vector jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_key ON public.users(referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  male_target integer NOT NULL DEFAULT 500,
  female_target integer NOT NULL DEFAULT 500,
  dating_launched_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_swipes (
  id bigserial PRIMARY KEY,
  swiper_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('like', 'pass')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, target_id)
);

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS chat_unlocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_a_intro_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_b_intro_sent boolean NOT NULL DEFAULT false;
