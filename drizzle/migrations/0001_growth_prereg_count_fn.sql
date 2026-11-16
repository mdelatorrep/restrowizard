CREATE OR REPLACE FUNCTION public.get_growth_preregistration_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT count(*)::int FROM public.growth_preregistrations $$;
GRANT EXECUTE ON FUNCTION public.get_growth_preregistration_count() TO anon, authenticated;