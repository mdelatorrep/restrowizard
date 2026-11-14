REVOKE EXECUTE ON FUNCTION public.convert_unit(numeric, uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_recipe_cost(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_unit(numeric, uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_recipe_cost(uuid, int) TO authenticated, service_role;