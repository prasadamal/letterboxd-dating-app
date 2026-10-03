-- production_phase3_v1: read receipts + swipe analytics helpers

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_deck_stats (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  swipes_total integer NOT NULL DEFAULT 0,
  likes_total integer NOT NULL DEFAULT 0,
  passes_total integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
