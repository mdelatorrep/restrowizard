-- Revoke execute from anon on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.claim_consultant_client(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_team_invitation(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.seed_platform_admin(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_team_role(uuid, uuid, public.team_member_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_lead(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_business_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_business_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_profile(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_aggregated_daily_sales(uuid, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_menu_item_scores(uuid, integer) FROM anon;