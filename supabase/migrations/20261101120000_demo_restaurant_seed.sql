-- Restaurante demo: "Clutch Sports Bar & Grill" (ficticio, Laureles, Medellín).
-- Estructura de un sports bar americano: servicio a la mesa, barra, cocina,
-- demanda movida por el calendario deportivo, propinas repartidas por cargo.
--
-- Tres cuentas públicas de demo (una por rol). Todo se reconstruye cada noche
-- (pg_cron 04:05 Bogotá) y cada hora se simulan las ventas de la hora anterior,
-- para que el tablero de "hoy" nunca esté vacío.
--
-- Cuentas (contraseña DemoRestro2026):
--   demo.dueno@restrowizard.app    · Dueño
--   demo.gerente@restrowizard.app  · Gerente
--   demo.cajero@restrowizard.app   · Cajero

CREATE OR REPLACE FUNCTION public.demo_owner_id()
RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'de300000-0000-4000-8000-000000000001'::uuid $$;

CREATE OR REPLACE FUNCTION public.is_demo_user(_uid uuid)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT _uid IN ('de300000-0000-4000-8000-000000000001'::uuid,
                  'de300000-0000-4000-8000-000000000002'::uuid,
                  'de300000-0000-4000-8000-000000000003'::uuid);
$$;
GRANT EXECUTE ON FUNCTION public.is_demo_user(uuid) TO anon, authenticated;

-- Tablas internas del simulador (sin políticas: invisibles para los clientes)
CREATE TABLE IF NOT EXISTS public._demo_menu_weights (id uuid PRIMARY KEY, name text, category text,
                                                      price numeric, weight numeric, is_brunch_only boolean);
ALTER TABLE public._demo_menu_weights ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public._demo_customers (name text, phone text PRIMARY KEY, affinity numeric);
ALTER TABLE public._demo_customers ENABLE ROW LEVEL SECURITY;

