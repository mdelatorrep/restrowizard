-- C-09 domicilio, C-14 fidelización por restaurante y B-14 (Rappi con firma).

-- 1. Fidelización: inscripción del comensal desde el sitio del restaurante ----
ALTER TABLE public.loyalty_customers
  ADD COLUMN IF NOT EXISTS data_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrolled_via text;

COMMENT ON COLUMN public.loyalty_customers.data_consent_at IS
  'Momento en que el titular autorizó el tratamiento de sus datos (Ley 1581). Nulo en clientes cargados por el restaurante.';

-- Inscribe al comensal en el programa del restaurante del slug. Devuelve el
-- código solo si la inscripción es nueva: si el teléfono ya estaba inscrito no
-- lo revela (quien conozca un teléfono no debe poder ver ni canjear puntos ajenos).
CREATE OR REPLACE FUNCTION public.public_loyalty_enroll(
  p_slug text, p_name text, p_phone text, p_email text DEFAULT NULL, p_consent boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_name text := left(btrim(coalesce(p_name, '')), 100);
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_code text;
  v_tier uuid;
  v_recent int;
BEGIN
  IF NOT coalesce(p_consent, false) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Debes autorizar el tratamiento de tus datos para inscribirte.');
  END IF;
  IF length(v_name) < 2 OR length(v_phone) NOT BETWEEN 7 AND 15 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Revisa tu nombre y tu número de celular.');
  END IF;
  IF v_email IS NOT NULL AND v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    v_email := NULL;
  END IF;

  SELECT w.user_id INTO v_owner
    FROM restaurant_websites w
   WHERE w.slug = p_slug AND w.is_published AND w.show_loyalty;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Este restaurante no tiene programa de fidelidad.');
  END IF;

  -- Freno contra inscripciones masivas: 30 por restaurante por hora.
  SELECT count(*) INTO v_recent FROM loyalty_customers
   WHERE user_id = v_owner AND enrolled_via = 'website' AND created_at > now() - interval '1 hour';
  IF v_recent >= 30 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Hay muchas inscripciones en este momento. Intenta en unos minutos.');
  END IF;

  IF EXISTS (SELECT 1 FROM loyalty_customers WHERE user_id = v_owner AND customer_phone = v_phone) THEN
    RETURN jsonb_build_object('status', 'exists',
      'message', 'Este celular ya está inscrito. Pide tu código en el restaurante o búscalo en Mis programas de fidelidad.');
  END IF;

  SELECT id INTO v_tier FROM loyalty_tiers
   WHERE user_id = v_owner AND is_active ORDER BY min_points, sort_order LIMIT 1;

  INSERT INTO loyalty_customers (user_id, customer_name, customer_phone, customer_email, tier_id,
                                 data_consent_at, enrolled_via, restaurant_name)
  VALUES (v_owner, v_name, v_phone,
          CASE WHEN EXISTS (SELECT 1 FROM loyalty_customers WHERE user_id = v_owner AND customer_email = v_email)
               THEN NULL ELSE v_email END,
          v_tier, now(), 'website',
          (SELECT site_title FROM restaurant_websites WHERE slug = p_slug))
  RETURNING loyalty_code INTO v_code;

  RETURN jsonb_build_object('status', 'created', 'code', v_code);
END;
$$;
REVOKE ALL ON FUNCTION public.public_loyalty_enroll(text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_loyalty_enroll(text, text, text, text, boolean) TO anon, authenticated, service_role;

-- 2. Demo: domicilio y fidelización activos con catálogo -------------------
-- Corre después de seed_demo_restaurant() (que reconstruye la demo cada día).
CREATE OR REPLACE FUNCTION public.seed_demo_extras()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_owner constant uuid := (SELECT user_id FROM restaurant_websites WHERE slug = 'clutch-sports-bar');
  v_bronze uuid;
BEGIN
  IF c_owner IS NULL THEN
    RETURN jsonb_build_object('status', 'sin demo');
  END IF;

  UPDATE restaurant_websites
     SET show_delivery = true, show_loyalty = true,
         delivery_min_order = 30000,
         delivery_message = 'Pago contraentrega en efectivo, tarjeta o transferencia.'
   WHERE user_id = c_owner;

  DELETE FROM delivery_zones WHERE user_id = c_owner;
  INSERT INTO delivery_zones (user_id, zone_name, delivery_fee, min_order, estimated_time_minutes)
  VALUES (c_owner, 'Hasta 3 km', 5000, 30000, 35),
         (c_owner, 'De 3 a 6 km', 8000, 45000, 50);

  DELETE FROM loyalty_rewards WHERE user_id = c_owner;
  DELETE FROM loyalty_rewards_catalog WHERE user_id = c_owner;
  UPDATE loyalty_customers SET tier_id = NULL WHERE user_id = c_owner;
  DELETE FROM loyalty_tiers WHERE user_id = c_owner;

  INSERT INTO loyalty_tiers (user_id, name, min_points, points_multiplier, color, sort_order)
  VALUES (c_owner, 'Hincha', 0, 1.00, '#9CA3AF', 0)
  RETURNING id INTO v_bronze;
  INSERT INTO loyalty_tiers (user_id, name, min_points, points_multiplier, color, sort_order)
  VALUES (c_owner, 'Titular', 1500, 1.25, '#3B82F6', 1),
         (c_owner, 'Capitán', 5000, 1.50, '#F59E0B', 2);
  UPDATE loyalty_customers SET tier_id = v_bronze WHERE user_id = c_owner;

  INSERT INTO loyalty_rewards_catalog (user_id, name, description, points_required, reward_type, reward_value, sort_order)
  VALUES (c_owner, 'Cerveza artesanal', 'Una pinta de la casa en tu próxima visita.', 300, 'free_item', 14000, 0),
         (c_owner, 'Alitas x6', 'Porción de alitas con la salsa que elijas.', 600, 'free_item', 26000, 1),
         (c_owner, '15 % en tu cuenta', 'Descuento sobre el total de una cuenta, días de partido incluidos.', 1000, 'discount_percent', 15, 2),
         (c_owner, 'Mesa reservada para la final', 'Mesa para 6 frente a la pantalla principal.', 2500, 'experience', NULL, 3);

  RETURN jsonb_build_object('status', 'ok', 'zones', 2, 'tiers', 3, 'rewards', 4);
END;
$$;
REVOKE ALL ON FUNCTION public.seed_demo_extras() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_extras() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'demo-restaurant-reset';
  PERFORM cron.schedule('demo-restaurant-reset', '5 9 * * *',
    'SELECT public.seed_demo_restaurant(); SELECT public.seed_demo_extras();');
END $$;

-- 3. B-14: una integración de Rappi activa exige secreto de webhook -------
ALTER TABLE public.aggregator_integrations
  DROP CONSTRAINT IF EXISTS rappi_active_requires_webhook_secret;
ALTER TABLE public.aggregator_integrations
  ADD CONSTRAINT rappi_active_requires_webhook_secret
  CHECK (platform::text <> 'rappi' OR NOT coalesce(is_active, false) OR nullif(webhook_secret, '') IS NOT NULL);
