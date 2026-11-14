-- C-05: la auditoría del POS guarda el nombre y el rol de quien actuó.
-- Los triggers de auditoría solo dejaban auth.uid(); este trigger completa el
-- actor desde el empleado vinculado a esa cuenta (o el perfil del dueño).
CREATE OR REPLACE FUNCTION public.pos_audit_fill_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff record;
BEGIN
  IF NEW.actor_user_id IS NULL OR (NEW.actor_name IS NOT NULL AND NEW.actor_staff_id IS NOT NULL) THEN
    RETURN NEW;
  END IF;
  SELECT id, name, pos_role INTO v_staff
    FROM staff_members
   WHERE linked_user_id = NEW.actor_user_id AND user_id = NEW.user_id
   LIMIT 1;
  IF FOUND THEN
    NEW.actor_staff_id := coalesce(NEW.actor_staff_id, v_staff.id);
    NEW.actor_name     := coalesce(NEW.actor_name, v_staff.name);
    NEW.actor_role     := coalesce(NEW.actor_role, v_staff.pos_role);
  ELSIF NEW.actor_user_id = NEW.user_id THEN
    NEW.actor_name := coalesce(NEW.actor_name, (SELECT nullif(full_name, '') FROM profiles WHERE user_id = NEW.user_id), 'Dueño');
    NEW.actor_role := coalesce(NEW.actor_role, 'owner');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_audit_fill_actor() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS aa_pos_audit_fill_actor ON public.pos_audit_log;
CREATE TRIGGER aa_pos_audit_fill_actor BEFORE INSERT ON public.pos_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.pos_audit_fill_actor();
