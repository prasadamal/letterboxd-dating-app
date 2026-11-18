-- Fixes sign-up and login on databases whose refresh_tokens table was created by the original
-- 002 migration. That table has `family_id uuid NOT NULL` (no default), but the atomic session
-- functions from 20261108120000 did not set it, so every issue_refresh_token call failed with a
-- NOT NULL violation. The repository's own definition of the table omitted the column, which let
-- the two drift apart. This migration works on either shape and is safe to run twice.
ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS family_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.refresh_tokens ALTER COLUMN family_id SET DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON public.refresh_tokens (family_id);

-- A login starts a new family (the column default); a rotation keeps the family of the token it replaces.
CREATE OR REPLACE FUNCTION public.rotate_refresh_token(
  p_token_hash text, p_next_hash text, p_expires_at timestamptz
) RETURNS TABLE(user_id uuid, auth_version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid; v_family uuid; v_version integer; v_claim uuid;
BEGIN
  SELECT t.user_id, t.family_id INTO v_user, v_family FROM public.refresh_tokens t WHERE t.token_hash = p_token_hash;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT u.auth_version INTO v_version FROM public.users u
    WHERE u.id = v_user AND u.deleted_at IS NULL AND u.is_active IS NOT FALSE FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.refresh_tokens t SET revoked_at = now()
    WHERE t.token_hash = p_token_hash AND t.user_id = v_user
      AND t.revoked_at IS NULL AND t.expires_at > now() RETURNING t.id INTO v_claim;
  IF NOT FOUND THEN RETURN; END IF;
  INSERT INTO public.refresh_tokens(user_id, token_hash, expires_at, family_id)
    VALUES (v_user, p_next_hash, p_expires_at, v_family);
  RETURN QUERY SELECT v_user, v_version;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_refresh_token(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_refresh_token(text, text, timestamptz) TO service_role;
