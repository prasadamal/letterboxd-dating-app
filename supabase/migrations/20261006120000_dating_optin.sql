-- "Here for": films & friends only, or dating too. Apply after 20261005120000_inclusive_regions_plus.sql.
-- Not yet applied to moviematch.

-- Existing members signed up for dating, so they stay in. New members choose at signup.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dating_enabled boolean NOT NULL DEFAULT true;

-- The launch gate balances the dating pool, so it only counts people who want to date.
CREATE OR REPLACE FUNCTION public.refresh_dating_launch()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  settings public.platform_settings%ROWTYPE;
  males integer;
  females integer;
BEGIN
  SELECT * INTO settings FROM public.platform_settings WHERE id = 1;
  SELECT count(*) INTO males FROM public.users WHERE gender = 'male' AND deleted_at IS NULL AND dating_enabled;
  SELECT count(*) INTO females FROM public.users WHERE gender = 'female' AND deleted_at IS NULL AND dating_enabled;

  IF settings.dating_launched_at IS NULL
     AND males >= settings.male_target
     AND females >= settings.female_target THEN
    UPDATE public.platform_settings
      SET dating_launched_at = now(), updated_at = now()
      WHERE id = 1;
  END IF;
END;
$function$;

DROP TRIGGER IF EXISTS users_refresh_launch ON public.users;
CREATE TRIGGER users_refresh_launch
  AFTER INSERT OR UPDATE OF gender, deleted_at, dating_enabled ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_after_change_launch();

-- One spelling for science fiction (the catalog now says Sci-Fi everywhere).
UPDATE public.movies SET genres = array_replace(genres, 'Science Fiction', 'Sci-Fi') WHERE 'Science Fiction' = ANY (genres);

-- Signup used to fill in a generic bio; profiles no longer need one (see computeProfileCompletion).
UPDATE public.users SET bio = '' WHERE bio = 'Connecting through the world of movies.';