-- ─── Usuarios de autenticación ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._demo_upsert_auth_user(_id uuid, _email text, _name text, _type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth', 'extensions' AS $$
DECLARE
  v_hash text := extensions.crypt('DemoRestro2026', extensions.gen_salt('bf'));
  v_meta jsonb := jsonb_build_object('full_name', _name, 'user_type', _type, 'is_demo', true);
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change,
                          email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  VALUES ('00000000-0000-0000-0000-000000000000', _id, 'authenticated', 'authenticated', _email, v_hash, now(),
          '{"provider":"email","providers":["email"]}'::jsonb, v_meta, now(), now(),
          '', '', '', '', '', '', '', '')
  ON CONFLICT (id) DO UPDATE
    SET encrypted_password = EXCLUDED.encrypted_password,   -- por si alguien la cambió
        email = EXCLUDED.email,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        banned_until = NULL,
        updated_at = now();

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
  VALUES (_id, _id, _id::text, 'email',
          jsonb_build_object('sub', _id::text, 'email', _email, 'email_verified', true), now(), now(), now())
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.profiles (user_id, full_name, user_type)
  VALUES (_id, _name, _type)
  ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, user_type = EXCLUDED.user_type;
END $$;

-- ─── Curva de demanda del demo (órdenes esperadas en una hora operativa) ─────
-- p_hr va de 6 a 29 (las 24-29 son la madrugada del día siguiente).
CREATE OR REPLACE FUNCTION public._demo_expected_orders(p_day date, p_hr integer)
RETURNS numeric LANGUAGE plpgsql STABLE SET search_path TO 'public' AS $$
DECLARE
  v_dow int := EXTRACT(ISODOW FROM p_day);
  v_daily numeric;
  v_open int; v_close int;
  v_w numeric; v_sum numeric := 0;
  v_lift numeric := 1;
  h int;
BEGIN
  -- Mesas por día (antes de partidos): un sports bar grande pero no lleno todos los días
  v_daily := CASE v_dow WHEN 1 THEN 25 WHEN 2 THEN 24 WHEN 3 THEN 36 WHEN 4 THEN 40
                        WHEN 5 THEN 65 WHEN 6 THEN 80 ELSE 67 END;
  v_open  := CASE WHEN v_dow IN (6, 7) THEN 10 ELSE 13 END;
  v_close := CASE WHEN v_dow IN (1, 2, 7) THEN 24 ELSE 26 END;   -- cierre: 12 a.m. o 2 a.m.
  IF p_hr < v_open OR p_hr >= v_close THEN RETURN 0; END IF;

  FOR h IN v_open .. v_close - 1 LOOP
    v_sum := v_sum + CASE
      WHEN h < 13 THEN 5            -- brunch de fin de semana
      WHEN h < 17 THEN CASE WHEN v_dow IN (6, 7) THEN 5 ELSE 2 END
      WHEN h = 17 THEN 5 WHEN h = 18 THEN 8 WHEN h = 19 THEN 11 WHEN h = 20 THEN 12
      WHEN h = 21 THEN 11 WHEN h = 22 THEN 9 WHEN h = 23 THEN 6 WHEN h = 24 THEN 4 ELSE 2 END;
  END LOOP;
  v_w := CASE
      WHEN p_hr < 13 THEN 5
      WHEN p_hr < 17 THEN CASE WHEN v_dow IN (6, 7) THEN 5 ELSE 2 END
      WHEN p_hr = 17 THEN 5 WHEN p_hr = 18 THEN 8 WHEN p_hr = 19 THEN 11 WHEN p_hr = 20 THEN 12
      WHEN p_hr = 21 THEN 11 WHEN p_hr = 22 THEN 9 WHEN p_hr = 23 THEN 6 WHEN p_hr = 24 THEN 4 ELSE 2 END;

  -- Partidos: el pico va desde una hora antes del inicio hasta tres después.
  SELECT COALESCE(MAX(CASE
           WHEN e.start_time IS NULL THEN e.expected_lift
           WHEN p_hr BETWEEN EXTRACT(HOUR FROM e.start_time)::int - 1 + CASE WHEN EXTRACT(HOUR FROM e.start_time) < 6 THEN 24 ELSE 0 END
                         AND EXTRACT(HOUR FROM e.start_time)::int + 3 + CASE WHEN EXTRACT(HOUR FROM e.start_time) < 6 THEN 24 ELSE 0 END
             THEN e.expected_lift
           ELSE 1 + (e.expected_lift - 1) * 0.25 END), 1)
    INTO v_lift
  FROM demand_events e WHERE e.user_id = demo_owner_id() AND e.event_date = p_day;

  RETURN v_daily * v_w / NULLIF(v_sum, 0) * v_lift;
END $$;

-- ─── Generador de ventas (sirve para 90 días o para la última hora) ──────────
CREATE OR REPLACE FUNCTION public._demo_generate_orders(p_from timestamptz, p_to timestamptz)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  c_owner uuid := demo_owner_id();
  v_count integer;
BEGIN
  PERFORM set_config('app.demo_seeding', 'on', true);

  -- Huecos horarios del rango (en hora local), con su día operativo.
  DROP TABLE IF EXISTS _slots;
  CREATE TEMP TABLE _slots ON COMMIT DROP AS
  SELECT ts AS slot_start,
         ((ts AT TIME ZONE 'America/Bogota') - interval '6 hours')::date AS bday,
         EXTRACT(HOUR FROM (ts AT TIME ZONE 'America/Bogota') - interval '6 hours')::int + 6 AS hr
  FROM generate_series(date_trunc('hour', p_from), p_to - interval '1 hour', interval '1 hour') ts;

  DROP TABLE IF EXISTS _new_orders;
  CREATE TEMP TABLE _new_orders ON COMMIT DROP AS
  SELECT gen_random_uuid() AS id,
         s.bday, s.hr,
         s.slot_start + (random() * interval '58 minutes') AS created_at,
         (1 + floor(random() * 4))::int + CASE WHEN random() < 0.2 THEN 2 ELSE 0 END AS guests,
         (2 + floor(random() * 3))::int AS nlines,
         (s.hr < 13) AS is_brunch
  FROM _slots s
  CROSS JOIN LATERAL generate_series(1, GREATEST(0, round(
      _demo_expected_orders(s.bday, s.hr) * (0.8 + random() * 0.4)))::int) g;

  -- Líneas de la orden: elección ponderada por popularidad.
  DROP TABLE IF EXISTS _lines;
  CREATE TEMP TABLE _lines ON COMMIT DROP AS
  SELECT o.id AS order_id, m.id AS menu_item_id, m.name, m.price,
         (CASE WHEN m.category IN ('Cervezas','Sin alcohol') AND random() < 0.45 THEN 2 ELSE 1 END)
           + CASE WHEN o.guests >= 4 AND m.category IN ('Cervezas','Cócteles') THEN 1 ELSE 0 END AS qty
  FROM _new_orders o
  CROSS JOIN LATERAL generate_series(1, o.nlines + CASE WHEN o.guests >= 4 THEN 2 ELSE 0 END) g
  CROSS JOIN LATERAL (
    SELECT w.id, w.name, w.price, w.category
    FROM _demo_menu_weights w
    WHERE w.is_brunch_only = false OR o.is_brunch
    ORDER BY -ln(random() + g * 0 + 1e-9) / w.weight   -- muestreo ponderado (exponencial)
    LIMIT 1
  ) m;

  -- Mesero en turno ese día y a esa hora (si no hay, la venta va al fondo común).
  DROP TABLE IF EXISTS _waiter_pick;
  CREATE TEMP TABLE _waiter_pick ON COMMIT DROP AS
  SELECT o.id AS order_id,
         (SELECT s.staff_member_id FROM staff_shifts s
           JOIN staff_members sm ON sm.id = s.staff_member_id
          WHERE s.user_id = c_owner AND s.shift_date = o.bday AND sm.position = 'Mesero'
            AND COALESCE(s.status, 'scheduled') NOT IN ('cancelled','no_show')
            AND o.hr >= EXTRACT(HOUR FROM s.start_time)::int
            AND o.hr < EXTRACT(HOUR FROM s.end_time)::int + CASE WHEN s.end_time <= s.start_time THEN 24 ELSE 0 END
          ORDER BY random() + length(o.id::text) * 0
          LIMIT 1) AS waiter_id
  FROM _new_orders o;

  INSERT INTO restaurant_orders (
    id, user_id, source, order_type, status, items, subtotal, total, tax_amount, tax,
    tip_amount, tip_percent, guests_count, payment_method, payment_status, created_at, updated_at,
    completed_at, waiter_id, waiter_name, is_pos_order, sales_channel, kitchen_status,
    customer_name, customer_phone, table_id)
  SELECT o.id, c_owner, 'pos', 'dine_in', 'completed',
         l.items, l.subtotal,
         l.subtotal + tip.amount,
         round(l.subtotal * 8 / 108), round(l.subtotal * 8 / 108),
         tip.amount, CASE WHEN tip.amount > 0 THEN 10 ELSE 0 END,
         o.guests, pm.method, 'paid', o.created_at, o.created_at,
         o.created_at + interval '75 minutes', wp.waiter_id, sm.name, true, 'pos', 'served',
         cust.name, cust.phone,
         (SELECT t.id FROM restaurant_tables t WHERE t.user_id = c_owner
           ORDER BY random() + length(o.id::text) * 0 LIMIT 1)
  FROM _new_orders o
  JOIN (SELECT order_id,
               jsonb_agg(jsonb_build_object('menu_item_id', menu_item_id, 'name', name, 'quantity', qty,
                                            'unit_price', price, 'price', price, 'total', price * qty)) AS items,
               SUM(price * qty) AS subtotal
        FROM _lines GROUP BY order_id) l ON l.order_id = o.id
  LEFT JOIN _waiter_pick wp ON wp.order_id = o.id
  LEFT JOIN staff_members sm ON sm.id = wp.waiter_id
  CROSS JOIN LATERAL (SELECT CASE WHEN random() + length(o.id::text) * 0 < 0.82
                             THEN round(l.subtotal * 0.10 / 100) * 100 ELSE 0 END AS amount) tip
  CROSS JOIN LATERAL (SELECT CASE WHEN r < 0.34 THEN 'Tarjeta crédito' WHEN r < 0.62 THEN 'Tarjeta débito'
                                  WHEN r < 0.80 THEN 'Efectivo' WHEN r < 0.94 THEN 'Nequi' ELSE 'QR Bancolombia' END AS method
                      FROM (SELECT random() + length(o.id::text) * 0 AS r) x) pm
  -- 28% de las mesas deja su WhatsApp: la base de clientes conocidos
  CROSS JOIN LATERAL (SELECT random() + length(o.id::text) * 0 AS r) cr
  LEFT JOIN LATERAL (
    SELECT c.name, c.phone FROM _demo_customers c
    ORDER BY -ln(random() + length(o.id::text) * 0 + 1e-9) / c.affinity LIMIT 1
  ) cust ON cr.r < 0.28;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Caja: una sesión por día operativo
  INSERT INTO pos_sessions (user_id, cashier_name, terminal_id, opened_at, closed_at, opening_cash,
                            status, sales_count, total_sales, total_tips)
  SELECT c_owner, 'Laura Gómez', 'CAJA-1',
         (d.bday::timestamp + time '11:30') AT TIME ZONE 'America/Bogota',
         CASE WHEN d.bday < ((now() AT TIME ZONE 'America/Bogota') - interval '6 hours')::date
              THEN (d.bday::timestamp + interval '26 hours 30 minutes') AT TIME ZONE 'America/Bogota' END,
         400000,
         CASE WHEN d.bday < ((now() AT TIME ZONE 'America/Bogota') - interval '6 hours')::date THEN 'closed' ELSE 'open' END,
         0, 0, 0
  FROM (SELECT DISTINCT bday FROM _new_orders) d
  WHERE NOT EXISTS (
    SELECT 1 FROM pos_sessions ps WHERE ps.user_id = c_owner
      AND ((ps.opened_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date = d.bday);

  UPDATE restaurant_orders o
     SET session_id = ps.id
    FROM pos_sessions ps, _new_orders n
   WHERE o.id = n.id AND ps.user_id = c_owner
     AND ((ps.opened_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date = n.bday;

  INSERT INTO pos_transactions (session_id, order_id, transaction_type, payment_method_name, amount,
                                tip_amount, status, processed_at, processed_by)
  SELECT o.session_id, o.id, 'sale', o.payment_method, o.total, o.tip_amount, 'completed',
         o.created_at + interval '70 minutes', 'Laura Gómez'
  FROM restaurant_orders o JOIN _new_orders n ON n.id = o.id;

  UPDATE pos_sessions ps
     SET sales_count = x.n, total_sales = x.sales, total_tips = x.tips,
         expected_cash = 400000 + x.cash,
         -- algunos cierres con descuadre pequeño: la auditoría de caja tiene qué mostrar
         actual_cash = CASE WHEN ps.status = 'closed'
                            THEN 400000 + x.cash - CASE WHEN random() < 0.15 THEN round(random() * 30) * 1000 ELSE 0 END END
    FROM (SELECT session_id, COUNT(*) n, SUM(total - COALESCE(tip_amount, 0)) sales,
                 SUM(COALESCE(tip_amount, 0)) tips,
                 SUM(CASE WHEN payment_method = 'Efectivo' THEN total ELSE 0 END) cash
          FROM restaurant_orders WHERE user_id = c_owner GROUP BY session_id) x
   WHERE ps.id = x.session_id AND ps.user_id = c_owner
     AND ps.id IN (SELECT DISTINCT o.session_id FROM restaurant_orders o JOIN _new_orders n ON n.id = o.id);
  -- Las cajas de días ya terminados se cierran (el simulador corre cada hora)
  UPDATE pos_sessions
     SET status = 'closed', closed_at = opened_at + interval '15 hours', actual_cash = expected_cash
   WHERE user_id = c_owner AND status = 'open'
     AND ((opened_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date
         < ((now() AT TIME ZONE 'America/Bogota') - interval '6 hours')::date;
  UPDATE pos_sessions SET difference = actual_cash - expected_cash
   WHERE user_id = c_owner AND status = 'closed';

  -- Costo de lo vendido: descuento de inventario por receta, con la fecha de la venta.
  INSERT INTO inventory_deductions (user_id, order_id, inventory_item_id, recipe_id, quantity_deducted, unit, deducted_at)
  SELECT c_owner, l.order_id, ri.inventory_item_id, mi.recipe_id, ri.quantity * l.qty, ri.unit, o.created_at
  FROM _lines l
  JOIN _new_orders o ON o.id = l.order_id
  JOIN menu_items mi ON mi.id = l.menu_item_id
  JOIN recipe_ingredients ri ON ri.recipe_id = mi.recipe_id AND ri.inventory_item_id IS NOT NULL;

  RETURN v_count;
END $$;

-- ─── Siembra completa ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_demo_restaurant()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  c_owner uuid := demo_owner_id();
  c_mgr   uuid := 'de300000-0000-4000-8000-000000000002';
  c_cash  uuid := 'de300000-0000-4000-8000-000000000003';
  c_biz   uuid := 'de300000-0000-4000-8000-0000000000b1';
  v_today date := ((now() AT TIME ZONE 'America/Bogota') - interval '6 hours')::date;
  v_from  date := v_today - 90;
  v_menu uuid;
  v_t record;
  v_pass int;
  v_orders int;
  v_week date;
  v_period record;
  v_mgr_staff uuid;
  v_cash_staff uuid;
BEGIN
  PERFORM set_config('app.demo_seeding', 'on', true);

  -- 1. Cuentas
  PERFORM _demo_upsert_auth_user(c_owner, 'demo.dueno@restrowizard.app', 'Andrés Restrepo', 'restaurant_owner');
  PERFORM _demo_upsert_auth_user(c_mgr,   'demo.gerente@restrowizard.app', 'Valentina Ochoa', 'restaurant_owner');
  PERFORM _demo_upsert_auth_user(c_cash,  'demo.cajero@restrowizard.app', 'Laura Gómez', 'restaurant_owner');

  -- 2. Borrar todo lo del demo (hijos primero; el resto con reintentos por FKs)
  DELETE FROM tip_periods WHERE user_id = c_owner;
  DELETE FROM inventory_deductions WHERE user_id = c_owner;
  DELETE FROM pos_transactions WHERE session_id IN (SELECT id FROM pos_sessions WHERE user_id = c_owner);
  DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM restaurant_orders WHERE user_id = c_owner);
  DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = c_owner);
  DELETE FROM recipe_menu_items WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = c_owner);
  DELETE FROM menu_items WHERE menu_id IN (SELECT id FROM restaurant_menus WHERE user_id = c_owner);
  DELETE FROM menu_categories WHERE menu_id IN (SELECT id FROM restaurant_menus WHERE user_id = c_owner);
  DELETE FROM restaurant_team_members WHERE business_id = c_biz;
  FOR v_pass IN 1..4 LOOP
    FOR v_t IN
      SELECT c.table_name FROM information_schema.columns c
      JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public' AND c.column_name = 'user_id' AND c.udt_name = 'uuid'
        AND t.table_type = 'BASE TABLE'
        AND c.table_name NOT IN ('profiles','user_roles','restaurant_team_members')
    LOOP
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE user_id IN ($1, $2, $3)', v_t.table_name)
          USING c_owner, c_mgr, c_cash;
      EXCEPTION WHEN foreign_key_violation THEN NULL;
      END;
    END LOOP;
  END LOOP;
  DELETE FROM restaurant_custom_roles WHERE business_id = c_biz;
  DELETE FROM restaurant_businesses WHERE id = c_biz OR owner_id = c_owner;

  -- 3. Negocio (el trigger siembra los roles del sistema)
  INSERT INTO restaurant_businesses (id, owner_id, name, business_type, cuisine_type, address, city, state, country,
                                     phone, employee_count, monthly_revenue_range, opening_date, tax_config, allow_oversell)
  VALUES (c_biz, c_owner, 'Clutch Sports Bar & Grill', 'bar', 'Americana · Sports bar',
          'Laureles', 'Medellín', 'Antioquia', 'Colombia', '+57 300 000 0000', 36, '200M-300M',
          v_today - 420,
          '{"type":"impoconsumo","rate":8,"included_in_price":true,"label":"Impoconsumo 8%"}'::jsonb, true);

  UPDATE profiles SET restaurant_name = 'Clutch Sports Bar & Grill' WHERE user_id IN (c_owner, c_mgr, c_cash);

  -- 4. Equipo (35 personas: dos turnos diarios de 13 horas con descanso legal)
  INSERT INTO staff_members (user_id, name, position, department, hourly_rate, hire_date, is_active,
                             max_hours_per_week, contract_type, performance_score, email, employee_id)
  SELECT c_owner, n, p, d, r, v_today - (60 + (i * 37) % 700), true, 42, ct,
         round((3.6 + ((i * 7) % 14) / 10.0)::numeric, 1),
         lower(replace(split_part(n, ' ', 1), 'á', 'a')) || '.' || i || '@clutch.demo', 'CL-' || lpad(i::text, 3, '0')
  FROM (VALUES
    (1,'Valentina Ochoa','Gerente general','Gerencia',30000,'indefinido'),
    (2,'Camilo Arango','Jefe de piso','Sala',15000,'indefinido'),
    (3,'Juliana Restrepo','Jefe de piso','Sala',14000,'indefinido'),
    (4,'Sara Montoya','Mesero','Sala',9500,'indefinido'),
    (5,'Juan Pablo Ríos','Mesero','Sala',9500,'indefinido'),
    (6,'Daniela Henao','Mesero','Sala',9500,'fijo'),
    (7,'Mateo Cardona','Mesero','Sala',9500,'fijo'),
    (8,'Isabella Zapata','Mesero','Sala',9500,'indefinido'),
    (9,'Santiago Vélez','Mesero','Sala',9500,'fijo'),
    (10,'Mariana Gil','Mesero','Sala',9500,'por horas'),
    (11,'Tomás Correa','Mesero','Sala',9500,'por horas'),
    (12,'Sofía Arbeláez','Mesero','Sala',9500,'fijo'),
    (13,'Emiliano Duque','Mesero','Sala',9500,'por horas'),
    (14,'Alejandro Mejía','Bartender','Barra',11000,'indefinido'),
    (15,'Natalia Posada','Bartender','Barra',11000,'indefinido'),
    (16,'Felipe Echeverri','Bartender','Barra',11000,'fijo'),
    (17,'Carolina Soto','Bartender','Barra',11000,'fijo'),
    (18,'Kevin Londoño','Barback','Barra',8800,'por horas'),
    (19,'Jhonatan Ríos','Barback','Barra',8800,'por horas'),
    (20,'Manuela Restrepo','Host','Sala',9000,'fijo'),
    (21,'Luisa Fernanda Toro','Host','Sala',9000,'por horas'),
    (22,'Laura Gómez','Cajero','Caja',9500,'indefinido'),
    (23,'Andrés Felipe Úsuga','Cajero','Caja',9500,'fijo'),
    (36,'Simón Herrera','Cajero','Caja',9500,'por horas'),
    (24,'Ricardo Salazar','Jefe de cocina','Cocina',22000,'indefinido'),
    (25,'Marcela Duque','Jefe de cocina','Cocina',16000,'indefinido'),
    (26,'Jhon Fredy Osorio','Cocinero de línea','Cocina',11500,'indefinido'),
    (27,'Yeison Marín','Cocinero de línea','Cocina',11500,'fijo'),
    (28,'Diana Patiño','Cocinero de línea','Cocina',11500,'fijo'),
    (29,'Cristian Bedoya','Cocinero de línea','Cocina',11500,'por horas'),
    (30,'Brayan Quintero','Auxiliar de cocina','Cocina',9000,'por horas'),
    (31,'Paola Agudelo','Auxiliar de cocina','Cocina',9000,'fijo'),
    (32,'Leidy Cano','Auxiliar de cocina','Cocina',9000,'por horas'),
    (33,'Wilmar Ruiz','Steward','Cocina',8800,'fijo'),
    (34,'Estefanía Bedoya','Steward','Cocina',8800,'por horas'),
    (35,'Óscar Pulgarín','Steward','Cocina',8800,'por horas')
  ) AS s(i, n, p, d, r, ct);

  SELECT id INTO v_mgr_staff FROM staff_members WHERE user_id = c_owner AND name = 'Valentina Ochoa';
  SELECT id INTO v_cash_staff FROM staff_members WHERE user_id = c_owner AND name = 'Laura Gómez';
  UPDATE staff_members SET linked_user_id = c_mgr, pos_role = 'supervisor' WHERE id = v_mgr_staff;
  UPDATE staff_members SET linked_user_id = c_cash, pos_role = 'cashier' WHERE id = v_cash_staff;

  INSERT INTO restaurant_team_members (business_id, user_id, staff_member_id, role, status, invited_email, claimed_at, custom_role_id)
  SELECT c_biz, u, sid, r::team_member_role, 'active', e, now(),
         (SELECT id FROM restaurant_custom_roles WHERE business_id = c_biz AND key = r)
  FROM (VALUES (c_mgr, v_mgr_staff, 'manager', 'demo.gerente@restrowizard.app'),
               (c_cash, v_cash_staff, 'cashier', 'demo.cajero@restrowizard.app')) AS t(u, sid, r, e);

  -- Reglas de propina (mismo esquema que la liquidación quincenal de un sports bar)
  INSERT INTO tip_policies (user_id, table_share_pct, pool_basis, rounding) VALUES (c_owner, 70, 'days', 100);
  INSERT INTO tip_role_weights (user_id, position, tip_group, weight, earns_table_tips) VALUES
    (c_owner, 'Mesero', 'sala', 1.0, true),
    (c_owner, 'Jefe de piso', 'sala', 1.2, false),
    (c_owner, 'Host', 'apoyo', 0.6, false),
    (c_owner, 'Bartender', 'barra', 1.0, false),
    (c_owner, 'Barback', 'barra', 0.6, false),
    (c_owner, 'Cajero', 'apoyo', 0.6, false),
    (c_owner, 'Jefe de cocina', 'cocina', 1.0, false),
    (c_owner, 'Cocinero de línea', 'cocina', 0.8, false),
    (c_owner, 'Auxiliar de cocina', 'cocina', 0.6, false),
    (c_owner, 'Steward', 'apoyo', 0.5, false),
    (c_owner, 'Gerente general', 'excluido', 0, false);

  -- Dotación: cuántas órdenes por hora atiende cada cargo
  INSERT INTO staffing_rules (user_id, position, orders_per_staff_hour, min_staff, max_staff, peak_only) VALUES
    (c_owner, 'Mesero', 3.2, 2, 7, false),
    (c_owner, 'Bartender', 9, 1, 3, false),
    (c_owner, 'Barback', 14, 0, 1, true),
    (c_owner, 'Host', 14, 1, 2, true),
    (c_owner, 'Cajero', 40, 1, 1, false),
    (c_owner, 'Jefe de piso', 100, 1, 1, true),
    (c_owner, 'Jefe de cocina', 100, 1, 1, true),
    (c_owner, 'Cocinero de línea', 6, 1, 3, false),
    (c_owner, 'Auxiliar de cocina', 11, 1, 2, false),
    (c_owner, 'Steward', 14, 1, 2, false);

  -- 5. Inventario (unidad de costo = unidad de receta: el costeo cuadra sin conversiones)
  INSERT INTO inventory_items (user_id, item_name, category, unit, unit_cost, current_stock, reorder_point,
                               par_level, min_stock_level, supplier_name, track_stock, alert_when_low, is_perishable)
  SELECT c_owner, n, c, u, cost, stock, rp, rp * 3, rp, sup, true, true, per
  FROM (VALUES
    ('Carne de res molida (blend burger)','Proteínas','kg',32000,18,8,'Carnes El Rodeo',true),
    ('Alitas de pollo','Proteínas','kg',18000,35,20,'Avícola San Cristóbal',true),
    ('Costilla de cerdo St. Louis','Proteínas','kg',26000,14,10,'Carnes El Rodeo',true),
    ('Pechuga de pollo','Proteínas','kg',19000,16,10,'Avícola San Cristóbal',true),
    ('Chorizo artesanal','Proteínas','kg',24000,6,4,'Carnes El Rodeo',true),
    ('Chicharrón','Proteínas','kg',28000,5,4,'Carnes El Rodeo',true),
    ('Tocineta ahumada','Proteínas','kg',42000,4,3,'Carnes El Rodeo',true),
    ('Huevos','Proteínas','und',600,180,120,'Avícola San Cristóbal',true),
    ('Papa a la francesa congelada','Acompañamientos','kg',9000,60,30,'Distribuidora Andina de Alimentos',false),
    ('Plátano verde','Acompañamientos','kg',4000,12,8,'Fruver La Mayorista',true),
    ('Pan brioche','Panadería','und',1800,90,60,'Panadería Laureles',true),
    ('Queso cheddar','Lácteos','kg',38000,5,4,'Lácteos del Norte',true),
    ('Queso cuajada','Lácteos','kg',22000,3,2,'Lácteos del Norte',true),
    ('Helado de vainilla','Lácteos','l',18000,6,4,'Lácteos del Norte',true),
    ('Totopos de maíz','Secos','kg',22000,7,4,'Distribuidora Andina de Alimentos',false),
    ('Guacamole','Salsas','kg',24000,4,3,'Fruver La Mayorista',true),
    ('Salsa BBQ de la casa','Salsas','l',12000,8,4,'Producción interna',true),
    ('Salsa búfalo','Salsas','l',16000,6,4,'Producción interna',true),
    ('Miel picante','Salsas','l',30000,2,1,'Producción interna',true),
    ('Gravy','Salsas','l',14000,3,2,'Producción interna',true),
    ('Vegetales frescos (mix)','Fruver','kg',6000,15,10,'Fruver La Mayorista',true),
    ('Arándanos','Fruver','kg',40000,1,1,'Fruver La Mayorista',true),
    ('Mezcla para waffle','Secos','kg',8000,6,4,'Distribuidora Andina de Alimentos',false),
    ('Mezcla para pancakes','Secos','kg',9000,5,3,'Distribuidora Andina de Alimentos',false),
    ('Brownie','Panadería','und',2500,30,20,'Panadería Laureles',true),
    ('Cerveza nacional (botella)','Bebidas','und',3200,420,240,'Distribuidora de Bebidas del Valle',false),
    ('Cerveza artesanal (botella)','Bebidas','und',6500,96,72,'Cervecería Artesanal del Valle',false),
    ('Tequila','Licores','l',140000,6,4,'Licores Premium Medellín',false),
    ('Ron','Licores','l',90000,8,4,'Licores Premium Medellín',false),
    ('Whisky','Licores','l',160000,7,4,'Licores Premium Medellín',false),
    ('Aguardiente','Licores','l',55000,24,12,'Licores Premium Medellín',false),
    ('Vodka','Licores','l',110000,5,3,'Licores Premium Medellín',false),
    ('Mixers y jarabes','Bebidas','l',8000,20,10,'Distribuidora Andina de Alimentos',false),
    ('Gaseosa','Bebidas','und',1800,144,96,'Distribuidora de Bebidas del Valle',false),
    ('Agua','Bebidas','und',1200,96,48,'Distribuidora de Bebidas del Valle',false),
    ('Base de limonada','Bebidas','l',6000,10,6,'Producción interna',true),
    ('Hielo','Bebidas','kg',1500,80,60,'Hielo Polar',false)
  ) AS i(n, c, u, cost, stock, rp, sup, per);

  -- Dos insumos por debajo del punto de reorden: la alerta de inventario tiene algo que mostrar
  UPDATE inventory_items SET current_stock = 6 WHERE user_id = c_owner AND item_name = 'Alitas de pollo';
  UPDATE inventory_items SET current_stock = 1.5 WHERE user_id = c_owner AND item_name = 'Tocineta ahumada';

  -- 6. Proveedores
  INSERT INTO suppliers (user_id, name, contact_name, phone, category, payment_terms, lead_time_days, rating, is_active)
  VALUES (c_owner, 'Carnes El Rodeo', 'Hernán Gaviria', '+57 300 000 0101', 'Carnes', '15 días', 2, 4.6, true),
         (c_owner, 'Avícola San Cristóbal', 'Gloria Tobón', '+57 300 000 0102', 'Pollo y huevos', '15 días', 1, 4.4, true),
         (c_owner, 'Fruver La Mayorista', 'Óscar Mesa', '+57 300 000 0103', 'Fruver', 'Contado', 1, 4.1, true),
         (c_owner, 'Distribuidora de Bebidas del Valle', 'Andrea Lopera', '+57 300 000 0104', 'Bebidas', '30 días', 3, 4.7, true),
         (c_owner, 'Licores Premium Medellín', 'Julián Arcila', '+57 300 000 0105', 'Licores', '30 días', 3, 4.5, true),
         (c_owner, 'Distribuidora Andina de Alimentos', 'Carolina Ruiz', '+57 300 000 0106', 'Secos y congelados', '30 días', 4, 4.2, true),
         (c_owner, 'Lácteos del Norte', 'Pedro Álvarez', '+57 300 000 0107', 'Lácteos', '15 días', 2, 4.3, true),
         (c_owner, 'Panadería Laureles', 'Rosa Cano', '+57 300 000 0108', 'Panadería', 'Contado', 1, 4.8, true),
         (c_owner, 'Cervecería Artesanal del Valle', 'Mauricio Pineda', '+57 300 000 0109', 'Bebidas', '30 días', 5, 4.6, true);
  -- El módulo de inventario y las facturas usan inventory_suppliers
  INSERT INTO inventory_suppliers (user_id, supplier_name, contact_name, phone, city, payment_terms, lead_time_days,
                                   delivery_days, rating, is_active, minimum_order)
  SELECT user_id, name, contact_name, phone, 'Medellín', payment_terms, lead_time_days,
         CASE WHEN lead_time_days <= 1 THEN 'Lunes a sábado' ELSE 'Martes y viernes' END, rating, true, 150000
  FROM suppliers WHERE user_id = c_owner;
  UPDATE inventory_items ii SET preferred_supplier_id = s.id
    FROM inventory_suppliers s WHERE s.user_id = c_owner AND s.supplier_name = ii.supplier_name AND ii.user_id = c_owner;

  -- 7. Carta, recetas y costos
  INSERT INTO restaurant_menus (user_id, name, description, cuisine_type, status, public_url_slug)
  VALUES (c_owner, 'Carta Clutch', 'Comida americana para ver el partido', 'americana', 'published', 'clutch-sports-bar')
  RETURNING id INTO v_menu;

  INSERT INTO menu_categories (menu_id, name, sort_order, is_active)
  SELECT v_menu, n, o, true FROM (VALUES ('Para compartir',1),('Alitas',2),('Hamburguesas',3),
    ('Platos fuertes',4),('Brunch',5),('Postres',6),('Cervezas',7),('Cócteles',8),('Licores',9),('Sin alcohol',10)) AS c(n, o);

  DROP TABLE IF EXISTS _demo_menu;
  CREATE TEMP TABLE _demo_menu (name text, category text, price numeric, weight numeric, brunch boolean,
                                featured boolean, prep int, descr text, ingredients jsonb) ON COMMIT DROP;
  INSERT INTO _demo_menu VALUES
    ('Nachos cargados','Para compartir',38000,6,false,false,12,'Totopos, cheddar fundido, carne, guacamole y pico de gallo',
      '[["Totopos de maíz",0.15],["Queso cheddar",0.08],["Guacamole",0.06],["Carne de res molida (blend burger)",0.08],["Vegetales frescos (mix)",0.05]]'),
    ('Picada Clutch (para 4)','Para compartir',98000,3,false,true,18,'Chorizo, chicharrón, alitas, patacones y papas para la tribuna',
      '[["Chorizo artesanal",0.25],["Chicharrón",0.3],["Alitas de pollo",0.3],["Plátano verde",0.4],["Papa a la francesa congelada",0.3],["Guacamole",0.1]]'),
    ('Poutine','Para compartir',32000,3,false,false,10,'Papas, gravy y queso cuajada, al estilo canadiense',
      '[["Papa a la francesa congelada",0.3],["Gravy",0.15],["Queso cuajada",0.12]]'),
    ('Tenders de pollo','Para compartir',34000,4,false,false,12,'Tiras de pechuga apanada con salsa BBQ',
      '[["Pechuga de pollo",0.25],["Papa a la francesa congelada",0.2],["Salsa BBQ de la casa",0.05]]'),
    ('Alitas x10','Alitas',42000,9,false,true,15,'Diez alitas con salsa búfalo o la de tu equipo',
      '[["Alitas de pollo",0.5],["Salsa búfalo",0.08],["Vegetales frescos (mix)",0.05]]'),
    ('Alitas x20','Alitas',78000,4,false,false,18,'Veinte alitas para compartir el partido completo',
      '[["Alitas de pollo",1.0],["Salsa búfalo",0.15],["Vegetales frescos (mix)",0.08]]'),
    ('Alitas BBQ ahumadas x10','Alitas',44000,5,false,false,15,'Alitas glaseadas en BBQ de la casa',
      '[["Alitas de pollo",0.5],["Salsa BBQ de la casa",0.08],["Vegetales frescos (mix)",0.05]]'),
    ('Clutch Burger','Hamburguesas',46000,8,false,true,14,'180 g de res, cheddar, tocineta y salsa de la casa en pan brioche',
      '[["Carne de res molida (blend burger)",0.18],["Pan brioche",1],["Queso cheddar",0.04],["Tocineta ahumada",0.03],["Vegetales frescos (mix)",0.06],["Papa a la francesa congelada",0.2]]'),
    ('Doble Smash','Hamburguesas',52000,5,false,false,14,'Dos carnes smash, doble cheddar',
      '[["Carne de res molida (blend burger)",0.26],["Pan brioche",1],["Queso cheddar",0.06],["Vegetales frescos (mix)",0.05],["Papa a la francesa congelada",0.2]]'),
    ('Nashville Hot Chicken','Hamburguesas',44000,4,false,false,14,'Pollo crocante picante con miel',
      '[["Pechuga de pollo",0.2],["Pan brioche",1],["Miel picante",0.03],["Vegetales frescos (mix)",0.06],["Papa a la francesa congelada",0.2]]'),
    ('BBQ Bacon Burger','Hamburguesas',49000,4,false,false,14,'Res, tocineta doble y BBQ',
      '[["Carne de res molida (blend burger)",0.18],["Pan brioche",1],["Tocineta ahumada",0.06],["Salsa BBQ de la casa",0.04],["Queso cheddar",0.04],["Papa a la francesa congelada",0.2]]'),
    ('Costillas BBQ (media)','Platos fuertes',68000,3,false,false,20,'Media costilla St. Louis ahumada',
      '[["Costilla de cerdo St. Louis",0.55],["Salsa BBQ de la casa",0.1],["Papa a la francesa congelada",0.25]]'),
    ('Costillas BBQ (completa)','Platos fuertes',112000,1,false,false,22,'Costilla completa para dos',
      '[["Costilla de cerdo St. Louis",1.0],["Salsa BBQ de la casa",0.15],["Papa a la francesa congelada",0.3]]'),
    ('Chicken & Waffles','Brunch',39000,6,true,true,15,'Pollo crocante sobre waffle belga con miel picante',
      '[["Pechuga de pollo",0.2],["Mezcla para waffle",0.15],["Miel picante",0.03]]'),
    ('Pancakes de arándanos','Brunch',29000,4,true,false,12,'Torre de pancakes con arándanos',
      '[["Mezcla para pancakes",0.15],["Arándanos",0.06],["Huevos",1]]'),
    ('Huevos con tocineta','Brunch',27000,4,true,false,10,'Tres huevos, tocineta y papas',
      '[["Huevos",3],["Tocineta ahumada",0.06],["Papa a la francesa congelada",0.15]]'),
    ('Brownie con helado','Postres',18000,3,false,false,6,'Brownie tibio con helado de vainilla',
      '[["Brownie",1],["Helado de vainilla",0.1]]'),
    ('Cerveza nacional','Cervezas',9000,18,false,false,1,'Botella 330 ml',
      '[["Cerveza nacional (botella)",1]]'),
    ('Cerveza artesanal','Cervezas',17000,6,false,false,1,'Selección local',
      '[["Cerveza artesanal (botella)",1]]'),
    ('Cubeta x6 nacionales','Cervezas',48000,5,false,true,2,'Seis cervezas en hielo para el partido',
      '[["Cerveza nacional (botella)",6],["Hielo",0.5]]'),
    ('Margarita','Cócteles',34000,4,false,false,4,'Tequila, limón y sal',
      '[["Tequila",0.06],["Mixers y jarabes",0.06],["Hielo",0.2]]'),
    ('Mojito','Cócteles',30000,3,false,false,4,'Ron, hierbabuena y limón',
      '[["Ron",0.06],["Mixers y jarabes",0.08],["Hielo",0.2]]'),
    ('Old Fashioned','Cócteles',38000,2,false,false,4,'Whisky, amargo y naranja',
      '[["Whisky",0.06],["Mixers y jarabes",0.02],["Hielo",0.1]]'),
    ('Moscow Mule','Cócteles',32000,2,false,false,4,'Vodka, ginger beer y limón',
      '[["Vodka",0.06],["Mixers y jarabes",0.1],["Hielo",0.2]]'),
    ('Shot de whisky','Licores',26000,3,false,false,1,'45 ml',
      '[["Whisky",0.045]]'),
    ('Shot de tequila','Licores',22000,3,false,false,1,'45 ml',
      '[["Tequila",0.045]]'),
    ('Media de aguardiente','Licores',85000,2,false,false,1,'375 ml',
      '[["Aguardiente",0.375]]'),
    ('Limonada natural','Sin alcohol',12000,5,false,false,3,'Limonada de la casa',
      '[["Base de limonada",0.35],["Hielo",0.2]]'),
    ('Gaseosa','Sin alcohol',7000,6,false,false,1,'350 ml',
      '[["Gaseosa",1]]'),
    ('Agua','Sin alcohol',6000,3,false,false,1,'Sin gas',
      '[["Agua",1]]');

  INSERT INTO menu_items (menu_id, category, category_id, name, description, price, is_available, is_featured,
                          sort_order, preparation_time_minutes, is_bestseller)
  SELECT v_menu, d.category, mc.id, d.name, d.descr, d.price, true, d.featured,
         row_number() OVER (PARTITION BY d.category ORDER BY d.weight DESC), d.prep, d.weight >= 8
  FROM _demo_menu d JOIN menu_categories mc ON mc.menu_id = v_menu AND mc.name = d.category;

  INSERT INTO recipes (user_id, menu_item_id, name, category, portions, yield_quantity, yield_unit,
                       preparation_time_minutes, difficulty, is_sub_recipe)
  SELECT c_owner, mi.id, mi.name, mi.category, 1, 1, 'porción', mi.preparation_time_minutes,
         CASE WHEN mi.preparation_time_minutes > 12 THEN 'media' ELSE 'fácil' END, false
  FROM menu_items mi WHERE mi.menu_id = v_menu;

  UPDATE menu_items mi SET recipe_id = r.id FROM recipes r WHERE r.menu_item_id = mi.id AND r.user_id = c_owner;

  INSERT INTO recipe_ingredients (recipe_id, inventory_item_id, ingredient_name, quantity, unit, cost_per_unit,
                                  sort_order, yield_percentage)
  SELECT r.id, ii.id, ii.item_name, (ing->>1)::numeric, ii.unit, ii.unit_cost, ord, 100
  FROM _demo_menu d
  JOIN recipes r ON r.user_id = c_owner AND r.name = d.name
  CROSS JOIN LATERAL jsonb_array_elements(d.ingredients) WITH ORDINALITY AS x(ing, ord)
  JOIN inventory_items ii ON ii.user_id = c_owner AND ii.item_name = ing->>0;

  UPDATE recipes r
     SET total_cost = x.cost, cost_per_portion = x.cost
    FROM (SELECT recipe_id, SUM(quantity * cost_per_unit) AS cost FROM recipe_ingredients GROUP BY recipe_id) x
   WHERE x.recipe_id = r.id AND r.user_id = c_owner;
  UPDATE menu_items mi SET cost = r.cost_per_portion FROM recipes r WHERE r.id = mi.recipe_id AND r.user_id = c_owner;

  -- Pesos de popularidad para el simulador de ventas
  TRUNCATE public._demo_menu_weights;
  INSERT INTO public._demo_menu_weights
  SELECT mi.id, mi.name, mi.category, mi.price, d.weight, d.brunch
  FROM menu_items mi JOIN _demo_menu d ON d.name = mi.name WHERE mi.menu_id = v_menu;

  -- 8. Mesas y medios de pago
  INSERT INTO restaurant_tables (user_id, table_number, capacity, status, shape, position_x, position_y)
  SELECT c_owner, CASE WHEN i <= 4 THEN 'B' || i WHEN i <= 24 THEN 'S' || (i - 4) WHEN i <= 30 THEN 'T' || (i - 24) ELSE 'VIP' || (i - 30) END,
         CASE WHEN i <= 4 THEN 2 WHEN i <= 24 THEN 4 WHEN i <= 30 THEN 4 ELSE 10 END,
         'available', CASE WHEN i > 30 THEN 'rectangle' ELSE 'square' END,
         ((i - 1) % 8) * 110 + 40, ((i - 1) / 8) * 110 + 40
  FROM generate_series(1, 32) i;

  INSERT INTO pos_payment_methods (user_id, method_name, method_type, provider, is_active, requires_reference,
                                   commission_percent, display_order)
  VALUES (c_owner, 'Efectivo', 'cash', NULL, true, false, 0, 1),
         (c_owner, 'Tarjeta débito', 'card', 'manual', true, true, 1.8, 2),
         (c_owner, 'Tarjeta crédito', 'card', 'manual', true, true, 2.9, 3),
         (c_owner, 'Nequi', 'digital_wallet', 'nequi', true, true, 0, 4),
         (c_owner, 'QR Bancolombia', 'qr', 'manual', true, true, 0.5, 5);

  -- 9. Clientes conocidos (para repetición y fidelización)
  TRUNCATE public._demo_customers;
  INSERT INTO public._demo_customers
  SELECT (ARRAY['Carlos','Juliana','Andrés','Catalina','Sebastián','Paula','David','Laura','Esteban','Melissa',
                'Nicolás','Valeria','Simón','Ana María','Federico','Daniela','Mike','Jessica','Ryan','Emily'])[1 + (i % 20)]
         || ' ' ||
         (ARRAY['Gómez','Restrepo','Vélez','Mejía','Arango','Correa','Zapata','Henao','Uribe','Ochoa',
                'Smith','Johnson','Cardona','Jaramillo','Botero'])[1 + ((i * 7) % 15)],
         '+573' || lpad((10000000 + i * 7919 % 89999999)::text, 9, '0'),
         CASE WHEN i <= 40 THEN 6 WHEN i <= 140 THEN 2 ELSE 1 END  -- unos pocos clientes muy frecuentes
  FROM generate_series(1, 420) i;

  -- 10. Calendario deportivo y festivos (relativo a hoy, para que siempre haya partidos)
  INSERT INTO demand_events (user_id, event_date, start_time, title, category, expected_lift, notes)
  SELECT c_owner, d, t, title, cat, lift, note
  FROM generate_series(v_from, v_today + 28, interval '1 day') g(dts)
  CROSS JOIN LATERAL (SELECT dts::date AS d, EXTRACT(ISODOW FROM dts)::int AS dow,
                             ((dts::date - date '2026-01-05') / 7) AS wk) x
  CROSS JOIN LATERAL (VALUES
    (CASE WHEN x.dow = 7 THEN time '12:00' END, 'NFL Sunday · juegos de la tarde', 'deporte', 1.55, 'Pantalla principal + paquete de alitas'),
    (CASE WHEN x.dow = 7 THEN time '19:20' END, 'Sunday Night Football', 'deporte', 1.35, NULL),
    (CASE WHEN x.dow = 1 THEN time '19:15' END, 'Monday Night Football', 'deporte', 1.3, NULL),
    (CASE WHEN x.dow = 4 THEN time '19:15' END, 'Thursday Night Football', 'deporte', 1.25, NULL),
    (CASE WHEN x.dow IN (2, 3) AND x.wk % 2 = 0 THEN time '14:00' END, 'Champions League · fecha de grupos', 'deporte', 1.6, 'Reservas de grupos desde el lunes'),
    (CASE WHEN x.dow = 6 AND x.wk % 3 = 0 THEN time '21:00' END, 'UFC · cartelera estelar', 'deporte', 1.75, 'Cover opcional y zona VIP'),
    (CASE WHEN x.dow = 6 THEN time '11:30' END, 'Premier League · partido de la fecha', 'deporte', 1.25, NULL),
    (CASE WHEN x.dow = 5 AND x.wk % 4 = 1 THEN time '20:00' END, 'NBA · partido de la semana', 'deporte', 1.2, NULL)
  ) AS e(t, title, cat, lift, note)
  WHERE e.t IS NOT NULL;

  INSERT INTO demand_events (user_id, event_date, title, category, expected_lift, notes)
  SELECT c_owner, f.d, f.title, 'festivo', 1.3, 'Festivo: la víspera se llena como un sábado'
  FROM (VALUES (date '2026-08-07', 'Festivo · Batalla de Boyacá'), (date '2026-08-17', 'Festivo · La Asunción'),
               (date '2026-10-12', 'Festivo · Día de la Raza'), (date '2026-11-02', 'Festivo · Todos los Santos'),
               (date '2026-11-16', 'Festivo · Independencia de Cartagena'), (date '2026-12-08', 'Festivo · Inmaculada Concepción'),
               (date '2026-12-25', 'Navidad')) AS f(d, title)
  WHERE f.d BETWEEN v_from AND v_today + 28;

  INSERT INTO demand_events (user_id, event_date, start_time, title, category, expected_lift, notes)
  SELECT c_owner, d, t, title, cat, lift, note FROM (VALUES
    (date '2026-10-31', time '20:00', 'Halloween · fiesta de disfraces', 'promocion', 1.4, '2x1 en cócteles hasta las 10 p.m.'),
    (date '2026-11-26', time '17:00', 'Thanksgiving · cena familiar (2 turnos)', 'evento_privado', 1.5, 'Menú fijo por persona, reserva previa')
  ) AS x(d, t, title, cat, lift, note)
  WHERE d BETWEEN v_from AND v_today + 28;

  -- 11. Turnos de los últimos 90 días: 5 días de 7,5 h netas (37,5 h < 42 h legales),
  --     descanso entre semana para que viernes a domingo esté todo el equipo.
  INSERT INTO staff_shifts (user_id, staff_member_id, shift_date, start_time, end_time, break_minutes,
                            status, actual_start_time, actual_end_time, department, is_published, published_at)
  SELECT c_owner, sm.id, d,
         st, en, 30,
         CASE WHEN d >= v_today THEN 'scheduled'
              WHEN random() < 0.02 THEN 'no_show' ELSE 'completed' END,
         CASE WHEN d < v_today THEN st END, CASE WHEN d < v_today THEN en END,
         sm.department, true, d - 5
  FROM (SELECT sm.*, row_number() OVER (ORDER BY sm.employee_id) AS k
        FROM staff_members sm WHERE sm.user_id = c_owner) sm
  CROSS JOIN generate_series(v_from, v_today + (7 - EXTRACT(ISODOW FROM v_today)::int), interval '1 day') g(dts)
  CROSS JOIN LATERAL (SELECT dts::date AS d, EXTRACT(ISODOW FROM dts)::int AS dow,
                             ((dts::date - date '2026-01-05') / 7) AS wk) x
  CROSS JOIN LATERAL (
    SELECT
      -- apertura o cierre, alterna cada semana según la persona
      CASE WHEN sm.position = 'Gerente general' THEN time '11:00'
           WHEN (sm.k + x.wk) % 2 = 0 THEN CASE WHEN x.dow IN (6, 7) THEN time '09:00' ELSE time '12:00' END
           ELSE CASE WHEN x.dow IN (1, 2, 7) THEN time '16:00' ELSE time '18:00' END END AS st,
      CASE WHEN sm.position = 'Gerente general' THEN time '19:00'
           WHEN (sm.k + x.wk) % 2 = 0 THEN CASE WHEN x.dow IN (6, 7) THEN time '17:00' ELSE time '20:00' END
           ELSE CASE WHEN x.dow IN (1, 2, 7) THEN time '00:00' ELSE time '02:00' END END AS en,
      -- dos días de descanso entre lunes y jueves (la gerente: domingo y lunes)
      CASE WHEN sm.position = 'Gerente general' THEN ARRAY[7, 1]
           ELSE CASE sm.k % 6 WHEN 0 THEN ARRAY[1, 2] WHEN 1 THEN ARRAY[3, 4] WHEN 2 THEN ARRAY[1, 3]
                              WHEN 3 THEN ARRAY[2, 4] WHEN 4 THEN ARRAY[1, 4] ELSE ARRAY[2, 3] END END AS rest
  ) t(st, en, rest)
  WHERE x.dow <> ALL (t.rest);

  -- 12. 90 días de ventas
  v_orders := _demo_generate_orders(
    (v_from::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota',
    date_trunc('hour', now()));

  -- Fidelización y matriz de ingeniería de menú (una sola vez, no por fila)
  INSERT INTO loyalty_customers (user_id, customer_name, customer_phone, total_spent, total_orders,
                                 avg_order_value, first_order_at, last_order_at, current_points, lifetime_points, is_active)
  SELECT c_owner, MAX(customer_name), customer_phone, SUM(total - COALESCE(tip_amount, 0)), COUNT(*),
         round(AVG(total - COALESCE(tip_amount, 0))), MIN(created_at), MAX(created_at),
         (SUM(total - COALESCE(tip_amount, 0)) / 1000)::int, (SUM(total - COALESCE(tip_amount, 0)) / 1000)::int, true
  FROM restaurant_orders WHERE user_id = c_owner AND customer_phone IS NOT NULL
  GROUP BY customer_phone;
  PERFORM calculate_menu_item_scores(c_owner, 30);

  -- 13. Finanzas: costos fijos diarios y facturas de proveedores
  INSERT INTO daily_sales (user_id, sale_date, other_costs, notes)
  SELECT c_owner, d::date, 3000000,
         'Costos fijos prorrateados: arriendo $30M, servicios $9M, carga prestacional $28M, licencias de TV deportiva $8M, mercadeo $5M, otros $10M al mes'
  FROM generate_series(v_from, v_today - 1, interval '1 day') d;

  INSERT INTO supplier_invoices (user_id, business_id, supplier_id, supplier_name, invoice_number, invoice_date,
                                 due_date, currency, subtotal, tax_amount, total_amount, status, items, ai_confidence, notes)
  SELECT c_owner, c_biz, s.id, s.supplier_name, 'FV-' || upper(left(replace(s.supplier_name, ' ', ''), 4)) || '-' || to_char(w.wk, 'IYYIW'),
         w.wk + 1, w.wk + 1 + CASE WHEN s.payment_terms = 'Contado' THEN 0 WHEN s.payment_terms = '15 días' THEN 15 ELSE 30 END,
         'COP', round(c.cost * 1.06 / 1.19), round(c.cost * 1.06 - c.cost * 1.06 / 1.19), round(c.cost * 1.06),
         CASE WHEN w.wk + 1 + CASE WHEN s.payment_terms = 'Contado' THEN 0 WHEN s.payment_terms = '15 días' THEN 15 ELSE 30 END < v_today
              THEN 'paid' ELSE 'pending' END,
         '[]'::jsonb, 0.97, 'Compra semanal'
  FROM inventory_suppliers s
  CROSS JOIN LATERAL (SELECT date_trunc('week', d)::date AS wk
                      FROM generate_series(v_from, v_today - 1, interval '7 days') d) w
  CROSS JOIN LATERAL (
    SELECT SUM(dd.quantity_deducted * ii.unit_cost) AS cost
    FROM inventory_deductions dd JOIN inventory_items ii ON ii.id = dd.inventory_item_id
    WHERE dd.user_id = c_owner AND ii.supplier_name = s.supplier_name
      AND dd.deducted_at >= w.wk::timestamp AT TIME ZONE 'America/Bogota'
      AND dd.deducted_at <  (w.wk + 7)::timestamp AT TIME ZONE 'America/Bogota') c
  WHERE s.user_id = c_owner AND COALESCE(c.cost, 0) > 0;

  INSERT INTO sales_goals (user_id, period_type, period_start, period_end, revenue_goal, covers_goal, avg_ticket_goal, notes)
  VALUES (c_owner, 'monthly', date_trunc('month', v_today)::date,
          (date_trunc('month', v_today) + interval '1 month - 1 day')::date, 240000000, 7600, 95000,
          'Meta del mes: temporada NFL + Champions');

  -- 14. Reservas: pasadas (cumplidas) y próximas (grupos para los partidos)
  INSERT INTO table_reservations (user_id, customer_name, customer_phone, party_size, reservation_date,
                                  reservation_time, status, source, special_requests, duration_minutes)
  SELECT c_owner, c.name, c.phone, 2 + (i % 7),
         v_today + ((i % 24) - 10),
         CASE WHEN i % 3 = 0 THEN time '19:00' WHEN i % 3 = 1 THEN time '13:30' ELSE time '20:30' END,
         CASE WHEN v_today + ((i % 24) - 10) < v_today THEN (CASE WHEN i % 11 = 0 THEN 'no_show' ELSE 'completed' END)
              ELSE 'confirmed' END,
         (ARRAY['whatsapp','phone','website','walk_in'])[1 + i % 4],
         CASE WHEN i % 5 = 0 THEN 'Mesa frente a la pantalla principal' WHEN i % 7 = 0 THEN 'Cumpleaños' END,
         120
  FROM generate_series(1, 72) i
  JOIN LATERAL (SELECT name, phone FROM public._demo_customers ORDER BY phone OFFSET (i * 13) % 400 LIMIT 1) c ON true;

  -- 15. Propinas: tres quincenas cerradas y la última lista para liquidar
  FOR v_period IN
    SELECT ps::date AS s,
           CASE WHEN EXTRACT(DAY FROM ps) = 1 THEN ps::date + 14
                ELSE (date_trunc('month', ps) + interval '1 month - 1 day')::date END AS e
    FROM generate_series(date_trunc('month', v_today - 50), v_today, interval '1 day') ps
    WHERE EXTRACT(DAY FROM ps) IN (1, 16)
  LOOP
    IF v_period.e >= v_today THEN CONTINUE; END IF;
    INSERT INTO tip_periods (user_id, label, start_date, end_date)
    VALUES (c_owner, 'Quincena ' || to_char(v_period.s, 'DD') || '–' || to_char(v_period.e, 'DD') || ' ' ||
                     (ARRAY['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[EXTRACT(MONTH FROM v_period.s)::int],
            v_period.s, v_period.e);
  END LOOP;

  FOR v_period IN SELECT id, end_date FROM tip_periods WHERE user_id = c_owner ORDER BY start_date LOOP
    PERFORM compute_tip_period(v_period.id);
  END LOOP;
  -- Un ajuste realista en la última quincena: un mesero cubrió un doble turno
  UPDATE tip_allocations a SET adjustment = 25000, adjustment_reason = 'Cubrió doble turno el sábado de UFC'
   WHERE a.id = (SELECT a2.id FROM tip_allocations a2 JOIN tip_periods p ON p.id = a2.period_id
                  WHERE p.user_id = c_owner AND a2.position = 'Mesero'
                  ORDER BY p.start_date DESC, a2.staff_name LIMIT 1);
  UPDATE tip_allocations a SET adjustment = -25000, adjustment_reason = 'Cambio de turno con compañero (doble turno UFC)'
   WHERE a.id = (SELECT a2.id FROM tip_allocations a2 JOIN tip_periods p ON p.id = a2.period_id
                  WHERE p.user_id = c_owner AND a2.position = 'Mesero'
                  ORDER BY p.start_date DESC, a2.staff_name DESC LIMIT 1);
  UPDATE tip_allocations a SET manager_factor = 0.8, factor_reason = 'Dos llegadas tarde en la quincena'
   WHERE a.id = (SELECT a2.id FROM tip_allocations a2 JOIN tip_periods p ON p.id = a2.period_id
                  WHERE p.user_id = c_owner AND a2.position = 'Bartender'
                  ORDER BY p.start_date DESC, a2.staff_name LIMIT 1);
  FOR v_period IN SELECT id FROM tip_periods WHERE user_id = c_owner ORDER BY start_date DESC LIMIT 1 LOOP
    PERFORM compute_tip_period(v_period.id);
  END LOOP;
  FOR v_period IN SELECT id FROM tip_periods WHERE user_id = c_owner ORDER BY start_date DESC OFFSET 1 LOOP
    PERFORM close_tip_period(v_period.id);
  END LOOP;

  RETURN jsonb_build_object(
    'orders', v_orders,
    'revenue_30d', (SELECT SUM(total - COALESCE(tip_amount, 0)) FROM restaurant_orders
                     WHERE user_id = c_owner AND created_at >= now() - interval '30 days'),
    'staff', (SELECT COUNT(*) FROM staff_members WHERE user_id = c_owner),
    'shifts', (SELECT COUNT(*) FROM staff_shifts WHERE user_id = c_owner),
    'events', (SELECT COUNT(*) FROM demand_events WHERE user_id = c_owner),
    'tip_periods', (SELECT COUNT(*) FROM tip_periods WHERE user_id = c_owner));
END $$;

-- Ventas "en vivo": cada hora se agregan las órdenes de la hora anterior.
CREATE OR REPLACE FUNCTION public.demo_tick()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_last timestamptz;
BEGIN
  SELECT date_trunc('hour', MAX(created_at)) + interval '1 hour' INTO v_last
  FROM restaurant_orders WHERE user_id = demo_owner_id();
  IF v_last IS NULL OR v_last >= date_trunc('hour', now()) THEN RETURN 0; END IF;
  RETURN _demo_generate_orders(v_last, date_trunc('hour', now()));
END $$;

REVOKE ALL ON FUNCTION public.seed_demo_restaurant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.demo_tick() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._demo_generate_orders(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._demo_upsert_auth_user(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._demo_expected_orders(date, integer) FROM PUBLIC, anon, authenticated;

-- 04:05 hora de Bogotá = 09:05 UTC
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('demo-restaurant-reset', 'demo-restaurant-tick');
SELECT cron.schedule('demo-restaurant-reset', '5 9 * * *', $$SELECT public.seed_demo_restaurant()$$);
SELECT cron.schedule('demo-restaurant-tick', '2 * * * *', $$SELECT public.demo_tick()$$);
