-- Regression test for the sign-in/session functions against BOTH shapes of public.refresh_tokens:
--   with `family_id uuid NOT NULL` (what production has) and without it (what the repository defined).
-- Run through scripts/test-auth-functions.sh, which builds the scratch databases.
\set ON_ERROR_STOP on
DO $$
DECLARE u uuid; ok boolean; r record; n int;
BEGIN
  INSERT INTO public.users (email) VALUES ('fn-test@example.com') RETURNING id INTO u;

  ok := public.issue_refresh_token(u, 0, 'h1', now() + interval '30 days');
  IF NOT ok THEN RAISE EXCEPTION 'issue_refresh_token returned false'; END IF;
  -- a stale auth_version must be refused
  IF public.issue_refresh_token(u, 5, 'h-stale', now() + interval '30 days') THEN RAISE EXCEPTION 'stale auth_version accepted'; END IF;

  SELECT * INTO r FROM public.rotate_refresh_token('h1', 'h2', now() + interval '30 days');
  IF r.user_id IS DISTINCT FROM u THEN RAISE EXCEPTION 'rotate did not return the user'; END IF;
  -- a used token cannot be replayed
  SELECT count(*) INTO n FROM public.rotate_refresh_token('h1', 'h3', now() + interval '30 days');
  IF n <> 0 THEN RAISE EXCEPTION 'replayed token was accepted'; END IF;
  -- an unknown token returns nothing
  SELECT count(*) INTO n FROM public.rotate_refresh_token('nope', 'h4', now() + interval '30 days');
  IF n <> 0 THEN RAISE EXCEPTION 'unknown token was accepted'; END IF;
  -- the rotated token works once
  SELECT count(*) INTO n FROM public.rotate_refresh_token('h2', 'h5', now() + interval '30 days');
  IF n <> 1 THEN RAISE EXCEPTION 'rotated token should work once'; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refresh_tokens' AND column_name='family_id') THEN
    SELECT count(DISTINCT family_id) INTO n FROM public.refresh_tokens WHERE user_id = u;
    IF n <> 1 THEN RAISE EXCEPTION 'rotation should keep one family, found %', n; END IF;
  END IF;

  -- a suspended account cannot get a token
  UPDATE public.users SET is_active = false WHERE id = u;
  IF public.issue_refresh_token(u, 0, 'h6', now() + interval '30 days') THEN RAISE EXCEPTION 'suspended account got a token'; END IF;
END $$;
SELECT 'refresh token functions ok' AS result;
