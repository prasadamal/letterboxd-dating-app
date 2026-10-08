-- Dating opens city by city: a city opens at city_target women AND men who want to date, or when an admin adds it
-- to open_cities. The automatic global 500/500 launch is retired; an admin can still open dating everywhere
-- (platform_settings.dating_launched_at). Apply after 20261006120000_dating_optin.sql.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS city_target integer NOT NULL DEFAULT 150 CHECK (city_target > 0),
  ADD COLUMN IF NOT EXISTS open_cities text[] NOT NULL DEFAULT '{}';

-- Signup used to copy the country into the city when none was given. A country is not a city pool.
UPDATE public.users SET city = '' WHERE city IS NOT NULL AND lower(btrim(city)) = lower(btrim(coalesce(country, '')));

-- No automatic global launch any more: the function does nothing and the trigger that called it is switched off.
CREATE OR REPLACE FUNCTION public.refresh_dating_launch()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  RETURN;
END;
$function$;

ALTER TABLE public.users DISABLE TRIGGER users_refresh_launch;

-- Women and men who want to date, per city. Used by the API for the launch gate and the "unlock your city" board.
CREATE OR REPLACE FUNCTION public.city_dating_counts()
 RETURNS TABLE (city text, country text, women bigint, men bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT min(btrim(u.city)), min(btrim(u.country)),
         count(*) FILTER (WHERE u.gender = 'female'),
         count(*) FILTER (WHERE u.gender = 'male')
  FROM public.users u
  WHERE u.deleted_at IS NULL
    AND u.dating_enabled
    AND btrim(coalesce(u.city, '')) <> ''
    AND btrim(coalesce(u.country, '')) <> ''
  GROUP BY lower(btrim(u.city)), lower(btrim(u.country))
$function$;

-- Only the API (service role) may call it.
REVOKE ALL ON FUNCTION public.city_dating_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.city_dating_counts() TO service_role;

CREATE INDEX IF NOT EXISTS users_city_lower_idx ON public.users (lower(btrim(city))) WHERE deleted_at IS NULL AND dating_enabled;
