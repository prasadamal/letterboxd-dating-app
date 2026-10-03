-- production_phase2_v1: refresh tokens, push tokens, profile photos, moderation queue

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS discovery_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_completion integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matchmaking_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON public.refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS public.push_tokens (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);

CREATE TABLE IF NOT EXISTS public.profile_photos (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_photos_user_id_idx ON public.profile_photos(user_id);

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id bigserial PRIMARY KEY,
  report_id bigint,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_queue_status_idx ON public.moderation_queue(status);
