CREATE OR REPLACE FUNCTION public.ensure_user_id_for_rls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.user_id := COALESCE(NEW.user_id, auth.uid());
  ELSE
    NEW.user_id := COALESCE(NEW.user_id, OLD.user_id, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_user_id_inventory_items ON public.inventory_items;
CREATE TRIGGER ensure_user_id_inventory_items
BEFORE INSERT OR UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id_for_rls();

DROP TRIGGER IF EXISTS ensure_user_id_restaurant_brands ON public.restaurant_brands;
CREATE TRIGGER ensure_user_id_restaurant_brands
BEFORE INSERT OR UPDATE ON public.restaurant_brands
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id_for_rls();