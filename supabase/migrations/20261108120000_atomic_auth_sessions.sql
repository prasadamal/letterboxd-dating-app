-- Apply before deploying the API. Existing access tokens use version zero.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 0;

-- All session mutations lock the user first, so login/refresh cannot recreate a
-- valid session after a simultaneous password reset. Function calls are atomic.
CREATE OR REPLACE FUNCTION public.issue_refresh_token(
  p_user_id uuid, p_auth_version integer, p_token_hash text, p_expires_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_version integer;
BEGIN
  SELECT u.auth_version INTO v_version FROM public.users u
    WHERE u.id = p_user_id AND u.deleted_at IS NULL AND u.is_active IS NOT FALSE FOR UPDATE;
  IF NOT FOUND OR v_version <> p_auth_version OR p_auth_version IS NULL THEN RETURN false; END IF;
  INSERT INTO public.refresh_tokens(user_id, token_hash, expires_at)
    VALUES (p_user_id, p_token_hash, p_expires_at);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.rotate_refresh_token(
  p_token_hash text, p_next_hash text, p_expires_at timestamptz
) RETURNS TABLE(user_id uuid, auth_version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid; v_version integer; v_claim uuid;
BEGIN
  SELECT t.user_id INTO v_user FROM public.refresh_tokens t WHERE t.token_hash = p_token_hash;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT u.auth_version INTO v_version FROM public.users u
    WHERE u.id = v_user AND u.deleted_at IS NULL AND u.is_active IS NOT FALSE FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.refresh_tokens t SET revoked_at = now()
    WHERE t.token_hash = p_token_hash AND t.user_id = v_user
      AND t.revoked_at IS NULL AND t.expires_at > now() RETURNING t.id INTO v_claim;
  IF NOT FOUND THEN RETURN; END IF;
  INSERT INTO public.refresh_tokens(user_id, token_hash, expires_at)
    VALUES (v_user, p_next_hash, p_expires_at);
  RETURN QUERY SELECT v_user, v_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_password_with_token(p_token_hash text, p_password_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid; v_claim uuid;
BEGIN
  SELECT t.user_id INTO v_user FROM public.auth_tokens t
    WHERE t.token_hash = p_token_hash AND t.purpose = 'password_reset';
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM u.id FROM public.users u WHERE u.id = v_user AND u.deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.auth_tokens t SET consumed_at = now()
    WHERE t.token_hash = p_token_hash AND t.purpose = 'password_reset'
      AND t.consumed_at IS NULL AND t.expires_at > now() RETURNING t.user_id INTO v_claim;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.users SET password_hash = p_password_hash, auth_version = auth_version + 1 WHERE id = v_user;
  UPDATE public.refresh_tokens SET revoked_at = now() WHERE user_id = v_user AND revoked_at IS NULL;
  UPDATE public.auth_tokens SET consumed_at = now()
    WHERE user_id = v_user AND purpose = 'password_reset' AND consumed_at IS NULL;
  RETURN true;
END;
$$;

-- Password hashes and sessions are exclusively controlled by the trusted API.
REVOKE ALL ON FUNCTION public.issue_refresh_token(uuid, integer, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rotate_refresh_token(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_password_with_token(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_refresh_token(uuid, integer, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.rotate_refresh_token(text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_password_with_token(text, text) TO service_role;
