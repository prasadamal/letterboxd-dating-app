-- production_complete_v1: verification, activity tracking, realtime prep

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS users_last_active_at_idx ON public.users(last_active_at);
CREATE INDEX IF NOT EXISTS users_verification_status_idx ON public.users(verification_status);
