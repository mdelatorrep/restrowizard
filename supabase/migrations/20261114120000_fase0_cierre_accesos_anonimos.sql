-- Fase 0 del plan de cierre de brechas (auditoría 14-nov-2026)
--
-- B-01  Ninguna función SECURITY DEFINER queda ejecutable por anónimos salvo
--       las que sirven a páginas públicas a propósito. Las que verifican poco
--       pasan a verificar al llamador.
-- B-01b La lealtad pública dejaba a cualquiera leer TODOS los clientes de
--       TODOS los restaurantes (nombre, correo, teléfono, cumpleaños, gasto) y
--       cambiarles los puntos. Ahora el portal público usa RPC acotadas por el
--       código de lealtad, y las políticas abiertas desaparecen.
-- B-02  Límite de intentos de PIN: bloqueo de 15 min al quinto fallo por
--       restaurante e IP, alerta al dueño a los 20 fallos por hora y bloqueo
--       del restaurante a los 100 (techo contra fuerza bruta distribuida).

-- ───────────────────────── B-02 · intentos de PIN ─────────────────────────

CREATE TABLE IF NOT EXISTS public.pos_pin_attempts (
  id bigserial PRIMARY KEY,
  restaurant_user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('login', 'supervisor')),
  ip text,
  succeeded boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pos_pin_attempts_owner_idx
  ON public.pos_pin_attempts (restaurant_user_id, kind, created_at DESC);
ALTER TABLE public.pos_pin_attempts ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo la tocan las funciones de abajo y el service role.
REVOKE ALL ON public.pos_pin_attempts FROM PUBLIC, anon, authenticated;

-- IP del que llama, según las cabeceras que PostgREST deja en la sesión.
-- cf-connecting-ip la pone Cloudflare y el cliente no la puede falsificar.
CREATE OR REPLACE FUNCTION public._pos_request_ip()
RETURNS text LANGUAGE sql STABLE SET search_path TO 'public' AS $fn$
  SELECT nullif(trim(split_part(coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip',
    nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
    ''), ',', 1)), '')
$fn$;

