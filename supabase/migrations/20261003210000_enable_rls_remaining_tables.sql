-- Applied remotely as enable_rls_remaining_tables + pin_function_search_path.
-- RLS with no policies: client keys are denied; the API uses the service role.
ALTER TABLE public.user_deck_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_titles ENABLE ROW LEVEL SECURITY;

ALTER FUNCTION public.refresh_dating_launch() SET search_path = '';
ALTER FUNCTION public.users_after_change_launch() SET search_path = '';
