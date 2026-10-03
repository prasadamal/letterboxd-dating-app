-- Applied remotely to moviematch on 2026-10-03.
-- Avatars are public: cap size and restrict to image types (the API also checks magic bytes).
UPDATE storage.buckets
SET file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- Foreign keys flagged by the Supabase performance advisor; also used by account deletion.
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS moderation_queue_report_idx ON public.moderation_queue (report_id);
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS users_referred_by_idx ON public.users (referred_by) WHERE referred_by IS NOT NULL;
-- Push tokens are looked up by token on logout, re-registration and Expo receipt pruning.
CREATE INDEX IF NOT EXISTS push_tokens_token_idx ON public.push_tokens (token);