-- 'ok' | 'locked_ip' | 'locked_restaurant'
CREATE OR REPLACE FUNCTION public.pos_pin_guard(p_owner uuid, p_kind text, p_ip text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT CASE
    WHEN (SELECT count(*) FROM pos_pin_attempts
           WHERE restaurant_user_id = p_owner AND kind = p_kind AND NOT succeeded
             AND created_at > now() - interval '60 minutes') >= 100 THEN 'locked_restaurant'
    WHEN (SELECT count(*) FROM pos_pin_attempts
           WHERE restaurant_user_id = p_owner AND kind = p_kind AND NOT succeeded
             AND ip IS NOT DISTINCT FROM p_ip
             AND created_at > now() - interval '15 minutes') >= 5 THEN 'locked_ip'
    ELSE 'ok'
  END
$fn$;

CREATE OR REPLACE FUNCTION public.pos_pin_record(p_owner uuid, p_kind text, p_ip text, p_ok boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v_fails int;
BEGIN
  INSERT INTO pos_pin_attempts (restaurant_user_id, kind, ip, succeeded)
  VALUES (p_owner, p_kind, p_ip, p_ok);
  IF p_ok THEN RETURN; END IF;

  SELECT count(*) INTO v_fails FROM pos_pin_attempts
   WHERE restaurant_user_id = p_owner AND kind = p_kind AND NOT succeeded
     AND created_at > now() - interval '60 minutes';

  IF v_fails IN (20, 100) THEN
    INSERT INTO copilot_alerts (user_id, alert_type, priority, title, message, data, action_url)
    VALUES (
      p_owner, 'security',
      (CASE WHEN v_fails >= 100 THEN 'critical' ELSE 'high' END)::copilot_alert_priority,
      CASE WHEN p_kind = 'login' THEN 'Intentos fallidos de PIN en el POS'
           ELSE 'Intentos fallidos de PIN de supervisor' END,
      v_fails || ' intentos fallidos en la última hora'
        || CASE WHEN v_fails >= 100 THEN '. Bloqueamos el ingreso por PIN durante una hora.'
                ELSE '. Si no fue tu equipo, cambia los PIN.' END,
      jsonb_build_object('kind', p_kind, 'fails_last_hour', v_fails, 'last_ip', p_ip),
      '/r/pos-audit');
  END IF;
END
$fn$;

REVOKE ALL ON FUNCTION public.pos_pin_guard(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_pin_record(uuid, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._pos_request_ip() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_pin_guard(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pos_pin_record(uuid, text, text, boolean) TO service_role;

-- Supervisor: exige sesión de alguien del equipo de ese restaurante y pasa por el límite.
CREATE OR REPLACE FUNCTION public.pos_verify_supervisor_pin(
  p_user_id uuid, p_pin text, p_reason_code text, p_reason_text text DEFAULT NULL::text,
  p_amount numeric DEFAULT NULL::numeric, p_entity text DEFAULT NULL::text,
  p_entity_id uuid DEFAULT NULL::uuid, p_terminal_id text DEFAULT NULL::text,
  p_requester_staff_id uuid DEFAULT NULL::uuid, p_requester_name text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v_staff RECORD;
  v_auth_id uuid;
  v_ip text := public._pos_request_ip();
BEGIN
  IF auth.uid() IS NULL
     OR p_user_id NOT IN (SELECT public.team_owner_ids(ARRAY['pos'], 'read')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado');
  END IF;
  IF p_pin IS NULL OR length(p_pin) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN inválido');
  END IF;
  IF public.pos_pin_guard(p_user_id, 'supervisor', v_ip) <> 'ok' THEN
    RETURN jsonb_build_object('ok', false, 'locked', true,
      'error', 'Demasiados intentos fallidos. Espera 15 minutos.');
  END IF;

  SELECT id, name AS full_name, pos_role, pin_locked_until INTO v_staff
    FROM public.staff_members
   WHERE user_id = p_user_id AND pin_hash IS NOT NULL
     AND pin_hash = crypt(p_pin, pin_hash)
     AND pos_role IN ('supervisor', 'admin')
   LIMIT 1;

  IF v_staff.id IS NULL THEN
    PERFORM public.pos_pin_record(p_user_id, 'supervisor', v_ip, false);
    RETURN jsonb_build_object('ok', false, 'error', 'Supervisor no autorizado');
  END IF;
  IF v_staff.pin_locked_until IS NOT NULL AND v_staff.pin_locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN bloqueado temporalmente');
  END IF;
  PERFORM public.pos_pin_record(p_user_id, 'supervisor', v_ip, true);

  INSERT INTO public.pos_supervisor_authorizations (
    user_id, supervisor_staff_id, supervisor_name, requester_staff_id, requester_name,
    terminal_id, reason_code, reason_text, amount, entity, entity_id)
  VALUES (p_user_id, v_staff.id, v_staff.full_name, p_requester_staff_id, p_requester_name,
    p_terminal_id, p_reason_code, p_reason_text, p_amount, p_entity, p_entity_id)
  RETURNING id INTO v_auth_id;

  RETURN jsonb_build_object('ok', true, 'authorization_id', v_auth_id,
    'supervisor_staff_id', v_staff.id, 'supervisor_name', v_staff.full_name,
    'expires_in_seconds', 300);
END
$fn$;

-- crypt() y gen_salt() viven en el esquema extensions: con search_path = public
-- el PIN nunca se podía fijar ni verificar (hoy hay 0 empleados con PIN).
ALTER FUNCTION public.verify_staff_pin(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.set_staff_pin(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.pos_verify_supervisor_pin(uuid, text, text, text, numeric, text, uuid, text, uuid, text)
  SET search_path = public, extensions;

-- ───────────────────── B-01 · funciones que verifican poco ─────────────────────

-- Auditoría del POS: solo escribe quien es del equipo de ese restaurante.
CREATE OR REPLACE FUNCTION public.pos_log_audit(
  p_user_id uuid, p_entity text, p_action text, p_entity_id uuid DEFAULT NULL::uuid,
  p_actor_staff_id uuid DEFAULT NULL::uuid, p_actor_name text DEFAULT NULL::text,
  p_actor_role text DEFAULT NULL::text, p_supervisor_staff_id uuid DEFAULT NULL::uuid,
  p_supervisor_name text DEFAULT NULL::text, p_authorization_id uuid DEFAULT NULL::uuid,
  p_session_id uuid DEFAULT NULL::uuid, p_terminal_id text DEFAULT NULL::text,
  p_reason text DEFAULT NULL::text, p_amount numeric DEFAULT NULL::numeric,
  p_before jsonb DEFAULT NULL::jsonb, p_after jsonb DEFAULT NULL::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL
     OR p_user_id NOT IN (SELECT public.team_owner_ids(ARRAY['pos', 'pos_audit'], 'read')) THEN
    RAISE EXCEPTION 'No autorizado para registrar auditoría de este restaurante'
      USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.pos_audit_log (
    user_id, session_id, terminal_id, actor_staff_id, actor_user_id, actor_name, actor_role,
    supervisor_staff_id, supervisor_name, authorization_id, entity, entity_id, action, reason,
    amount, before, after, metadata)
  VALUES (p_user_id, p_session_id, p_terminal_id, p_actor_staff_id, auth.uid(), p_actor_name,
    p_actor_role, p_supervisor_staff_id, p_supervisor_name, p_authorization_id, p_entity,
    p_entity_id, p_action, p_reason, p_amount, p_before, p_after, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END
$fn$;

-- Solo responde por uno mismo (lo usa el trigger que asigna el dueño).
CREATE OR REPLACE FUNCTION public.team_member_owner_id(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT b.owner_id
    FROM restaurant_team_members m
    JOIN restaurant_businesses b ON b.id = m.business_id
   WHERE m.user_id = _uid AND m.status = 'active'
     AND (auth.uid() IS NULL OR _uid = auth.uid())
     AND NOT EXISTS (SELECT 1 FROM restaurant_businesses o WHERE o.owner_id = _uid)
   ORDER BY m.created_at
   LIMIT 1
$fn$;

-- ─────────────────────── B-01b · lealtad pública ───────────────────────

-- Correo y teléfono enmascarados: el código de lealtad no debe bastar para
-- obtener los datos de contacto completos de un cliente.
CREATE OR REPLACE FUNCTION public._mask_email(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE WHEN p IS NULL OR position('@' in p) = 0 THEN NULL
    ELSE left(p, 1) || '***' || substr(p, position('@' in p)) END
$fn$;

CREATE OR REPLACE FUNCTION public._mask_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE WHEN p IS NULL OR length(regexp_replace(p, '\D', '', 'g')) < 4 THEN NULL
    ELSE '*** ' || right(regexp_replace(p, '\D', '', 'g'), 4) END
$fn$;

-- Perfil público por código: lo que muestra /mi-fidelidad/:codigo.
CREATE OR REPLACE FUNCTION public.public_loyalty_profile(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  c loyalty_customers;
  v_tier jsonb;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 6 THEN RETURN NULL; END IF;
  SELECT * INTO c FROM loyalty_customers
   WHERE loyalty_code = upper(trim(p_code)) AND coalesce(is_active, true)
   LIMIT 1;
  IF c.id IS NULL THEN RETURN NULL; END IF;

  SELECT to_jsonb(t) INTO v_tier FROM loyalty_tiers t WHERE t.id = c.tier_id;

  RETURN jsonb_build_object(
    'customer', jsonb_build_object(
      'id', c.id, 'customer_name', c.customer_name,
      'customer_email', public._mask_email(c.customer_email),
      'customer_phone', public._mask_phone(c.customer_phone),
      'current_points', c.current_points, 'lifetime_points', c.lifetime_points,
      'total_spent', c.total_spent, 'total_orders', c.total_orders,
      'tier_id', c.tier_id, 'loyalty_code', c.loyalty_code,
      'restaurant_name', c.restaurant_name, 'user_id', c.user_id, 'tier', v_tier),
    'allTiers', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.min_points)
                            FROM loyalty_tiers t WHERE t.user_id = c.user_id), '[]'::jsonb),
    'transactions', coalesce((SELECT jsonb_agg(jsonb_build_object(
                                'id', x.id, 'points', x.points, 'transaction_type', x.transaction_type,
                                'description', x.description, 'created_at', x.created_at)
                                ORDER BY x.created_at DESC)
                              FROM (SELECT * FROM loyalty_points_transactions
                                     WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 20) x),
                             '[]'::jsonb),
    'catalog', coalesce((SELECT jsonb_agg(to_jsonb(r))
                           FROM loyalty_rewards_catalog r
                          WHERE r.user_id = c.user_id AND coalesce(r.is_active, true)
                            AND (r.min_tier_id IS NULL OR r.min_tier_id = c.tier_id)), '[]'::jsonb),
    'redeemed', coalesce((SELECT jsonb_agg(jsonb_build_object(
                            'id', x.id, 'status', x.status, 'redeemed_at', x.redeemed_at,
                            'expires_at', x.expires_at, 'redemption_code', x.redemption_code,
                            'reward', CASE WHEN cat.id IS NULL THEN NULL ELSE jsonb_build_object(
                              'name', cat.name, 'reward_type', cat.reward_type,
                              'reward_value', cat.reward_value) END)
                            ORDER BY x.created_at DESC)
                          FROM (SELECT * FROM loyalty_rewards WHERE customer_id = c.id
                                 ORDER BY created_at DESC LIMIT 10) x
                          LEFT JOIN loyalty_rewards_catalog cat ON cat.id = x.catalog_item_id),
                         '[]'::jsonb),
    'achievements', coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.threshold)
                                FROM loyalty_achievements a
                               WHERE a.user_id = c.user_id AND coalesce(a.is_active, true)), '[]'::jsonb),
    'unlocked', coalesce((SELECT jsonb_agg(jsonb_build_object(
                            'id', u.id, 'achievement_id', u.achievement_id,
                            'unlocked_at', u.unlocked_at, 'points_awarded', u.points_awarded))
                          FROM loyalty_customer_achievements u WHERE u.customer_id = c.id), '[]'::jsonb)
  );
END
$fn$;

-- Búsqueda por correo o teléfono exactos (/mi-fidelidad). No lista nada parcial.
CREATE OR REPLACE FUNCTION public.public_loyalty_find(p_value text, p_type text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v text := lower(trim(coalesce(p_value, '')));
BEGIN
  IF p_type = 'email' AND (position('@' in v) < 2 OR length(v) < 6) THEN RETURN '[]'::jsonb; END IF;
  IF p_type = 'phone' AND length(regexp_replace(v, '\D', '', 'g')) < 7 THEN RETURN '[]'::jsonb; END IF;
  IF p_type NOT IN ('email', 'phone') THEN RETURN '[]'::jsonb; END IF;

  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', c.id, 'customer_name', c.customer_name,
      'customer_email', public._mask_email(c.customer_email),
      'customer_phone', public._mask_phone(c.customer_phone),
      'current_points', c.current_points, 'lifetime_points', c.lifetime_points,
      'total_spent', c.total_spent, 'total_orders', c.total_orders,
      'loyalty_code', c.loyalty_code, 'restaurant_name', c.restaurant_name, 'user_id', c.user_id,
      'tier', (SELECT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color,
                                         'min_points', t.min_points)
                 FROM loyalty_tiers t WHERE t.id = c.tier_id)))
      FROM loyalty_customers c
     WHERE coalesce(c.is_active, true)
       AND CASE WHEN p_type = 'email' THEN lower(c.customer_email) = v
                ELSE regexp_replace(coalesce(c.customer_phone, ''), '\D', '', 'g')
                     = regexp_replace(v, '\D', '', 'g') END
     LIMIT 20), '[]'::jsonb);
END
$fn$;

-- Canje desde el portal público, autorizado por el código de lealtad.
CREATE OR REPLACE FUNCTION public.public_loyalty_redeem(p_code text, p_catalog_item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v_cust loyalty_customers;
  v_item loyalty_rewards_catalog;
  v_code text;
  v_reward_id uuid;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_cust FROM loyalty_customers
   WHERE loyalty_code = upper(trim(coalesce(p_code, ''))) AND coalesce(is_active, true)
   FOR UPDATE;
  IF v_cust.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Código no encontrado');
  END IF;
  SELECT * INTO v_item FROM loyalty_rewards_catalog
   WHERE id = p_catalog_item_id AND user_id = v_cust.user_id FOR UPDATE;
  IF v_item.id IS NULL OR coalesce(v_item.is_active, true) = false THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Recompensa no disponible');
  END IF;
  IF v_item.min_tier_id IS NOT NULL AND v_item.min_tier_id IS DISTINCT FROM v_cust.tier_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Recompensa de otro nivel');
  END IF;
  IF v_item.valid_from IS NOT NULL AND v_item.valid_from > now() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Recompensa aún no válida');
  END IF;
  IF v_item.valid_until IS NOT NULL AND v_item.valid_until < now() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Recompensa expirada');
  END IF;
  IF coalesce(v_cust.current_points, 0) < v_item.points_required THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Puntos insuficientes');
  END IF;
  IF v_item.stock_limit IS NOT NULL AND coalesce(v_item.stock_used, 0) >= v_item.stock_limit THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sin existencias de la recompensa');
  END IF;

  BEGIN
    v_code := public.generate_redemption_code();
  EXCEPTION WHEN OTHERS THEN
    v_code := 'RW' || upper(substr(md5(random()::text), 1, 8));
  END;
  v_new_balance := v_cust.current_points - v_item.points_required;

  INSERT INTO loyalty_rewards (user_id, customer_id, catalog_item_id, points_spent,
                               redemption_code, status, expires_at)
  VALUES (v_cust.user_id, v_cust.id, v_item.id, v_item.points_required, v_code, 'pending',
          now() + interval '30 days')
  RETURNING id INTO v_reward_id;
  UPDATE loyalty_customers SET current_points = v_new_balance, updated_at = now()
   WHERE id = v_cust.id;
  INSERT INTO loyalty_points_transactions (user_id, customer_id, points, transaction_type,
                                           source, source_id, description, balance_after)
  VALUES (v_cust.user_id, v_cust.id, -v_item.points_required, 'redeem', 'reward_redemption',
          v_reward_id, 'Canje: ' || v_item.name, v_new_balance);
  IF v_item.stock_limit IS NOT NULL THEN
    UPDATE loyalty_rewards_catalog SET stock_used = coalesce(stock_used, 0) + 1, updated_at = now()
     WHERE id = v_item.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'redemption_code', v_code,
    'expires_at', now() + interval '30 days', 'new_balance', v_new_balance);
END
$fn$;

-- Después de enviar una reseña pública: cuenta la respuesta de la campaña y da
-- los puntos de bono (4 estrellas 15, 5 estrellas 25), una sola vez y solo en
-- los 10 minutos siguientes a la reseña. Antes lo hacía el navegador con
-- escrituras directas que dejaban a cualquiera sumarse puntos.
CREATE OR REPLACE FUNCTION public.public_feedback_after_submit(p_feedback_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  f customer_feedback;
  c loyalty_customers;
  v_bonus int;
  v_new numeric;
BEGIN
  SELECT * INTO f FROM customer_feedback
   WHERE id = p_feedback_id AND created_at > now() - interval '10 minutes';
  IF f.id IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;

  -- Una sola vez por reseña
  IF EXISTS (SELECT 1 FROM loyalty_points_transactions
              WHERE source = 'feedback' AND source_id = f.id) THEN
    RETURN jsonb_build_object('ok', true, 'points', 0);
  END IF;

  IF f.campaign_id IS NOT NULL THEN
    UPDATE feedback_campaigns SET responses_count = coalesce(responses_count, 0) + 1
     WHERE id = f.campaign_id AND user_id = f.user_id;
  END IF;

  IF coalesce(f.rating, 0) < 4 OR f.customer_email IS NULL OR f.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'points', 0);
  END IF;
  v_bonus := CASE WHEN f.rating = 5 THEN 25 ELSE 15 END;

  SELECT * INTO c FROM loyalty_customers
   WHERE user_id = f.user_id AND lower(customer_email) = lower(f.customer_email)
   ORDER BY created_at LIMIT 1 FOR UPDATE;

  IF c.id IS NULL THEN
    INSERT INTO loyalty_customers (user_id, customer_name, customer_email,
                                   current_points, lifetime_points)
    VALUES (f.user_id, coalesce(f.customer_name, 'Cliente'), lower(f.customer_email),
            v_bonus, v_bonus)
    RETURNING * INTO c;
    v_new := v_bonus;
  ELSE
    v_new := coalesce(c.current_points, 0) + v_bonus;
    UPDATE loyalty_customers
       SET current_points = v_new, lifetime_points = coalesce(lifetime_points, 0) + v_bonus
     WHERE id = c.id;
  END IF;

  INSERT INTO loyalty_points_transactions (user_id, customer_id, points, transaction_type,
                                           source, source_id, description, balance_after)
  VALUES (f.user_id, c.id, v_bonus, 'bonus', 'feedback', f.id,
          '+' || v_bonus || ' pts por reseña de ' || f.rating || ' estrellas', v_new);

  RETURN jsonb_build_object('ok', true, 'points', v_bonus, 'loyalty_code', c.loyalty_code);
END
$fn$;

-- Las políticas que dejaban a cualquiera leer y cambiar la lealtad de todos.
DROP POLICY IF EXISTS "Public can read loyalty customers by code" ON public.loyalty_customers;
DROP POLICY IF EXISTS "Public can update own points via loyalty_code" ON public.loyalty_customers;
DROP POLICY IF EXISTS "Public can read loyalty transactions by customer" ON public.loyalty_points_transactions;
DROP POLICY IF EXISTS "Public can create redemption transactions" ON public.loyalty_points_transactions;
DROP POLICY IF EXISTS "Public can read loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Public can redeem rewards with valid customer" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Public can read customer achievements" ON public.loyalty_customer_achievements;

-- ─────────────────────── B-01 · permisos de ejecución ───────────────────────

-- 1) Ninguna SECURITY DEFINER de public queda para anónimos, salvo las que
--    sirven a páginas públicas a propósito.
DO $do$
DECLARE
  r record;
  v_public constant text[] := ARRAY[
    'public_create_reservation', 'public_loyalty_profile', 'public_loyalty_find',
    'public_loyalty_redeem', 'public_feedback_after_submit'];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn, p.proname
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
  LOOP
    IF r.proname = ANY (v_public) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', r.fn);
    ELSE
      -- Quien tenía el permiso solo por PUBLIC lo conserva de forma explícita.
      IF has_function_privilege('authenticated', r.fn, 'EXECUTE') THEN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.fn);
      END IF;
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.fn);
    END IF;
  END LOOP;
END
$do$;

-- 2) Las que solo usan triggers, otras funciones o el service role tampoco
--    quedan para usuarios con sesión.
DO $do$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
       AND (p.prorettype = 'trigger'::regtype
            OR p.proname IN ('match_knowledge', 'process_order_inventory_deduction',
                             'reverse_order_inventory_deduction', 'recompute_loyalty_customer_for',
                             'seed_system_roles_for_business'))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.fn);
  END LOOP;
END
$do$;

-- ───────────────────────────── limpieza ─────────────────────────────

SELECT cron.unschedule('purge_pos_pin_attempts')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_pos_pin_attempts');
SELECT cron.schedule('purge_pos_pin_attempts', '35 3 * * *',
  $$DELETE FROM public.pos_pin_attempts WHERE created_at < now() - interval '30 days'$$);
