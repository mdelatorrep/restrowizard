
-- Enable pgcrypto for PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add PIN fields to staff_members
ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS pin_failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS pos_role text NOT NULL DEFAULT 'cashier'
    CHECK (pos_role IN ('cashier', 'waiter', 'supervisor', 'admin'));

-- Security definer function to set a PIN (called by owner from admin UI)
CREATE OR REPLACE FUNCTION public.set_staff_pin(_staff_id uuid, _pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  IF _pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'PIN must be 4-6 digits';
  END IF;

  SELECT user_id INTO _owner FROM public.staff_members WHERE id = _staff_id;

  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Staff member not found';
  END IF;

  IF _owner <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: only the restaurant owner can set PINs';
  END IF;

  UPDATE public.staff_members
  SET pin_hash = crypt(_pin, gen_salt('bf', 10)),
      pin_set_at = now(),
      pin_failed_attempts = 0,
      pin_locked_until = NULL,
      updated_at = now()
  WHERE id = _staff_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_staff_pin(uuid, text) TO authenticated;

-- Security definer function used only by edge function (service_role) to verify PIN
CREATE OR REPLACE FUNCTION public.verify_staff_pin(_restaurant_user_id uuid, _pin text)
RETURNS TABLE(
  staff_id uuid,
  linked_user_id uuid,
  staff_name text,
  pos_role text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec record;
BEGIN
  FOR _rec IN
    SELECT s.id, s.linked_user_id, s.name, s.pos_role, s.email,
           s.pin_hash, s.pin_locked_until, s.pin_failed_attempts
    FROM public.staff_members s
    WHERE s.user_id = _restaurant_user_id
      AND s.is_active = true
      AND s.pin_hash IS NOT NULL
  LOOP
    IF _rec.pin_locked_until IS NOT NULL AND _rec.pin_locked_until > now() THEN
      CONTINUE;
    END IF;

    IF _rec.pin_hash = crypt(_pin, _rec.pin_hash) THEN
      UPDATE public.staff_members
      SET pin_failed_attempts = 0, pin_locked_until = NULL
      WHERE id = _rec.id;

      staff_id := _rec.id;
      linked_user_id := _rec.linked_user_id;
      staff_name := _rec.name;
      pos_role := _rec.pos_role;
      email := _rec.email;
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;

  -- No match → increment counters for any staff that had a near miss is impossible without identifying them.
  -- We simply return no rows.
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_staff_pin(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(uuid, text) TO service_role;

-- Enable realtime for tables used by POS map
ALTER TABLE public.restaurant_tables REPLICA IDENTITY FULL;
ALTER TABLE public.restaurant_orders REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'restaurant_tables'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'restaurant_orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_orders';
  END IF;
END $$;
