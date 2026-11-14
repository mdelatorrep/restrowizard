-- Línea base generada desde el catálogo de producción el 2026-11-14 17:20 (hora de Bogotá).
-- No editar a mano: regenerar con supabase/tools/schema_dump.sql.

SET check_function_bodies = off;
SET client_min_messages = warning;

-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Tipos enumerados
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'user', 'consultant');
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewing', 'interviewed', 'offered', 'hired', 'rejected');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.brand_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE public.chain_location_type AS ENUM ('flagship', 'standard', 'express', 'ghost_kitchen', 'franchise');
CREATE TYPE public.consultant_client_status AS ENUM ('active', 'paused', 'completed', 'prospect');
CREATE TYPE public.consultant_type AS ENUM ('independent', 'agency', 'franchise_advisor', 'chain_consultant');
CREATE TYPE public.copilot_alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.cuisine_type AS ENUM ('mexican', 'italian', 'japanese', 'chinese', 'american', 'french', 'spanish', 'indian', 'thai', 'mediterranean', 'fusion', 'other', 'mexicana', 'italiana', 'japonesa', 'china', 'coreana', 'tailandesa', 'india', 'americana', 'francesa', 'española', 'peruana', 'colombiana', 'argentina', 'arabe', 'mediterranea', 'mariscos', 'vegetariana', 'cafeteria', 'otra');
CREATE TYPE public.delivery_platform AS ENUM ('rappi', 'uber_eats', 'didi_food', 'doordash', 'grubhub', 'direct', 'other');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE public.experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'executive');
CREATE TYPE public.job_category AS ENUM ('kitchen', 'service', 'management', 'bartender', 'cleaning', 'delivery', 'other', 'marketing', 'finance', 'administration');
CREATE TYPE public.job_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'internship');
CREATE TYPE public.maturity_level AS ENUM ('inicial', 'basico', 'intermedio', 'avanzado', 'experto');
CREATE TYPE public.menu_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.service_category AS ENUM ('catering', 'photography', 'music', 'decoration', 'lighting', 'entertainment', 'flowers', 'other', 'equipment', 'technology', 'food_supplies', 'consulting', 'design');
CREATE TYPE public.team_member_role AS ENUM ('owner', 'admin', 'manager', 'cashier', 'kitchen', 'staff');
CREATE TYPE public.team_member_status AS ENUM ('invited', 'active', 'suspended', 'removed');
CREATE TYPE public.venue_type AS ENUM ('restaurant', 'banquet_hall', 'outdoor', 'rooftop', 'garden', 'beach', 'hotel', 'other');
CREATE TYPE public.waste_category AS ENUM ('preparation', 'overproduction', 'spoilage', 'plate_waste', 'storage', 'other');

-- Secuencias
CREATE SEQUENCE public.pos_pin_attempts_id_seq AS bigint INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;
CREATE SEQUENCE public.restaurant_orders_order_number_seq AS integer INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;
CREATE SEQUENCE public.support_tickets_ticket_number_seq AS integer INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;

-- Funciones (1 de 2)
CREATE OR REPLACE FUNCTION public._demo_expected_orders(p_day date, p_hr integer)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dow int := EXTRACT(ISODOW FROM p_day);
  v_daily numeric;
  v_open int; v_close int;
  v_w numeric; v_sum numeric := 0;
  v_lift numeric := 1;
  h int;
BEGIN
  v_daily := CASE v_dow WHEN 1 THEN 25 WHEN 2 THEN 24 WHEN 3 THEN 36 WHEN 4 THEN 40
                        WHEN 5 THEN 65 WHEN 6 THEN 80 ELSE 67 END;
  v_open  := CASE WHEN v_dow IN (6, 7) THEN 10 ELSE 13 END;
  v_close := CASE WHEN v_dow IN (1, 2, 7) THEN 24 ELSE 26 END;
  IF p_hr < v_open OR p_hr >= v_close THEN RETURN 0; END IF;

  FOR h IN v_open .. v_close - 1 LOOP
    v_sum := v_sum + CASE
      WHEN h < 13 THEN 5
      WHEN h < 17 THEN CASE WHEN v_dow IN (6, 7) THEN 5 ELSE 2 END
      WHEN h = 17 THEN 5 WHEN h = 18 THEN 8 WHEN h = 19 THEN 11 WHEN h = 20 THEN 12
      WHEN h = 21 THEN 11 WHEN h = 22 THEN 9 WHEN h = 23 THEN 6 WHEN h = 24 THEN 4 ELSE 2 END;
  END LOOP;
  v_w := CASE
      WHEN p_hr < 13 THEN 5
      WHEN p_hr < 17 THEN CASE WHEN v_dow IN (6, 7) THEN 5 ELSE 2 END
      WHEN p_hr = 17 THEN 5 WHEN p_hr = 18 THEN 8 WHEN p_hr = 19 THEN 11 WHEN p_hr = 20 THEN 12
      WHEN p_hr = 21 THEN 11 WHEN p_hr = 22 THEN 9 WHEN p_hr = 23 THEN 6 WHEN p_hr = 24 THEN 4 ELSE 2 END;

  SELECT COALESCE(MAX(CASE
           WHEN e.start_time IS NULL THEN e.expected_lift
           WHEN p_hr BETWEEN EXTRACT(HOUR FROM e.start_time)::int - 1 + CASE WHEN EXTRACT(HOUR FROM e.start_time) < 6 THEN 24 ELSE 0 END
                         AND EXTRACT(HOUR FROM e.start_time)::int + 3 + CASE WHEN EXTRACT(HOUR FROM e.start_time) < 6 THEN 24 ELSE 0 END
             THEN e.expected_lift
           ELSE 1 + (e.expected_lift - 1) * 0.25 END), 1)
    INTO v_lift
  FROM demand_events e WHERE e.user_id = demo_owner_id() AND e.event_date = p_day;

  RETURN v_daily * v_w / NULLIF(v_sum, 0) * v_lift;
END $function$
;

CREATE OR REPLACE FUNCTION public._demo_generate_orders(p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
         (s.hr < 13) AS is_brunch,
         -- Mezcla de canales de un sports bar: 10 % Rappi, 6 % domicilio propio por WhatsApp.
         (SELECT CASE WHEN r < 0.10 THEN 'rappi' WHEN r < 0.16 THEN 'delivery_own' ELSE 'pos' END
            FROM (SELECT random() + g * 0 AS r) x) AS ch
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
  SELECT o.id, c_owner,
         CASE o.ch WHEN 'rappi' THEN 'rappi' WHEN 'delivery_own' THEN 'whatsapp' ELSE 'pos' END,
         CASE WHEN o.ch = 'pos' THEN 'dine_in' ELSE 'delivery' END, 'completed',
         l.items, l.subtotal,
         l.subtotal + tip.amount,
         round(l.subtotal * 8 / 108), round(l.subtotal * 8 / 108),
         tip.amount, CASE WHEN tip.amount > 0 THEN 10 ELSE 0 END,
         CASE WHEN o.ch = 'pos' THEN o.guests ELSE 1 END,
         CASE WHEN o.ch = 'rappi' THEN 'Rappi' ELSE pm.method END,
         'paid', o.created_at, o.created_at,
         o.created_at + CASE WHEN o.ch = 'pos' THEN interval '75 minutes' ELSE interval '40 minutes' END,
         CASE WHEN o.ch = 'pos' THEN wp.waiter_id END, CASE WHEN o.ch = 'pos' THEN sm.name END,
         o.ch = 'pos', o.ch, 'served',
         COALESCE(cust.name, CASE WHEN o.ch = 'delivery_own' THEN dcust.name END),
         COALESCE(cust.phone, CASE WHEN o.ch = 'delivery_own' THEN dcust.phone END),
         CASE WHEN o.ch = 'pos' THEN (SELECT t.id FROM restaurant_tables t WHERE t.user_id = c_owner
           ORDER BY random() + length(o.id::text) * 0 LIMIT 1) END
  FROM _new_orders o
  JOIN (SELECT order_id,
               jsonb_agg(jsonb_build_object('menu_item_id', menu_item_id, 'name', name, 'quantity', qty,
                                            'unit_price', price, 'price', price, 'total', price * qty)) AS items,
               SUM(price * qty) AS subtotal
        FROM _lines GROUP BY order_id) l ON l.order_id = o.id
  LEFT JOIN _waiter_pick wp ON wp.order_id = o.id
  LEFT JOIN staff_members sm ON sm.id = wp.waiter_id
  CROSS JOIN LATERAL (SELECT CASE WHEN o.ch = 'pos' AND random() + length(o.id::text) * 0 < 0.82
                             THEN round(l.subtotal * 0.10 / 100) * 100 ELSE 0 END AS amount) tip
  CROSS JOIN LATERAL (SELECT CASE WHEN r < 0.34 THEN 'Tarjeta crédito' WHEN r < 0.62 THEN 'Tarjeta débito'
                                  WHEN r < 0.80 THEN 'Efectivo' WHEN r < 0.94 THEN 'Nequi' ELSE 'QR Bancolombia' END AS method
                      FROM (SELECT random() + length(o.id::text) * 0 AS r) x) pm
  -- 28% de las mesas deja su WhatsApp: la base de clientes conocidos
  CROSS JOIN LATERAL (SELECT random() + length(o.id::text) * 0 AS r) cr
  LEFT JOIN LATERAL (
    SELECT c.name, c.phone FROM _demo_customers c
    ORDER BY -ln(random() + length(o.id::text) * 0 + 1e-9) / c.affinity LIMIT 1
  ) cust ON cr.r < 0.28 AND o.ch <> 'rappi'
  -- El domicilio propio siempre deja teléfono (pide por WhatsApp); Rappi no comparte el cliente.
  LEFT JOIN LATERAL (
    SELECT c.name, c.phone FROM _demo_customers c
    ORDER BY -ln(random() + length(o.id::text) * 0 + 1e-9) / c.affinity LIMIT 1
  ) dcust ON o.ch = 'delivery_own';

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
  FROM restaurant_orders o JOIN _new_orders n ON n.id = o.id
  WHERE n.ch <> 'rappi';  -- Rappi liquida aparte: no entra a la caja

  UPDATE pos_sessions ps
     SET sales_count = x.n, total_sales = x.sales, total_tips = x.tips,
         expected_cash = 400000 + x.cash,
         -- algunos cierres con descuadre pequeño: la auditoría de caja tiene qué mostrar
         actual_cash = CASE WHEN ps.status = 'closed'
                            THEN 400000 + x.cash - CASE WHEN random() < 0.15 THEN round(random() * 30) * 1000 ELSE 0 END END
    FROM (SELECT session_id, COUNT(*) n, SUM(total - COALESCE(tip_amount, 0)) sales,
                 SUM(COALESCE(tip_amount, 0)) tips,
                 SUM(CASE WHEN payment_method = 'Efectivo' THEN total ELSE 0 END) cash
          FROM restaurant_orders WHERE user_id = c_owner AND sales_channel <> 'rappi' GROUP BY session_id) x
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
END $function$
;

CREATE OR REPLACE FUNCTION public._demo_refresh_daily_close(p_from date, p_to date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_owner uuid := demo_owner_id();
  v_rows integer;
BEGIN
  WITH days AS (
    SELECT d::date AS bday FROM generate_series(p_from, p_to, interval '1 day') d
  ), sales AS (
    SELECT ((o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date AS bday,
           SUM(o.total - COALESCE(o.tip_amount, 0)) AS revenue,
           SUM(COALESCE(o.guests_count, 0)) AS covers,
           COUNT(*) AS n
    FROM restaurant_orders o
    WHERE o.user_id = c_owner AND o.status NOT IN ('cancelled', 'pending')
      AND o.created_at >= (p_from::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
      AND o.created_at <  ((p_to + 1)::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
    GROUP BY 1
  ), food AS (
    SELECT ((d.deducted_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date AS bday,
           SUM(d.quantity_deducted * COALESCE(i.unit_cost, 0)) AS cost
    FROM inventory_deductions d
    JOIN inventory_items i ON i.id = d.inventory_item_id
    WHERE d.user_id = c_owner
      AND d.deducted_at >= (p_from::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
      AND d.deducted_at <  ((p_to + 1)::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
    GROUP BY 1
  ), labor AS (
    SELECT s.shift_date AS bday,
           SUM(shift_net_hours(s.start_time, s.end_time, COALESCE(s.break_minutes, 0))
               * COALESCE(s.hourly_rate_override, sm.hourly_rate, 0)) AS cost
    FROM staff_shifts s
    JOIN staff_members sm ON sm.id = s.staff_member_id
    WHERE s.user_id = c_owner AND s.shift_date BETWEEN p_from AND p_to
      AND COALESCE(s.status, 'scheduled') NOT IN ('cancelled', 'no_show')
    GROUP BY 1
  ), computed AS (
    SELECT days.bday,
           COALESCE(round(sales.revenue), 0) AS revenue,
           COALESCE(sales.covers, 0) AS covers,
           CASE WHEN COALESCE(sales.n, 0) > 0 THEN round(sales.revenue / sales.n) END AS avg_ticket,
           COALESCE(round(food.cost), 0) AS food,
           COALESCE(round(labor.cost), 0) AS labor
    FROM days
    LEFT JOIN sales ON sales.bday = days.bday
    LEFT JOIN food ON food.bday = days.bday
    LEFT JOIN labor ON labor.bday = days.bday
  ), updated AS (
    -- daily_sales no tiene llave única (user_id, sale_date): actualizar y luego insertar lo que falte.
    UPDATE daily_sales ds
       SET total_revenue = c.revenue, covers_count = c.covers, average_ticket = c.avg_ticket,
           food_cost = c.food, labor_cost = c.labor, updated_at = now()
      FROM computed c
     WHERE ds.user_id = c_owner AND ds.sale_date = c.bday
    RETURNING ds.sale_date
  )
  INSERT INTO daily_sales (user_id, sale_date, total_revenue, covers_count, average_ticket,
                           food_cost, labor_cost, other_costs, notes)
  -- other_costs: estimación plana de fijos ($90M/mes). El P&L la reemplaza por los
  -- gastos registrados en los meses que los tienen (ver expenseAllocation.ts).
  SELECT c_owner, c.bday, c.revenue, c.covers, c.avg_ticket, c.food, c.labor, 3000000,
         'Cierre del día. Estimación de fijos: $3M/día (se reemplaza por los gastos registrados del mes).'
  FROM computed c
  WHERE c.bday NOT IN (SELECT sale_date FROM updated);
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END $function$
;

CREATE OR REPLACE FUNCTION public._demo_seed_finance()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_owner uuid := demo_owner_id();
  v_today date := ((now() AT TIME ZONE 'America/Bogota') - interval '6 hours')::date;
  v_first_month date := date_trunc('month', (v_today - 90)::timestamp)::date;
  v_month date;
  v_bank uuid;
  v_fee numeric := 4.0;     -- 2,9 % comisión + 1,1 % retenciones
  v_rappi numeric := 26;
BEGIN
  DELETE FROM finance_settlements WHERE user_id = c_owner;
  DELETE FROM restaurant_expenses WHERE user_id = c_owner AND recurrence_parent IS NOT NULL;
  DELETE FROM restaurant_expenses WHERE user_id = c_owner;
  DELETE FROM finance_accounts WHERE user_id = c_owner;
  DELETE FROM finance_settings WHERE user_id = c_owner;

  INSERT INTO finance_settings (user_id, card_fee_pct, card_withholding_pct, card_settlement_days, digital_fee_pct,
                                rappi_commission_pct, rappi_settlement_days, supplier_payment_days, min_cash_buffer)
  VALUES (c_owner, 2.9, 1.1, 1, 0, v_rappi, 14, 20, 25000000);

  INSERT INTO finance_accounts (user_id, name, account_type, balance, balance_as_of)
  VALUES (c_owner, 'Bancolombia corriente', 'bank', 46800000, v_today)
  RETURNING id INTO v_bank;
  INSERT INTO finance_accounts (user_id, name, account_type, balance, balance_as_of)
  VALUES (c_owner, 'Caja menor', 'cash', 1200000, v_today);

  -- Fijos mensuales (plantillas en el primer mes; las ocurrencias se materializan abajo)
  INSERT INTO restaurant_expenses (user_id, expense_date, category, description, vendor, amount, is_fixed,
                                   status, due_date, recurrence)
  VALUES
    (c_owner, v_first_month + 4,  'arriendo', 'Arriendo local Laureles', 'Inmobiliaria Laureles', 30000000, true, 'pending', v_first_month + 4, 'monthly'),
    (c_owner, v_first_month + 9,  'nomina_prestaciones', 'Seguridad social y parafiscales (PILA)', 'Aportes en Línea', 28000000, true, 'pending', v_first_month + 9, 'monthly'),
    (c_owner, v_first_month,      'software_licencias', 'Licencia comercial de TV deportiva', 'DirecTV Empresas', 8000000, true, 'pending', v_first_month, 'monthly'),
    (c_owner, v_first_month + 14, 'mercadeo', 'Pauta en Instagram y Meta', 'Meta Ads', 5000000, true, 'pending', v_first_month + 14, 'monthly'),
    (c_owner, v_first_month + 2,  'software_licencias', 'POS, facturación y RestroWizard', 'RestroWizard', 650000, true, 'pending', v_first_month + 2, 'monthly'),
    (c_owner, v_first_month + 19, 'seguros', 'Póliza todo riesgo del local', 'Seguros Sura', 1200000, true, 'pending', v_first_month + 19, 'monthly');

  v_month := (v_first_month + interval '1 month')::date;
  WHILE v_month <= date_trunc('month', v_today::timestamp)::date LOOP
    PERFORM finance_materialize_recurring(v_month);
    v_month := (v_month + interval '1 month')::date;
  END LOOP;

  -- Variables y servicios de cada mes
  FOR v_month IN SELECT generate_series(v_first_month, date_trunc('month', v_today::timestamp)::date, interval '1 month')::date LOOP
    INSERT INTO restaurant_expenses (user_id, expense_date, category, description, vendor, amount, is_fixed, status, due_date)
    VALUES
      (c_owner, v_month + 7, 'servicios_publicos', 'Energía, agua y gas', 'EPM', 8400000 + (EXTRACT(MONTH FROM v_month)::int % 4) * 350000, true, 'pending', v_month + 17),
      (c_owner, v_month + 11, 'servicios_publicos', 'Internet y telefonía', 'Tigo Empresas', 450000, true, 'pending', v_month + 11),
      (c_owner, (v_month + interval '1 month - 1 day')::date, 'bancarios', 'Cuota de manejo y 4x1000', 'Bancolombia', 1350000, false, 'pending', (v_month + interval '1 month - 1 day')::date);
  END LOOP;

  -- Aseo, desechables y domicilios propios: compras semanales pagadas de contado
  INSERT INTO restaurant_expenses (user_id, expense_date, category, description, vendor, amount, is_fixed, status, due_date, paid_at, payment_method)
  SELECT c_owner, d::date, 'aseo_desechables', 'Aseo y desechables de la semana', 'Distribuidora La Aurora',
         650000 + (EXTRACT(DOY FROM d)::int % 5) * 60000, false, 'paid', d::date, d::date, 'Efectivo'
  FROM generate_series(v_today - 84, v_today - 1, interval '7 days') d;
  INSERT INTO restaurant_expenses (user_id, expense_date, category, description, vendor, amount, is_fixed, status, due_date, paid_at, payment_method)
  SELECT c_owner, d::date, 'domicilios', 'Mensajeros de domicilios propios', 'Mensajería Express Laureles',
         230000 + (EXTRACT(DOY FROM d)::int % 3) * 40000, false, 'paid', d::date, d::date, 'Transferencia'
  FROM generate_series(v_today - 83, v_today - 1, interval '7 days') d;

  -- Mantenimientos puntuales
  INSERT INTO restaurant_expenses (user_id, expense_date, category, description, vendor, amount, is_fixed, status, due_date, paid_at, payment_method, notes)
  VALUES
    (c_owner, v_today - 18, 'mantenimiento', 'Reparación del cuarto frío', 'Frío Industrial Antioquia', 1850000, false, 'paid', v_today - 18, v_today - 15, 'Transferencia', 'Compresor con fuga de gas'),
    (c_owner, v_today - 2, 'mantenimiento', 'Mantenimiento de campana extractora', 'Extractores del Valle', 780000, false, 'pending', v_today + 5, NULL, NULL, NULL);

  -- Lo vencido antes de hoy está pagado (el día que vencía); lo que vence de hoy en adelante queda pendiente.
  UPDATE restaurant_expenses
     SET status = 'paid', paid_at = coalesce(due_date, expense_date), payment_method = coalesce(payment_method, 'Transferencia'),
         account_id = v_bank
   WHERE user_id = c_owner AND status = 'pending' AND coalesce(due_date, expense_date) < v_today;

  -- Facturas de proveedor pagadas: fecha y medio de pago
  UPDATE supplier_invoices SET paid_at = due_date, payment_method = 'Transferencia', account_id = v_bank
   WHERE user_id = c_owner AND status = 'paid' AND paid_at IS NULL;

  -- daily_sales.other_costs (estimación plana de fijos) se deja: el P&L la ignora en
  -- los meses que ya tienen gastos registrados (manualOtherCostsNotCoveredByExpenses).

  -- Liquidaciones del datáfono: semanas lunes-domingo ya cerradas (8 semanas), depositadas al día siguiente.
  INSERT INTO finance_settlements (user_id, channel, period_start, period_end, gross_reported, fees_reported,
                                   withholdings_reported, net_deposited, deposit_date, account_id, reference, notes)
  SELECT c_owner, 'card', w.ws, w.ws + 6, round(s.gross), round(s.gross * 0.029), round(s.gross * 0.011),
         round(s.gross * (1 - v_fee / 100)) - CASE WHEN w.n = 3 THEN 412300 ELSE 0 END,
         w.ws + 7, v_bank, 'LIQ-' || to_char(w.ws, 'IYYYIW'),
         CASE WHEN w.n = 3 THEN 'Contracargo de una venta del sábado sin notificar' END
  FROM (SELECT (date_trunc('week', v_today::timestamp)::date - 7 * k) AS ws, k AS n
          FROM generate_series(1, 8) k) w
  CROSS JOIN LATERAL (
    SELECT coalesce(sum(o.total), 0) AS gross
    FROM restaurant_orders o
    WHERE o.user_id = c_owner AND o.status NOT IN ('cancelled', 'pending')
      AND finance_pay_group(o.payment_method, o.sales_channel) = 'card'
      AND ((o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date BETWEEN w.ws AND w.ws + 6
  ) s
  WHERE s.gross > 0 AND w.ws >= v_today - 90;

  -- Liquidaciones de Rappi: quincenas ya cerradas.
  INSERT INTO finance_settlements (user_id, channel, period_start, period_end, gross_reported, fees_reported,
                                   net_deposited, deposit_date, account_id, reference, notes)
  SELECT c_owner, 'rappi', w.ps, w.ps + 13, round(s.gross), round(s.gross * v_rappi / 100),
         round(s.gross * (1 - v_rappi / 100)) - CASE WHEN w.n = 2 THEN 186400 ELSE 0 END,
         w.ps + 14 + 14, v_bank, 'RAPPI-' || to_char(w.ps, 'YYYYMMDD'),
         CASE WHEN w.n = 2 THEN 'Rappi cobró un pedido cancelado por el cliente' END
  FROM (SELECT (date_trunc('week', v_today::timestamp)::date - 14 * k - 7) AS ps, k AS n
          FROM generate_series(1, 5) k) w
  CROSS JOIN LATERAL (
    SELECT coalesce(sum(o.total - coalesce(o.tip_amount, 0)), 0) AS gross
    FROM restaurant_orders o
    WHERE o.user_id = c_owner AND o.status NOT IN ('cancelled', 'pending') AND o.sales_channel = 'rappi'
      AND ((o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date BETWEEN w.ps AND w.ps + 13
  ) s
  WHERE s.gross > 0 AND w.ps >= v_today - 90 AND w.ps + 28 <= v_today;

  RETURN jsonb_build_object(
    'expenses', (SELECT count(*) FROM restaurant_expenses WHERE user_id = c_owner),
    'pending_expenses', (SELECT count(*) FROM restaurant_expenses WHERE user_id = c_owner AND status = 'pending'),
    'settlements', (SELECT count(*) FROM finance_settlements WHERE user_id = c_owner));
END $function$
;

CREATE OR REPLACE FUNCTION public._demo_seed_marketing()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_owner uuid := demo_owner_id();
  v_template uuid;
BEGIN
  DELETE FROM marketing_content WHERE user_id = c_owner;
  DELETE FROM restaurant_websites WHERE user_id = c_owner;
  DELETE FROM restaurant_brands WHERE user_id = c_owner;

  INSERT INTO restaurant_brands (user_id, brand_name, tagline, primary_color, secondary_color, accent_color,
                                 font_primary, font_secondary, brand_voice, brand_values, social_links,
                                 mission, story, target_audience, differentiators)
  VALUES (c_owner, 'Clutch Sports Bar & Grill', 'Donde se vive cada jugada',
          '#0B1F3A', '#E4572E', '#F2C14E', 'Inter', 'Inter',
          'Cercano, futbolero y directo. Hablamos como el amigo que sabe de deporte: sin exageraciones, sin descuentos de liquidación y sin mayúsculas gritonas.',
          '["Ambiente de estadio", "Cocina americana hecha en casa", "Servicio rápido en hora pico", "Mesas para el parche"]'::jsonb,
          '{"instagram": "@clutchsportsbar.demo"}'::jsonb,
          'Que ver un partido con amigos sea el mejor plan de la semana.',
          'Nacimos en Laureles para los que viven la NFL, la Champions y la Premier en grupo y con buena comida.',
          'Profesionales de 25 a 40 años de Laureles y El Poblado que ven deporte en grupo',
          '["Pantallas en todas las mesas", "Alitas y costillas ahumadas en casa", "Brunch de fin de semana"]'::jsonb);

  SELECT id INTO v_template FROM website_templates WHERE layout_type = 'bold' AND is_active LIMIT 1;

  INSERT INTO restaurant_websites (user_id, slug, template_id, is_published, site_title, meta_description,
                                   show_menu, show_delivery, show_reservations, show_contact, show_about, show_loyalty,
                                   hero_title, hero_subtitle, hero_cta_text, hero_cta_link,
                                   about_title, about_description, reservation_max_party_size, reservation_advance_days,
                                   reservation_slot_duration, business_hours, instagram_handle, footer_text, show_powered_by)
  VALUES (c_owner, 'clutch-sports-bar', v_template, true, 'Clutch Sports Bar & Grill · Laureles, Medellín',
          'Sports bar en Laureles: NFL, Champions y Premier en pantallas gigantes, alitas, costillas y brunch de fin de semana.',
          true, false, true, true, true, false,
          'Cada jugada se vive mejor aquí', '32 mesas, pantallas gigantes y la cocina abierta hasta la 1 a. m.',
          'Reservar mesa', '#reservas',
          'El plan del partido', 'Alitas, costillas ahumadas y cubetas bien frías frente a la pantalla. Reserva para el partido grande: los domingos de NFL se llena.',
          12, 30, 120,
          '{"monday":{"open":"13:00","close":"00:00"},"tuesday":{"open":"13:00","close":"00:00"},"wednesday":{"open":"13:00","close":"02:00"},"thursday":{"open":"13:00","close":"02:00"},"friday":{"open":"13:00","close":"02:00"},"saturday":{"open":"10:00","close":"02:00"},"sunday":{"open":"10:00","close":"00:00"}}'::jsonb,
          'clutchsportsbar.demo', 'Restaurante ficticio de demostración de RestroWizard.', true);
END $function$
;

CREATE OR REPLACE FUNCTION public._demo_upsert_auth_user(_id uuid, _email text, _name text, _type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
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
    SET encrypted_password = EXCLUDED.encrypted_password,
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
END $function$
;

CREATE OR REPLACE FUNCTION public._mask_email(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE WHEN p IS NULL OR position('@' in p) = 0 THEN NULL
    ELSE left(p, 1) || '***' || substr(p, position('@' in p)) END
$function$
;

CREATE OR REPLACE FUNCTION public._mask_phone(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE WHEN p IS NULL OR length(regexp_replace(p, '\D', '', 'g')) < 4 THEN NULL
    ELSE '*** ' || right(regexp_replace(p, '\D', '', 'g'), 4) END
$function$
;

CREATE OR REPLACE FUNCTION public._pos_request_ip()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT nullif(trim(split_part(coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip',
    nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
    ''), ',', 1)), '')
$function$
;

CREATE OR REPLACE FUNCTION public.ai_usage_bump(p_user uuid, p_fn text)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  INSERT INTO public.ai_usage_daily AS u (user_id, fn, day, calls, updated_at)
  VALUES (p_user, p_fn, (now() AT TIME ZONE 'America/Bogota')::date, 1, now())
  ON CONFLICT (user_id, fn, day)
  DO UPDATE SET calls = u.calls + 1, updated_at = now()
  RETURNING calls;
$function$
;

CREATE OR REPLACE FUNCTION public.assign_team_owner_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  _owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NULL OR NEW.user_id = auth.uid() THEN
    _owner := public.team_member_owner_id(auth.uid());
    IF _owner IS NOT NULL THEN
      NEW.user_id := _owner;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.award_loyalty_points(p_customer_id uuid, p_points integer, p_source text, p_description text DEFAULT NULL::text, p_source_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_new_balance int;
  v_tx_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'No autenticado');
  END IF;
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Los puntos deben ser positivos');
  END IF;

  -- Bloquea la fila del cliente: el incremento es atómico aunque dos cajas
  -- otorguen puntos a la vez (antes se leía el saldo del navegador y se
  -- escribía un absoluto -> lost update).
  SELECT user_id, current_points + p_points
    INTO v_owner, v_new_balance
  FROM public.loyalty_customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Cliente no encontrado');
  END IF;

  -- Tenencia: dueño o miembro activo del negocio.
  IF v_owner <> v_uid AND NOT EXISTS (
    SELECT 1 FROM public.restaurant_businesses b
    JOIN public.restaurant_team_members m ON m.business_id = b.id
    WHERE b.owner_id = v_owner AND m.user_id = v_uid AND m.status = 'active'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sin permiso sobre este cliente');
  END IF;

  UPDATE public.loyalty_customers
  SET current_points  = current_points + p_points,
      lifetime_points = lifetime_points + p_points,
      updated_at      = now()
  WHERE id = p_customer_id;

  INSERT INTO public.loyalty_points_transactions
    (user_id, customer_id, points, transaction_type, source, source_id, description, balance_after)
  VALUES
    (v_owner, p_customer_id, p_points, 'earn', p_source, p_source_id,
     COALESCE(p_description, '+' || p_points || ' puntos por ' || p_source), v_new_balance)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('ok', true, 'transaction_id', v_tx_id, 'balance_after', v_new_balance);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_menu_item_scores(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_items_sold INTEGER;
  item_record RECORD;
BEGIN
  SELECT COUNT(*) INTO v_total_items_sold
  FROM restaurant_orders ro,
       jsonb_array_elements(ro.items::jsonb) AS item
  WHERE ro.user_id = p_user_id
  AND ro.created_at >= NOW() - (p_days || ' days')::INTERVAL
  AND ro.status NOT IN ('cancelled', 'pending');
  
  IF v_total_items_sold = 0 THEN
    RETURN;
  END IF;
  
  FOR item_record IN 
    SELECT DISTINCT mi.id as menu_item_id, mi.price
    FROM menu_items mi
    JOIN restaurant_menus rm ON rm.id = mi.menu_id
    WHERE rm.user_id = p_user_id
  LOOP
    DECLARE
      v_item_sold INTEGER;
      v_recipe_cost NUMERIC;
      v_popularity NUMERIC;
      v_profitability NUMERIC;
      v_category VARCHAR(20);
    BEGIN
      SELECT COUNT(*) INTO v_item_sold
      FROM restaurant_orders ro,
           jsonb_array_elements(ro.items::jsonb) AS item
      WHERE ro.user_id = p_user_id
      AND (item->>'menu_item_id')::UUID = item_record.menu_item_id
      AND ro.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND ro.status NOT IN ('cancelled', 'pending');
      
      SELECT COALESCE(r.cost_per_portion, 0) INTO v_recipe_cost
      FROM recipes r
      WHERE r.menu_item_id = item_record.menu_item_id
      LIMIT 1;
      
      v_popularity := (v_item_sold::NUMERIC / v_total_items_sold) * 100;
      v_profitability := CASE WHEN item_record.price > 0 
        THEN ((item_record.price - COALESCE(v_recipe_cost, 0)) / item_record.price) * 100 
        ELSE 0 
      END;
      
      v_category := CASE
        WHEN v_popularity >= 50 AND v_profitability >= 50 THEN 'star'
        WHEN v_popularity < 50 AND v_profitability >= 50 THEN 'cash_cow'
        WHEN v_popularity >= 50 AND v_profitability < 50 THEN 'question_mark'
        ELSE 'dog'
      END;
      
      UPDATE menu_items SET
        popularity_score = v_popularity,
        profitability_score = v_profitability,
        bcg_category = v_category
      WHERE id = item_record.menu_item_id;
    END;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_profile_completeness()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  score integer := 0;
  total integer := 10;
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN score := score + 1; END IF;
  IF NEW.headline IS NOT NULL AND NEW.headline != '' THEN score := score + 1; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN score := score + 1; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN score := score + 1; END IF;
  IF NEW.city IS NOT NULL AND NEW.city != '' THEN score := score + 1; END IF;
  IF NEW.years_experience IS NOT NULL AND NEW.years_experience > 0 THEN score := score + 1; END IF;
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN score := score + 1; END IF;
  IF NEW.resume_url IS NOT NULL AND NEW.resume_url != '' THEN score := score + 1; END IF;
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url != '' THEN score := score + 1; END IF;
  IF NEW.languages IS NOT NULL AND array_length(NEW.languages, 1) > 0 THEN score := score + 1; END IF;
  NEW.profile_completeness := (score * 100) / total;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_course_completion_certificate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_cert_id UUID;
  v_course_has_cert BOOLEAN;
BEGIN
  IF NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false) THEN
    SELECT COUNT(*) INTO v_total FROM public.course_lessons WHERE course_id = NEW.course_id;
    SELECT COUNT(*) INTO v_completed FROM public.lesson_progress WHERE course_id = NEW.course_id AND user_id = NEW.user_id AND is_completed = true;
    
    IF v_total > 0 AND v_completed >= v_total THEN
      SELECT completion_certificate INTO v_course_has_cert FROM public.training_courses WHERE id = NEW.course_id;
      IF v_course_has_cert THEN
        IF NOT EXISTS (SELECT 1 FROM public.course_certificates WHERE user_id = NEW.user_id AND course_id = NEW.course_id) THEN
          INSERT INTO public.course_certificates (user_id, course_id, certificate_type)
          VALUES (NEW.user_id, NEW.course_id, 'course')
          RETURNING id INTO v_cert_id;
          
          UPDATE public.course_enrollments SET
            certificate_id = v_cert_id,
            completed_at = now(),
            progress_percent = 100,
            lessons_completed = v_completed,
            total_lessons = v_total
          WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
        END IF;
      END IF;
    END IF;
    
    -- Update enrollment progress
    UPDATE public.course_enrollments SET
      lessons_completed = v_completed,
      total_lessons = v_total,
      progress_percent = CASE WHEN v_total > 0 THEN ROUND((v_completed::numeric / v_total) * 100) ELSE 0 END,
      last_lesson_id = NEW.lesson_id
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_consultant_client(p_invitation_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_client_record consultant_clients%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Find the client by invitation token
  SELECT * INTO v_client_record
  FROM consultant_clients
  WHERE invitation_token = p_invitation_token
    AND client_user_id IS NULL
    AND claimed_at IS NULL;

  IF v_client_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already claimed invitation');
  END IF;

  -- Update the client record to link to the user
  UPDATE consultant_clients
  SET client_user_id = v_user_id,
      claimed_at = NOW(),
      status = 'active'
  WHERE id = v_client_record.id;

  RETURN json_build_object(
    'success', true, 
    'client_id', v_client_record.id,
    'consultant_id', v_client_record.consultant_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_team_invitation(p_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_member restaurant_team_members%ROWTYPE;
  v_user_id UUID;
  v_business_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  -- Buscar invitación pendiente
  SELECT * INTO v_member
  FROM restaurant_team_members
  WHERE invitation_token = p_token
    AND user_id IS NULL
    AND status = 'invited';

  IF v_member.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitación inválida o ya reclamada');
  END IF;

  -- Verificar si el usuario ya es miembro de este negocio
  IF EXISTS (
    SELECT 1 FROM restaurant_team_members 
    WHERE business_id = v_member.business_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Ya eres miembro de este equipo');
  END IF;

  -- Obtener nombre del negocio
  SELECT name INTO v_business_name
  FROM restaurant_businesses
  WHERE id = v_member.business_id;

  -- Reclamar la invitación
  UPDATE restaurant_team_members
  SET user_id = v_user_id,
      claimed_at = NOW(),
      status = 'active',
      updated_at = NOW()
  WHERE id = v_member.id;

  RETURN json_build_object(
    'success', true,
    'business_id', v_member.business_id,
    'business_name', v_business_name,
    'role', v_member.role
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.close_tip_period(p_period_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_period tip_periods%ROWTYPE;
  v_paid numeric;
  v_adj numeric;
BEGIN
  SELECT * INTO v_period FROM tip_periods WHERE id = p_period_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Período no encontrado'; END IF;
  IF current_setting('app.demo_seeding', true) IS DISTINCT FROM 'on'
     AND NOT public.team_can(v_period.user_id, ARRAY['talent'], 'write') THEN
    RAISE EXCEPTION 'Sin permiso para cerrar la quincena';
  END IF;
  IF v_period.status = 'closed' THEN RAISE EXCEPTION 'La quincena ya estaba cerrada'; END IF;
  IF v_period.computed_at IS NULL THEN RAISE EXCEPTION 'Primero calcula la liquidación'; END IF;

  SELECT COALESCE(SUM(total_amount), 0), COALESCE(SUM(adjustment), 0)
    INTO v_paid, v_adj FROM tip_allocations WHERE period_id = p_period_id;

  IF v_adj <> 0 THEN
    RAISE EXCEPTION 'Los ajustes suman % y deben sumar 0: lo que se le suma a alguien se le resta a otro', v_adj;
  END IF;
  IF v_paid <> v_period.total_tips THEN
    RAISE EXCEPTION 'No cuadra: se pagarían % y se recaudaron %', v_paid, v_period.total_tips;
  END IF;

  UPDATE tip_periods SET status = 'closed', closed_at = now(), closed_by = auth.uid()
   WHERE id = p_period_id;
  RETURN jsonb_build_object('closed', true, 'paid', v_paid);
END $function$
;

CREATE OR REPLACE FUNCTION public.compute_tip_period(p_period_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_period tip_periods%ROWTYPE;
  v_policy tip_policies%ROWTYPE;
  v_total numeric := 0;
  v_orders integer := 0;
  v_kept numeric := 0;
  v_pool numeric := 0;
  v_points numeric := 0;
  v_assigned numeric := 0;
  v_top uuid;
BEGIN
  SELECT * INTO v_period FROM tip_periods WHERE id = p_period_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Período no encontrado'; END IF;
  IF current_setting('app.demo_seeding', true) IS DISTINCT FROM 'on'
     AND NOT public.team_can(v_period.user_id, ARRAY['talent'], 'write') THEN
    RAISE EXCEPTION 'Sin permiso para liquidar propinas';
  END IF;
  IF v_period.status = 'closed' THEN RAISE EXCEPTION 'La quincena está cerrada'; END IF;

  SELECT * INTO v_policy FROM tip_policies WHERE user_id = v_period.user_id;
  IF NOT FOUND THEN
    INSERT INTO tip_policies (user_id) VALUES (v_period.user_id) RETURNING * INTO v_policy;
  END IF;

  DROP TABLE IF EXISTS _tips;
  CREATE TEMP TABLE _tips ON COMMIT DROP AS
  SELECT o.waiter_id, SUM(COALESCE(o.tip_amount, 0)) AS tips, COUNT(*) AS n
  FROM restaurant_orders o
  WHERE o.user_id = v_period.user_id
    AND o.status IN ('completed','paid','delivered')
    AND ((o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date
        BETWEEN v_period.start_date AND v_period.end_date
    AND COALESCE(o.tip_amount, 0) > 0
  GROUP BY o.waiter_id;

  SELECT COALESCE(SUM(tips), 0), COALESCE(SUM(n), 0)::int INTO v_total, v_orders FROM _tips;

  DROP TABLE IF EXISTS _work;
  CREATE TEMP TABLE _work ON COMMIT DROP AS
  SELECT s.staff_member_id,
         COUNT(DISTINCT s.shift_date)::int AS days,
         SUM(public.shift_net_hours(COALESCE(s.actual_start_time, s.start_time),
                                    COALESCE(s.actual_end_time, s.end_time), s.break_minutes)) AS hours
  FROM staff_shifts s
  WHERE s.user_id = v_period.user_id
    AND s.shift_date BETWEEN v_period.start_date AND v_period.end_date
    AND COALESCE(s.status, 'scheduled') NOT IN ('cancelled','no_show')
  GROUP BY s.staff_member_id;

  DROP TABLE IF EXISTS _keep;
  CREATE TEMP TABLE _keep ON COMMIT DROP AS
  SELECT staff_member_id, manager_factor, factor_reason, adjustment, adjustment_reason
  FROM tip_allocations WHERE period_id = p_period_id;

  DELETE FROM tip_allocations WHERE period_id = p_period_id;

  INSERT INTO tip_allocations (
    period_id, user_id, staff_member_id, staff_name, position, tip_group,
    days_worked, hours_worked, table_tips_generated, table_tips_kept,
    role_weight, manager_factor, factor_reason, adjustment, adjustment_reason)
  SELECT p_period_id, v_period.user_id, sm.id, sm.name, sm.position,
         COALESCE(w.tip_group, 'sala'),
         COALESCE(wk.days, 0), ROUND(COALESCE(wk.hours, 0), 2),
         COALESCE(t.tips, 0),
         CASE WHEN COALESCE(w.earns_table_tips, false)
              THEN ROUND(COALESCE(t.tips, 0) * v_policy.table_share_pct / 100.0) ELSE 0 END,
         CASE WHEN COALESCE(w.tip_group, 'sala') = 'excluido' THEN 0 ELSE COALESCE(w.weight, 1) END,
         COALESCE(k.manager_factor, 1), k.factor_reason,
         COALESCE(k.adjustment, 0), k.adjustment_reason
  FROM staff_members sm
  LEFT JOIN tip_role_weights w ON w.user_id = sm.user_id AND lower(w.position) = lower(sm.position)
  LEFT JOIN _work wk ON wk.staff_member_id = sm.id
  LEFT JOIN _tips t ON t.waiter_id = sm.id
  LEFT JOIN _keep k ON k.staff_member_id = sm.id
  WHERE sm.user_id = v_period.user_id
    AND (COALESCE(wk.days, 0) > 0 OR COALESCE(t.tips, 0) > 0 OR k.staff_member_id IS NOT NULL);

  SELECT COALESCE(SUM(table_tips_kept), 0) INTO v_kept FROM tip_allocations WHERE period_id = p_period_id;
  v_pool := v_total - v_kept;

  UPDATE tip_allocations
     SET shared_points = role_weight * manager_factor *
           CASE WHEN v_policy.pool_basis = 'hours' THEN hours_worked ELSE days_worked END
   WHERE period_id = p_period_id;

  SELECT COALESCE(SUM(shared_points), 0) INTO v_points FROM tip_allocations WHERE period_id = p_period_id;

  IF v_points > 0 THEN
    UPDATE tip_allocations
       SET shared_amount = FLOOR(v_pool * shared_points / v_points / v_policy.rounding) * v_policy.rounding
     WHERE period_id = p_period_id;
    SELECT COALESCE(SUM(shared_amount), 0) INTO v_assigned FROM tip_allocations WHERE period_id = p_period_id;
    SELECT id INTO v_top FROM tip_allocations WHERE period_id = p_period_id
      ORDER BY shared_points DESC, staff_name LIMIT 1;
    UPDATE tip_allocations SET shared_amount = shared_amount + (v_pool - v_assigned) WHERE id = v_top;
  END IF;

  UPDATE tip_allocations
     SET total_amount = table_tips_kept + shared_amount + adjustment
   WHERE period_id = p_period_id;

  UPDATE tip_periods
     SET total_tips = v_total, table_kept = v_kept, shared_pool = v_pool,
         orders_count = v_orders, computed_at = now()
   WHERE id = p_period_id;

  RETURN jsonb_build_object(
    'total_tips', v_total, 'table_kept', v_kept, 'shared_pool', v_pool,
    'orders', v_orders,
    'people', (SELECT COUNT(*) FROM tip_allocations WHERE period_id = p_period_id),
    'paid', (SELECT COALESCE(SUM(total_amount), 0) FROM tip_allocations WHERE period_id = p_period_id),
    'unassigned_pool', CASE WHEN v_points = 0 THEN v_pool ELSE 0 END);
END $function$
;

CREATE OR REPLACE FUNCTION public.convert_unit(p_amount numeric, p_from_unit_id uuid, p_to_unit_id uuid, p_ingredient_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_factor numeric;
  v_from_base uuid;
  v_to_base uuid;
  v_from_factor numeric;
  v_to_factor numeric;
BEGIN
  IF p_from_unit_id = p_to_unit_id THEN
    RETURN p_amount;
  END IF;

  -- 1. Conversión específica por ingrediente
  IF p_ingredient_id IS NOT NULL THEN
    SELECT conversion_factor INTO v_factor
    FROM public.unit_conversions
    WHERE from_unit_id = p_from_unit_id AND to_unit_id = p_to_unit_id
      AND ingredient_id = p_ingredient_id
    LIMIT 1;
    IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;

    SELECT 1.0 / conversion_factor INTO v_factor
    FROM public.unit_conversions
    WHERE from_unit_id = p_to_unit_id AND to_unit_id = p_from_unit_id
      AND ingredient_id = p_ingredient_id
    LIMIT 1;
    IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;
  END IF;

  -- 2. Conversión genérica directa
  SELECT conversion_factor INTO v_factor
  FROM public.unit_conversions
  WHERE from_unit_id = p_from_unit_id AND to_unit_id = p_to_unit_id
    AND ingredient_id IS NULL
  LIMIT 1;
  IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;

  SELECT 1.0 / conversion_factor INTO v_factor
  FROM public.unit_conversions
  WHERE from_unit_id = p_to_unit_id AND to_unit_id = p_from_unit_id
    AND ingredient_id IS NULL
  LIMIT 1;
  IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;

  -- 3. Vía unidad base (measurement_units.base_unit_id + conversion_factor)
  SELECT COALESCE(base_unit_id, id), COALESCE(conversion_factor, 1)
    INTO v_from_base, v_from_factor
  FROM public.measurement_units WHERE id = p_from_unit_id;

  SELECT COALESCE(base_unit_id, id), COALESCE(conversion_factor, 1)
    INTO v_to_base, v_to_factor
  FROM public.measurement_units WHERE id = p_to_unit_id;

  IF v_from_base = v_to_base AND v_to_factor > 0 THEN
    RETURN p_amount * v_from_factor / v_to_factor;
  END IF;

  -- 4. Sin cadena de conversión
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_item jsonb;
  v_menu_item_id uuid;
  v_qty numeric;
  v_recipe_id uuid;
  v_ing record;
  v_deduct numeric;
  v_converted numeric;
  v_ri_uid uuid; v_inv_uid uuid;
  v_new_stock numeric;
  v_low jsonb := '[]'::jsonb;
  v_count int := 0;
BEGIN
  SELECT user_id INTO v_owner FROM public.restaurant_orders WHERE id = p_order_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;
  IF v_owner <> v_uid AND NOT EXISTS (
     SELECT 1 FROM public.restaurant_businesses b JOIN public.restaurant_team_members tm ON tm.business_id = b.id
     WHERE b.owner_id = v_owner AND tm.user_id = v_uid AND tm.status = 'active') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_menu_item_id := (v_item->>'menu_item_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::numeric, 0);
    CONTINUE WHEN v_menu_item_id IS NULL OR v_qty <= 0;

    SELECT recipe_id INTO v_recipe_id FROM public.menu_items WHERE id = v_menu_item_id;
    IF v_recipe_id IS NULL THEN
      SELECT id INTO v_recipe_id FROM public.recipes WHERE menu_item_id = v_menu_item_id LIMIT 1;
    END IF;
    CONTINUE WHEN v_recipe_id IS NULL;

    FOR v_ing IN
      SELECT ri.inventory_item_id, ri.quantity, ri.unit AS ri_unit, ri.unit_id,
             ii.unit AS inv_unit, ii.min_stock_level, ii.item_name
      FROM public.recipe_ingredients ri
      JOIN public.inventory_items ii ON ii.id = ri.inventory_item_id
      WHERE ri.recipe_id = v_recipe_id AND ri.inventory_item_id IS NOT NULL
    LOOP
      v_deduct := COALESCE(v_ing.quantity,0) * v_qty;
      IF lower(COALESCE(v_ing.ri_unit,'')) = lower(COALESCE(v_ing.inv_unit,'')) THEN
        v_converted := v_deduct;
      ELSE
        v_ri_uid := COALESCE(v_ing.unit_id,
          (SELECT id FROM public.measurement_units WHERE lower(name)=lower(v_ing.ri_unit) OR lower(abbreviation)=lower(v_ing.ri_unit) LIMIT 1));
        v_inv_uid := (SELECT id FROM public.measurement_units WHERE lower(name)=lower(v_ing.inv_unit) OR lower(abbreviation)=lower(v_ing.inv_unit) LIMIT 1);
        v_converted := NULL;
        IF v_ri_uid IS NOT NULL AND v_inv_uid IS NOT NULL THEN
          v_converted := public.convert_unit(v_deduct, v_ri_uid, v_inv_uid, v_ing.inventory_item_id);
        END IF;
        IF v_converted IS NULL THEN v_converted := v_deduct; END IF; -- best effort si no hay cadena de conversión
      END IF;

      UPDATE public.inventory_items
      SET current_stock = GREATEST(0, COALESCE(current_stock,0) - v_converted), updated_at = now()
      WHERE id = v_ing.inventory_item_id
      RETURNING current_stock INTO v_new_stock;

      INSERT INTO public.inventory_deductions (user_id, order_id, inventory_item_id, recipe_id, quantity_deducted, unit)
      VALUES (v_owner, p_order_id, v_ing.inventory_item_id, v_recipe_id, v_converted, v_ing.inv_unit);

      v_count := v_count + 1;
      IF v_new_stock <= COALESCE(v_ing.min_stock_level, 0) THEN
        v_low := v_low || jsonb_build_object('name', v_ing.item_name, 'stock', v_new_stock, 'unit', v_ing.inv_unit);
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'deducted', v_count, 'low_stock', v_low);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.demo_owner_id()
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$ SELECT 'de300000-0000-4000-8000-000000000001'::uuid $function$
;

CREATE OR REPLACE FUNCTION public.demo_tick()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last timestamptz;
  v_n integer;
  v_today date;
BEGIN
  SELECT date_trunc('hour', MAX(created_at)) + interval '1 hour' INTO v_last
  FROM restaurant_orders WHERE user_id = demo_owner_id();
  IF v_last IS NULL OR v_last >= date_trunc('hour', now()) THEN RETURN 0; END IF;
  v_n := _demo_generate_orders(v_last, date_trunc('hour', now()));
  -- Cierre del día anterior (idempotente): queda listo apenas arranca el día nuevo.
  v_today := ((now() AT TIME ZONE 'America/Bogota') - interval '6 hours')::date;
  PERFORM _demo_refresh_daily_close(v_today - 1, v_today - 1);
  RETURN v_n;
END $function$
;

CREATE OR REPLACE FUNCTION public.ensure_user_id_for_rls()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.user_id := COALESCE(NEW.user_id, auth.uid());
  ELSE
    NEW.user_id := COALESCE(NEW.user_id, OLD.user_id, auth.uid());
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.finance_cash_flow_projection(p_owner uuid, p_weeks integer DEFAULT 13)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_weeks integer := LEAST(GREATEST(coalesce(p_weeks, 13), 1), 26);
  v_today date := ((now() AT TIME ZONE 'America/Bogota') - interval '6 hours')::date;
  v_end date;
  v_card_fee numeric := 3; v_card_wh numeric := 0; v_card_days int := 1; v_digital_fee numeric := 0;
  v_rappi_fee numeric := 25; v_rappi_days int := 14; v_supplier_days int := 20; v_buffer numeric := 0;
  v_opening numeric := 0; v_as_of date; v_accounts int := 0;
  v_food_pct numeric := 0; v_tax_rate numeric := 0;
  v_result jsonb;
BEGIN
  IF p_owner IS NULL OR p_owner NOT IN (SELECT public.team_owner_ids(ARRAY['finances'], 'read')) THEN
    RAISE EXCEPTION 'Sin acceso a las finanzas de este negocio' USING ERRCODE = '42501';
  END IF;
  v_end := v_today + v_weeks * 7 - 1;

  SELECT card_fee_pct, card_withholding_pct, card_settlement_days, digital_fee_pct,
         rappi_commission_pct, rappi_settlement_days, supplier_payment_days, min_cash_buffer
    INTO v_card_fee, v_card_wh, v_card_days, v_digital_fee, v_rappi_fee, v_rappi_days, v_supplier_days, v_buffer
    FROM finance_settings WHERE user_id = p_owner;
  IF NOT FOUND THEN
    v_card_fee := 3; v_card_wh := 0; v_card_days := 1; v_digital_fee := 0;
    v_rappi_fee := 25; v_rappi_days := 14; v_supplier_days := 20; v_buffer := 0;
  END IF;

  SELECT coalesce(sum(balance), 0), min(balance_as_of), count(*)
    INTO v_opening, v_as_of, v_accounts
    FROM finance_accounts WHERE user_id = p_owner AND is_active;

  SELECT CASE WHEN (tax_config->>'rate')::numeric > 1 THEN (tax_config->>'rate')::numeric / 100
              ELSE coalesce((tax_config->>'rate')::numeric, 0) END
    INTO v_tax_rate
    FROM restaurant_businesses WHERE owner_id = p_owner ORDER BY created_at LIMIT 1;
  v_tax_rate := coalesce(v_tax_rate, 0);

  DROP TABLE IF EXISTS _cf_hist;
  CREATE TEMP TABLE _cf_hist ON COMMIT DROP AS
  SELECT ((o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date AS bday,
         finance_pay_group(o.payment_method, o.sales_channel) AS grp,
         sum(o.total - coalesce(o.tip_amount, 0)) AS sale,
         sum(coalesce(o.tip_amount, 0)) AS tip,
         sum(coalesce(o.tax_amount, 0)) AS tax
  FROM restaurant_orders o
  WHERE o.user_id = p_owner AND o.status NOT IN ('cancelled', 'pending')
    AND o.created_at >= ((v_today - 70)::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
  GROUP BY 1, 2;

  SELECT CASE WHEN s.net > 0 THEN f.cost / s.net ELSE 0 END INTO v_food_pct
  FROM (SELECT sum(sale - tax) AS net FROM _cf_hist WHERE bday BETWEEN v_today - 30 AND v_today - 1) s,
       (SELECT coalesce(sum(d.quantity_deducted * coalesce(i.unit_cost, 0)), 0) AS cost
          FROM inventory_deductions d JOIN inventory_items i ON i.id = d.inventory_item_id
         WHERE d.user_id = p_owner
           AND d.deducted_at >= ((v_today - 30)::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
           AND d.deducted_at <  (v_today::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota') f;
  v_food_pct := LEAST(coalesce(v_food_pct, 0), 0.8);

  DROP TABLE IF EXISTS _cf_days;
  CREATE TEMP TABLE _cf_days ON COMMIT DROP AS
  WITH days AS (
    SELECT d::date AS day FROM generate_series(v_today, v_end, interval '1 day') d
  ), base AS (
    SELECT EXTRACT(ISODOW FROM bday)::int AS dow, grp,
           sum(sale) / 8.0 AS sale, sum(tip) / 8.0 AS tip, sum(tax) / 8.0 AS tax
    FROM _cf_hist WHERE bday BETWEEN v_today - 56 AND v_today - 1
    GROUP BY 1, 2
  ), lift AS (
    SELECT event_date AS day, max(expected_lift) AS lift
    FROM demand_events WHERE user_id = p_owner AND event_date BETWEEN v_today AND v_end
    GROUP BY 1
  )
  SELECT days.day, base.grp,
         base.sale * GREATEST(coalesce(lift.lift, 1), 1) AS sale,
         base.tip * GREATEST(coalesce(lift.lift, 1), 1) AS tip,
         base.tax * GREATEST(coalesce(lift.lift, 1), 1) AS tax
  FROM days
  JOIN base ON base.dow = EXTRACT(ISODOW FROM days.day)::int
  LEFT JOIN lift ON lift.day = days.day;

  DROP TABLE IF EXISTS _cf;
  CREATE TEMP TABLE _cf (day date, kind text, label text, amount numeric) ON COMMIT DROP;

  INSERT INTO _cf
  SELECT CASE grp WHEN 'card' THEN day + v_card_days WHEN 'rappi' THEN day + v_rappi_days ELSE day END,
         CASE grp WHEN 'card' THEN 'in_card' WHEN 'rappi' THEN 'in_rappi' ELSE 'in_counter' END,
         CASE grp WHEN 'card' THEN 'Depósitos datáfono' WHEN 'rappi' THEN 'Liquidaciones Rappi' ELSE 'Ventas de contado y billeteras' END,
         CASE grp
           WHEN 'card' THEN (sale + tip) * (1 - (v_card_fee + v_card_wh) / 100)
           WHEN 'rappi' THEN sale * (1 - v_rappi_fee / 100)
           WHEN 'digital' THEN sale * (1 - v_digital_fee / 100)
           ELSE sale END
  FROM _cf_days;

  INSERT INTO _cf
  SELECT bday + v_card_days, 'in_card', 'Depósitos datáfono', (sale + tip) * (1 - (v_card_fee + v_card_wh) / 100)
  FROM _cf_hist WHERE grp = 'card' AND bday >= v_today - v_card_days AND bday < v_today AND bday + v_card_days >= v_today;
  INSERT INTO _cf
  SELECT bday + v_rappi_days, 'in_rappi', 'Liquidaciones Rappi', sale * (1 - v_rappi_fee / 100)
  FROM _cf_hist WHERE grp = 'rappi' AND bday >= v_today - v_rappi_days AND bday < v_today AND bday + v_rappi_days >= v_today;

  INSERT INTO _cf
  SELECT GREATEST(coalesce(si.due_date, si.invoice_date + v_supplier_days, v_today), v_today),
         'out_suppliers', 'Proveedores: ' || coalesce(si.supplier_name, 'sin nombre'), -si.total_amount
  FROM supplier_invoices si
  WHERE si.user_id = p_owner AND coalesce(si.status, 'pending') NOT IN ('paid', 'rejected', 'cancelled')
    AND coalesce(si.total_amount, 0) > 0;

  INSERT INTO _cf
  SELECT GREATEST(coalesce(e.due_date, e.expense_date), v_today), 'out_expenses', e.description, -e.amount
  FROM restaurant_expenses e
  WHERE e.user_id = p_owner AND e.status = 'pending' AND coalesce(e.due_date, e.expense_date) <= v_end;

  INSERT INTO _cf
  SELECT x.pay_day, 'out_expenses', t.description, -t.amount
  FROM restaurant_expenses t
  CROSS JOIN LATERAL (
    SELECT m::date AS month_start,
           LEAST(m::date + (EXTRACT(DAY FROM coalesce(t.due_date, t.expense_date))::int - 1),
                 (m + interval '1 month - 1 day')::date) AS pay_day
    FROM generate_series(date_trunc('month', v_today::timestamp), date_trunc('month', v_end::timestamp), interval '1 month') m
  ) x
  WHERE t.user_id = p_owner AND t.recurrence = 'monthly' AND t.status <> 'cancelled'
    AND x.month_start > date_trunc('month', t.expense_date)
    AND x.pay_day BETWEEN v_today AND v_end
    AND NOT EXISTS (SELECT 1 FROM restaurant_expenses c
                     WHERE c.recurrence_parent = t.id
                       AND date_trunc('month', c.expense_date) = x.month_start);

  DROP TABLE IF EXISTS _cf_labor;
  CREATE TEMP TABLE _cf_labor ON COMMIT DROP AS
  WITH sched AS (
    SELECT s.shift_date AS day,
           sum(shift_net_hours(s.start_time, s.end_time, coalesce(s.break_minutes, 0))
               * coalesce(s.hourly_rate_override, sm.hourly_rate, 0)) AS cost
    FROM staff_shifts s JOIN staff_members sm ON sm.id = s.staff_member_id
    WHERE s.user_id = p_owner AND coalesce(s.status, 'scheduled') NOT IN ('cancelled', 'no_show')
      AND s.shift_date BETWEEN LEAST(date_trunc('month', v_today::timestamp)::date, v_today - 28) AND v_end
    GROUP BY 1
  ), avg_dow AS (
    SELECT EXTRACT(ISODOW FROM day)::int AS dow, avg(cost) AS cost
    FROM sched WHERE day BETWEEN v_today - 28 AND v_today - 1 GROUP BY 1
  ), days AS (
    SELECT d::date AS day FROM generate_series(date_trunc('month', v_today::timestamp), v_end, interval '1 day') d
  )
  SELECT days.day,
         coalesce(sched.cost, CASE WHEN days.day >= v_today THEN avg_dow.cost END, 0) AS cost,
         CASE WHEN EXTRACT(DAY FROM days.day) <= 15
              THEN date_trunc('month', days.day::timestamp)::date + 14
              ELSE (date_trunc('month', days.day::timestamp) + interval '1 month - 1 day')::date END AS pay_day
  FROM days
  LEFT JOIN sched ON sched.day = days.day
  LEFT JOIN avg_dow ON avg_dow.dow = EXTRACT(ISODOW FROM days.day)::int;

  INSERT INTO _cf
  SELECT pay_day, 'out_payroll', 'Nómina quincena', -sum(cost)
  FROM _cf_labor WHERE pay_day BETWEEN v_today AND v_end
  GROUP BY pay_day HAVING sum(cost) > 0;

  INSERT INTO _cf
  SELECT q.pay_day, 'out_tips', 'Propinas al equipo (datáfono)', -sum(q.tip)
  FROM (
    SELECT CASE WHEN EXTRACT(DAY FROM bday) <= 15 THEN date_trunc('month', bday::timestamp)::date + 14
                ELSE (date_trunc('month', bday::timestamp) + interval '1 month - 1 day')::date END AS pay_day, tip
    FROM _cf_hist WHERE grp = 'card' AND bday < v_today
    UNION ALL
    SELECT CASE WHEN EXTRACT(DAY FROM day) <= 15 THEN date_trunc('month', day::timestamp)::date + 14
                ELSE (date_trunc('month', day::timestamp) + interval '1 month - 1 day')::date END, tip
    FROM _cf_days WHERE grp = 'card'
  ) q
  WHERE q.pay_day BETWEEN v_today AND v_end
  GROUP BY q.pay_day HAVING sum(q.tip) > 0;

  INSERT INTO _cf
  SELECT day + v_supplier_days, 'out_purchases', 'Compras de insumos proyectadas',
         -sum(sale - tax) * v_food_pct
  FROM _cf_days
  WHERE day + v_supplier_days <= v_end
  GROUP BY day HAVING sum(sale - tax) * v_food_pct > 0;

  INSERT INTO _cf
  SELECT p.pay_day, 'out_taxes',
         'Impoconsumo ' || (ARRAY['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[EXTRACT(MONTH FROM p.period_start)::int]
           || '-' || (ARRAY['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[EXTRACT(MONTH FROM p.period_end)::int],
         -(coalesce((SELECT sum(tax) FROM _cf_hist h WHERE h.bday BETWEEN p.period_start AND LEAST(p.period_end, v_today - 1)), 0)
           + coalesce((SELECT sum(tax) FROM _cf_days d WHERE d.day BETWEEN GREATEST(p.period_start, v_today) AND p.period_end), 0))
  FROM (
    SELECT bm::date AS period_start, (bm + interval '2 months - 1 day')::date AS period_end,
           (bm + interval '2 months 14 days')::date AS pay_day
    FROM generate_series(
      make_date(EXTRACT(YEAR FROM v_today - 62)::int, ((EXTRACT(MONTH FROM v_today - 62)::int - 1) / 2) * 2 + 1, 1),
      v_end, interval '2 months') bm
  ) p
  WHERE p.pay_day BETWEEN v_today AND v_end AND v_tax_rate > 0;

  WITH weeks AS (
    SELECT w AS idx, v_today + w * 7 AS week_start, v_today + w * 7 + 6 AS week_end
    FROM generate_series(0, v_weeks - 1) w
  ), agg AS (
    SELECT wk.idx, wk.week_start, wk.week_end,
           coalesce(sum(c.amount) FILTER (WHERE c.amount > 0), 0) AS inflows,
           coalesce(-sum(c.amount) FILTER (WHERE c.amount < 0), 0) AS outflows
    FROM weeks wk
    LEFT JOIN (SELECT day, sum(amount) AS amount FROM _cf
                WHERE day BETWEEN v_today AND v_end GROUP BY day, kind) c
      ON c.day BETWEEN wk.week_start AND wk.week_end
    GROUP BY wk.idx, wk.week_start, wk.week_end
  ), kinds AS (
    SELECT wk.idx, coalesce(jsonb_object_agg(k.kind, round(k.total)) FILTER (WHERE k.kind IS NOT NULL), '{}'::jsonb) AS by_kind
    FROM weeks wk
    LEFT JOIN (SELECT ((day - v_today) / 7) AS idx, kind, sum(amount) AS total
                 FROM _cf WHERE day BETWEEN v_today AND v_end GROUP BY 1, 2) k ON k.idx = wk.idx
    GROUP BY wk.idx
  ), running AS (
    SELECT agg.idx, agg.week_start, agg.week_end, round(agg.inflows) AS inflows, round(agg.outflows) AS outflows,
           kinds.by_kind,
           round(v_opening + sum(agg.inflows - agg.outflows) OVER (ORDER BY agg.idx)) AS closing
    FROM agg JOIN kinds ON kinds.idx = agg.idx
  )
  SELECT jsonb_build_object(
    'as_of', v_today,
    'horizon_end', v_end,
    'opening_balance', round(v_opening),
    'balance_as_of', v_as_of,
    'accounts_count', v_accounts,
    'min_cash_buffer', v_buffer,
    'weeks', (SELECT jsonb_agg(jsonb_build_object(
                'week_start', week_start, 'week_end', week_end,
                'opening', closing - inflows + outflows, 'inflows', inflows, 'outflows', outflows,
                'net', inflows - outflows, 'closing', closing, 'by_kind', by_kind) ORDER BY idx) FROM running),
    'lowest', (SELECT jsonb_build_object('week_start', week_start, 'closing', closing)
                 FROM running ORDER BY closing, idx LIMIT 1),
    'first_below_buffer', (SELECT week_start FROM running WHERE closing < v_buffer ORDER BY idx LIMIT 1),
    'upcoming', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'kind', kind, 'label', label, 'amount', round(-amount))
                                           ORDER BY day, amount), '[]'::jsonb)
                   FROM (SELECT * FROM _cf WHERE amount < 0 AND day <= v_today + 13
                           AND kind IN ('out_suppliers', 'out_expenses', 'out_payroll', 'out_taxes', 'out_tips')
                         ORDER BY day, amount LIMIT 25) u),
    'assumptions', jsonb_build_object(
      'weekly_sales_projected', (SELECT round(sum(sale) / v_weeks) FROM _cf_days),
      'food_cost_pct', round(v_food_pct * 100, 1),
      'card_fee_pct', v_card_fee, 'card_withholding_pct', v_card_wh, 'card_settlement_days', v_card_days,
      'digital_fee_pct', v_digital_fee, 'rappi_commission_pct', v_rappi_fee, 'rappi_settlement_days', v_rappi_days,
      'supplier_payment_days', v_supplier_days, 'tax_rate_pct', round(v_tax_rate * 100, 2),
      'history_weeks', 8)
  ) INTO v_result;

  RETURN v_result;
END $function$
;

CREATE OR REPLACE FUNCTION public.finance_materialize_recurring(p_month date DEFAULT NULL::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_month date := date_trunc('month', coalesce(p_month, (now() AT TIME ZONE 'America/Bogota')::date))::date;
  v_n integer;
BEGIN
  INSERT INTO restaurant_expenses (user_id, expense_date, category, description, vendor, amount, is_fixed,
                                   status, due_date, recurrence, recurrence_parent, notes)
  SELECT t.user_id,
         LEAST(v_month + (EXTRACT(DAY FROM t.expense_date)::int - 1), (v_month + interval '1 month - 1 day')::date),
         t.category, t.description, t.vendor, t.amount, t.is_fixed, 'pending',
         LEAST(v_month + (EXTRACT(DAY FROM coalesce(t.due_date, t.expense_date))::int - 1), (v_month + interval '1 month - 1 day')::date),
         'none', t.id, t.notes
  FROM restaurant_expenses t
  WHERE t.recurrence = 'monthly' AND t.status <> 'cancelled'
    AND date_trunc('month', t.expense_date) < v_month
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $function$
;

CREATE OR REPLACE FUNCTION public.finance_pay_group(p_method text, p_channel text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_channel = 'rappi' OR p_method ILIKE '%rappi%' THEN 'rappi'
    WHEN p_method ILIKE ANY (ARRAY['%tarjeta%', '%card%', '%crédito%', '%credito%', '%débito%', '%debito%', '%datáfono%', '%datafono%']) THEN 'card'
    WHEN p_method ILIKE ANY (ARRAY['%nequi%', '%daviplata%', '%qr%', '%transfer%', '%pse%', '%bancolombia%', '%digital%']) THEN 'digital'
    ELSE 'cash'
  END
$function$
;

CREATE OR REPLACE FUNCTION public.finance_reconciliation(p_owner uuid, p_from date, p_to date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_card_fee numeric := 3; v_card_wh numeric := 0; v_digital_fee numeric := 0; v_rappi_fee numeric := 25;
  v_sales_from date; v_sales_to date;
  v_result jsonb;
BEGIN
  IF p_owner IS NULL OR p_owner NOT IN (SELECT public.team_owner_ids(ARRAY['finances'], 'read')) THEN
    RAISE EXCEPTION 'Sin acceso a las finanzas de este negocio' USING ERRCODE = '42501';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 186 THEN
    RAISE EXCEPTION 'Período inválido (máximo 6 meses)' USING ERRCODE = '22023';
  END IF;

  SELECT card_fee_pct, card_withholding_pct, digital_fee_pct, rappi_commission_pct
    INTO v_card_fee, v_card_wh, v_digital_fee, v_rappi_fee
    FROM finance_settings WHERE user_id = p_owner;
  IF NOT FOUND THEN v_card_fee := 3; v_card_wh := 0; v_digital_fee := 0; v_rappi_fee := 25; END IF;

  -- Una liquidación que empieza antes (o termina después) del período consultado
  -- se compara contra TODAS las ventas de su propio período, no solo las del rango.
  SELECT LEAST(p_from, coalesce(min(period_start), p_from)), GREATEST(p_to, coalesce(max(period_end), p_to))
    INTO v_sales_from, v_sales_to
    FROM finance_settlements
   WHERE user_id = p_owner AND period_end >= p_from AND period_start <= p_to;

  WITH sales AS (
    SELECT ((o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date AS bday,
           finance_pay_group(o.payment_method, o.sales_channel) AS grp,
           sum(CASE WHEN finance_pay_group(o.payment_method, o.sales_channel) = 'card'
                    THEN o.total ELSE o.total - coalesce(o.tip_amount, 0) END) AS gross,
           count(*) AS n
    FROM restaurant_orders o
    WHERE o.user_id = p_owner AND o.status NOT IN ('cancelled', 'pending')
      AND o.created_at >= (v_sales_from::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
      AND o.created_at <  ((v_sales_to + 1)::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
    GROUP BY 1, 2
  ), expected_day AS (
    SELECT bday, grp, gross, n,
           gross * CASE grp WHEN 'card' THEN (v_card_fee + v_card_wh) / 100
                            WHEN 'rappi' THEN v_rappi_fee / 100
                            WHEN 'digital' THEN v_digital_fee / 100 ELSE 0 END AS fees
    FROM sales WHERE grp IN ('card', 'rappi', 'digital')
  ), st AS (
    SELECT s.*,
           (SELECT coalesce(sum(e.gross), 0) FROM expected_day e
             WHERE e.grp = s.channel AND e.bday BETWEEN s.period_start AND s.period_end) AS exp_gross,
           (SELECT coalesce(sum(e.gross - e.fees), 0) FROM expected_day e
             WHERE e.grp = s.channel AND e.bday BETWEEN s.period_start AND s.period_end) AS exp_net
    FROM finance_settlements s
    WHERE s.user_id = p_owner AND s.period_end >= p_from AND s.period_start <= p_to
  ), st_eval AS (
    SELECT st.*, round(st.net_deposited - st.exp_net) AS diff,
           CASE WHEN abs(st.net_deposited - st.exp_net) <= GREATEST(2000, st.exp_net * 0.005) THEN 'ok'
                WHEN st.net_deposited < st.exp_net THEN 'short' ELSE 'over' END AS state
    FROM st
  ), uncovered AS (
    SELECT e.grp, sum(e.gross) AS gross, sum(e.gross - e.fees) AS net, count(DISTINCT e.bday) AS days,
           min(e.bday) AS first_day, max(e.bday) AS last_day
    FROM expected_day e
    WHERE e.bday BETWEEN p_from AND p_to
      AND NOT EXISTS (SELECT 1 FROM finance_settlements s
                       WHERE s.user_id = p_owner AND s.channel = e.grp AND e.bday BETWEEN s.period_start AND s.period_end)
    GROUP BY e.grp
  ), channels AS (
    SELECT g.grp,
           coalesce((SELECT sum(gross) FROM expected_day WHERE grp = g.grp AND bday BETWEEN p_from AND p_to), 0) AS exp_gross,
           coalesce((SELECT sum(gross - fees) FROM expected_day WHERE grp = g.grp AND bday BETWEEN p_from AND p_to), 0) AS exp_net,
           coalesce((SELECT sum(exp_net) FROM st_eval WHERE channel = g.grp), 0) AS covered_exp_net,
           coalesce((SELECT sum(net_deposited) FROM st_eval WHERE channel = g.grp), 0) AS reported_net,
           coalesce((SELECT net FROM uncovered WHERE grp = g.grp), 0) AS unreported_net,
           coalesce((SELECT days FROM uncovered WHERE grp = g.grp), 0) AS unreported_days,
           (SELECT count(*) FROM st_eval WHERE channel = g.grp AND state <> 'ok') AS issues
    FROM (VALUES ('card'), ('rappi'), ('digital')) g(grp)
  ), cash AS (
    SELECT count(*) AS sessions,
           coalesce(sum(expected_cash), 0) AS expected,
           coalesce(sum(actual_cash), 0) AS counted,
           coalesce(sum(actual_cash - expected_cash), 0) AS diff,
           count(*) FILTER (WHERE abs(coalesce(actual_cash, 0) - coalesce(expected_cash, 0)) >= 1000) AS with_diff
    FROM pos_sessions
    WHERE user_id = p_owner AND status = 'closed' AND actual_cash IS NOT NULL
      AND ((opened_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date BETWEEN p_from AND p_to
  )
  SELECT jsonb_build_object(
    'from', p_from, 'to', p_to,
    'settings', jsonb_build_object('card_fee_pct', v_card_fee, 'card_withholding_pct', v_card_wh,
                                   'digital_fee_pct', v_digital_fee, 'rappi_commission_pct', v_rappi_fee),
    'channels', (SELECT jsonb_agg(jsonb_build_object(
        'channel', grp, 'expected_gross', round(exp_gross), 'expected_net', round(exp_net),
        'covered_expected_net', round(covered_exp_net), 'reported_net', round(reported_net),
        'difference', round(reported_net - covered_exp_net),
        'unreported_net', round(unreported_net), 'unreported_days', unreported_days, 'issues', issues)
        ORDER BY CASE grp WHEN 'card' THEN 1 WHEN 'rappi' THEN 2 ELSE 3 END) FROM channels),
    'settlements', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'channel', channel, 'period_start', period_start, 'period_end', period_end,
        'deposit_date', deposit_date, 'reference', reference, 'notes', notes,
        'gross_reported', gross_reported, 'fees_reported', fees_reported, 'withholdings_reported', withholdings_reported,
        'net_deposited', round(net_deposited), 'expected_gross', round(exp_gross), 'expected_net', round(exp_net),
        'difference', diff, 'state', state) ORDER BY period_start DESC, channel), '[]'::jsonb) FROM st_eval),
    'cash', (SELECT jsonb_build_object('sessions', sessions, 'expected', round(expected), 'counted', round(counted),
                                       'difference', round(diff), 'sessions_with_difference', with_diff) FROM cash),
    'cash_sessions', (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'day') DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('id', id, 'day', ((opened_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date,
                                  'cashier', cashier_name, 'expected', round(expected_cash), 'counted', round(actual_cash),
                                  'difference', round(actual_cash - expected_cash)) AS x
        FROM pos_sessions
        WHERE user_id = p_owner AND status = 'closed' AND actual_cash IS NOT NULL
          AND abs(actual_cash - coalesce(expected_cash, 0)) >= 1000
          AND ((opened_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date BETWEEN p_from AND p_to
        ORDER BY opened_at DESC LIMIT 20) q)
  ) INTO v_result;

  RETURN v_result;
END $function$
;

CREATE OR REPLACE FUNCTION public.generate_loyalty_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.loyalty_code IS NULL THEN
    NEW.loyalty_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_menu_slug(menu_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(menu_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.restaurant_menus WHERE public_url_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_po_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_quotation_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.public_slug IS NULL THEN
        NEW.public_slug := LOWER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 12));
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_redemption_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_reservation_confirmation_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_schedule_proposal(p_owner uuid, p_week_start date, p_apply boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_max_week_hours constant numeric := 42;
  c_night_from constant integer := 19;
  c_night_pct constant numeric := 0.35;
  c_sunday_pct constant numeric := 0.90;
  c_marker constant text := 'Generado por RestroWizard';
  v_day date;
  v_dow integer;
  v_open integer;
  v_close integer;
  v_mid integer;
  v_lift numeric;
  r_rule record;
  v_need_open integer;
  v_need_close integer;
  v_block record;
  v_staff record;
  v_assigned integer;
  v_hours numeric;
  v_start time;
  v_end time;
  v_shifts jsonb := '[]'::jsonb;
  v_gaps jsonb := '[]'::jsonb;
  v_cost numeric := 0;
  v_surcharge numeric := 0;
  v_has_history boolean;
  r_day record;
BEGIN
  IF current_setting('app.demo_seeding', true) IS DISTINCT FROM 'on'
     AND NOT public.team_can(p_owner, ARRAY['talent'], CASE WHEN p_apply THEN 'write' ELSE 'read' END) THEN
    RAISE EXCEPTION 'Sin permiso para programar turnos';
  END IF;
  IF EXTRACT(ISODOW FROM p_week_start) <> 1 THEN
    RAISE EXCEPTION 'La semana debe empezar un lunes';
  END IF;

  DROP TABLE IF EXISTS _demand;
  CREATE TEMP TABLE _demand ON COMMIT DROP AS
  SELECT EXTRACT(ISODOW FROM bt)::int AS dow, EXTRACT(HOUR FROM bt)::int + 6 AS hr,
         COUNT(*)::numeric / 8.0 AS orders
  FROM (
    SELECT (o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours' AS bt
    FROM restaurant_orders o
    WHERE o.user_id = p_owner
      AND o.status IN ('completed','paid','delivered')
      AND o.created_at >= (p_week_start - 56)::timestamp AT TIME ZONE 'America/Bogota'
      AND o.created_at <  p_week_start::timestamp AT TIME ZONE 'America/Bogota'
  ) x
  GROUP BY 1, 2;

  SELECT EXISTS (SELECT 1 FROM _demand) INTO v_has_history;
  IF NOT v_has_history THEN
    RETURN jsonb_build_object('ok', false,
      'message', 'No hay ventas de las últimas 8 semanas para estimar la demanda. Importa tus ventas o registra algunas semanas en el POS.');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM staffing_rules WHERE user_id = p_owner AND is_active) THEN
    RETURN jsonb_build_object('ok', false,
      'message', 'Define cuántas órdenes por hora atiende cada cargo (reglas de dotación) para poder generar el horario.');
  END IF;

  DROP TABLE IF EXISTS _load;
  CREATE TEMP TABLE _load ON COMMIT DROP AS
  SELECT sm.id AS staff_id,
         COALESCE(SUM(public.shift_net_hours(s.start_time, s.end_time, s.break_minutes)), 0) AS hours,
         COUNT(DISTINCT s.shift_date)::int AS days
  FROM staff_members sm
  LEFT JOIN staff_shifts s ON s.staff_member_id = sm.id
       AND s.shift_date BETWEEN p_week_start AND p_week_start + 6
       AND COALESCE(s.status, 'scheduled') <> 'cancelled'
       AND (COALESCE(s.notes, '') <> c_marker OR COALESCE(s.is_published, false))
  WHERE sm.user_id = p_owner AND COALESCE(sm.is_active, true)
  GROUP BY sm.id;

  DROP TABLE IF EXISTS _taken;
  CREATE TEMP TABLE _taken (staff_id uuid, shift_date date) ON COMMIT DROP;
  INSERT INTO _taken
  SELECT s.staff_member_id, s.shift_date FROM staff_shifts s
  WHERE s.user_id = p_owner AND s.shift_date BETWEEN p_week_start AND p_week_start + 6
    AND COALESCE(s.status, 'scheduled') <> 'cancelled'
    AND (COALESCE(s.notes, '') <> c_marker OR COALESCE(s.is_published, false));

  DROP TABLE IF EXISTS _proposal;
  CREATE TEMP TABLE _proposal (
    staff_id uuid, staff_name text, position text, shift_date date,
    start_time time, end_time time, hours numeric, cost numeric, surcharge numeric, block text
  ) ON COMMIT DROP;

  FOR r_day IN
    SELECT g::date AS d, EXTRACT(ISODOW FROM g)::int AS dow
    FROM generate_series(p_week_start, p_week_start + 6, interval '1 day') g
    ORDER BY COALESCE((SELECT SUM(orders) FROM _demand WHERE dow = EXTRACT(ISODOW FROM g)::int), 0)
             * COALESCE((SELECT MAX(expected_lift) FROM demand_events WHERE user_id = p_owner AND event_date = g::date), 1) DESC
  LOOP
    v_day := r_day.d;
    v_dow := r_day.dow;

    SELECT MIN(hr), MAX(hr) + 1 INTO v_open, v_close FROM _demand WHERE dow = v_dow AND orders >= 0.5;
    IF v_open IS NULL THEN CONTINUE; END IF;
    v_open := GREATEST(v_open - 1, 0);
    v_mid := v_open + ((v_close - v_open) / 2);

    SELECT COALESCE(MAX(expected_lift), 1) INTO v_lift
    FROM demand_events WHERE user_id = p_owner AND event_date = v_day;

    FOR r_rule IN SELECT * FROM staffing_rules WHERE user_id = p_owner AND is_active ORDER BY position LOOP
      SELECT GREATEST(r_rule.min_staff, LEAST(r_rule.max_staff,
               CEIL(COALESCE(MAX(orders), 0) * v_lift / r_rule.orders_per_staff_hour)))::int
        INTO v_need_open FROM _demand WHERE dow = v_dow AND hr >= v_open AND hr < v_mid;
      SELECT GREATEST(r_rule.min_staff, LEAST(r_rule.max_staff,
               CEIL(COALESCE(MAX(orders), 0) * v_lift / r_rule.orders_per_staff_hour)))::int
        INTO v_need_close FROM _demand WHERE dow = v_dow AND hr >= v_mid AND hr < v_close;

      FOR v_block IN
        SELECT 'jornada' AS block, v_open AS h_start, v_close AS h_end,
               GREATEST(v_need_open, v_need_close) AS need
        WHERE v_close - v_open <= 9
        UNION ALL
        SELECT 'apertura', v_open, v_open + 8, v_need_open
        WHERE v_close - v_open > 9 AND NOT r_rule.peak_only
        UNION ALL
        SELECT 'cierre', v_close - 8, v_close, v_need_close
        WHERE v_close - v_open > 9
      LOOP
        v_assigned := 0;
        v_start := make_time(v_block.h_start % 24, 0, 0);
        v_end := make_time(v_block.h_end % 24, 0, 0);
        v_hours := public.shift_net_hours(v_start, v_end, 30);

        FOR v_staff IN
          SELECT sm.id, sm.name, sm.position, COALESCE(sm.hourly_rate, 0) AS rate
          FROM staff_members sm
          JOIN _load l ON l.staff_id = sm.id
          WHERE sm.user_id = p_owner AND COALESCE(sm.is_active, true)
            AND lower(sm.position) = lower(r_rule.position)
            AND NOT EXISTS (SELECT 1 FROM _taken t WHERE t.staff_id = sm.id AND t.shift_date = v_day)
            AND l.days < 6
            AND l.hours + v_hours <= LEAST(COALESCE(sm.max_hours_per_week, c_max_week_hours), c_max_week_hours)
            AND NOT EXISTS (
              SELECT 1 FROM time_off_requests tr
              WHERE tr.staff_member_id = sm.id AND tr.status = 'approved'
                AND v_day BETWEEN tr.start_date AND tr.end_date)
            AND (
              NOT EXISTS (SELECT 1 FROM staff_availability a WHERE a.staff_member_id = sm.id)
              OR EXISTS (
                SELECT 1 FROM staff_availability a
                WHERE a.staff_member_id = sm.id AND COALESCE(a.is_available, true)
                  AND a.day_of_week = (v_dow % 7)
                  AND a.start_time <= v_start
                  AND CASE WHEN v_end <= v_start
                           THEN (a.end_time <= a.start_time AND a.end_time >= v_end) OR a.end_time >= time '23:59'
                           ELSE a.end_time >= v_end OR a.end_time <= a.start_time END))
          ORDER BY l.hours ASC, l.days ASC, sm.name
          LIMIT v_block.need
        LOOP
          v_assigned := v_assigned + 1;
          INSERT INTO _proposal VALUES (
            v_staff.id, v_staff.name, v_staff.position, v_day, v_start, v_end, v_hours,
            ROUND(v_hours * v_staff.rate),
            ROUND(v_staff.rate * (
              GREATEST(0, LEAST(v_block.h_end, 30) - GREATEST(v_block.h_start, c_night_from)) * c_night_pct
              + CASE WHEN v_dow = 7 THEN v_hours * c_sunday_pct ELSE 0 END)),
            v_block.block);
          UPDATE _load SET hours = hours + v_hours, days = days + 1 WHERE staff_id = v_staff.id;
          INSERT INTO _taken VALUES (v_staff.id, v_day);
        END LOOP;

        IF v_assigned < v_block.need THEN
          v_gaps := v_gaps || jsonb_build_object(
            'date', v_day, 'position', r_rule.position, 'block', v_block.block,
            'needed', v_block.need, 'assigned', v_assigned,
            'reason', 'No hay suficientes personas disponibles sin exceder la jornada o el descanso');
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  SELECT COALESCE(SUM(cost), 0), COALESCE(SUM(surcharge), 0) INTO v_cost, v_surcharge FROM _proposal;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'staff_member_id', staff_id, 'staff_name', staff_name, 'position', position,
           'shift_date', shift_date, 'start_time', start_time, 'end_time', end_time,
           'hours', hours, 'cost', cost, 'block', block)
         ORDER BY shift_date, start_time, position, staff_name), '[]'::jsonb)
    INTO v_shifts FROM _proposal;

  IF p_apply THEN
    DELETE FROM staff_shifts
     WHERE user_id = p_owner AND shift_date BETWEEN p_week_start AND p_week_start + 6
       AND notes = c_marker AND NOT COALESCE(is_published, false);
    INSERT INTO staff_shifts (user_id, staff_member_id, shift_date, start_time, end_time,
                              break_minutes, status, notes, is_published, department)
    SELECT p_owner, staff_id, shift_date, start_time, end_time, 30, 'scheduled', c_marker, false, position
    FROM _proposal;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'week_start', p_week_start,
    'applied', p_apply,
    'shifts', v_shifts,
    'gaps', (SELECT COALESCE(jsonb_agg(g ORDER BY g->>'date', g->>'position'), '[]'::jsonb) FROM jsonb_array_elements(v_gaps) g),
    'total_hours', (SELECT COALESCE(SUM(hours), 0) FROM _proposal),
    'base_cost', v_cost,
    'estimated_surcharges', v_surcharge,
    'events', (SELECT COALESCE(jsonb_agg(jsonb_build_object('date', event_date, 'title', title, 'lift', expected_lift) ORDER BY event_date), '[]'::jsonb)
               FROM demand_events WHERE user_id = p_owner AND event_date BETWEEN p_week_start AND p_week_start + 6),
    'projected_orders', (SELECT ROUND(SUM(d.orders * COALESCE(e.lift, 1)))
               FROM _demand d
               LEFT JOIN (SELECT EXTRACT(ISODOW FROM event_date)::int AS dow, MAX(expected_lift) AS lift
                          FROM demand_events WHERE user_id = p_owner
                            AND event_date BETWEEN p_week_start AND p_week_start + 6 GROUP BY 1) e
                 ON e.dow = d.dow));
END $function$
;

CREATE OR REPLACE FUNCTION public.get_aggregated_daily_sales(p_user_id uuid, p_date date)
 RETURNS TABLE(total_revenue numeric, order_count integer, covers_count integer, food_cost numeric, labor_cost numeric, avg_ticket numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ro.total), 0)::NUMERIC as total_revenue,
    COUNT(ro.id)::INTEGER as order_count,
    COALESCE(SUM(ro.guests_count), 0)::INTEGER as covers_count,
    (SELECT COALESCE(SUM(id.quantity_deducted * COALESCE(ii.unit_cost, 0)), 0)
     FROM inventory_deductions id
     JOIN inventory_items ii ON ii.id = id.inventory_item_id
     WHERE id.user_id = p_user_id 
     AND DATE(id.deducted_at) = p_date)::NUMERIC as food_cost,
    (SELECT COALESCE(SUM(
       EXTRACT(EPOCH FROM (COALESCE(ss.actual_end_time, ss.end_time)::TIME - COALESCE(ss.actual_start_time, ss.start_time)::TIME)) / 3600 
       * COALESCE(ss.hourly_rate_override, sm.hourly_rate, 0)
     ), 0)
     FROM staff_shifts ss
     LEFT JOIN staff_members sm ON sm.id = ss.staff_member_id
     WHERE ss.user_id = p_user_id 
     AND ss.shift_date = p_date
     AND ss.status = 'completed')::NUMERIC as labor_cost,
    CASE WHEN COUNT(ro.id) > 0 THEN (SUM(ro.total) / COUNT(ro.id))::NUMERIC ELSE 0 END as avg_ticket
  FROM restaurant_orders ro
  WHERE ro.user_id = p_user_id
  AND DATE(ro.created_at) = p_date
  AND ro.status NOT IN ('cancelled', 'pending');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_customer_profile(p_email text, p_user_id uuid)
 RETURNS TABLE(customer_name text, customer_email text, customer_phone text, total_orders integer, total_spent numeric, avg_ticket numeric, last_visit timestamp with time zone, loyalty_points integer, loyalty_tier text, total_reservations integer, avg_rating numeric, feedback_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(lc.customer_name, ro.customer_name, cf.customer_name)::TEXT as customer_name,
    p_email::TEXT as customer_email,
    COALESCE(lc.customer_phone, ro.customer_phone, cf.customer_phone)::TEXT as customer_phone,
    (SELECT COUNT(*) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_orders,
    COALESCE((SELECT SUM(total) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as total_spent,
    COALESCE((SELECT AVG(total) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as avg_ticket,
    (SELECT MAX(created_at) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email)::TIMESTAMPTZ as last_visit,
    COALESCE(lc.current_points, 0)::INTEGER as loyalty_points,
    COALESCE(lt.name, 'none')::TEXT as loyalty_tier,
    (SELECT COUNT(*) FROM table_reservations WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_reservations,
    COALESCE((SELECT AVG(rating) FROM customer_feedback WHERE user_id = p_user_id AND customer_email = p_email), 0)::NUMERIC as avg_rating,
    (SELECT COUNT(*) FROM customer_feedback WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as feedback_count
  FROM (SELECT 1) as dummy
  LEFT JOIN loyalty_customers lc ON lc.user_id = p_user_id AND lc.customer_email = p_email
  LEFT JOIN loyalty_tiers lt ON lt.id = lc.tier_id
  LEFT JOIN LATERAL (
    SELECT ro2.customer_name, ro2.customer_phone FROM restaurant_orders ro2
    WHERE ro2.user_id = p_user_id AND ro2.customer_email = p_email 
    ORDER BY ro2.created_at DESC LIMIT 1
  ) ro ON true
  LEFT JOIN LATERAL (
    SELECT cf2.customer_name, cf2.customer_phone FROM customer_feedback cf2
    WHERE cf2.user_id = p_user_id AND cf2.customer_email = p_email 
    ORDER BY cf2.created_at DESC LIMIT 1
  ) cf ON true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE p_role
    WHEN 'owner' THEN '{
      "dashboard":"admin","pos":"admin","pos_reports":"admin","pos_audit":"admin","kitchen_display":"admin",
      "orders":"admin","delivery":"admin","rappi":"admin","reservations":"admin",
      "brand":"admin","recipes":"admin","menus":"admin","inventory":"admin","suppliers":"admin",
      "talent":"admin","my_development":"admin","loyalty":"admin","feedback":"admin","support":"admin",
      "finances":"admin","invoices":"admin","electronic_invoicing":"admin","sustainability":"admin",
      "new_business":"admin","pre_opening":"admin","first_90_days":"admin","ghost_kitchen":"admin","chain_management":"admin",
      "website":"admin","knowledge":"admin","settings":"admin","team":"admin","ecosystem_admin":"admin"
    }'::jsonb
    WHEN 'admin' THEN '{
      "dashboard":"admin","pos":"admin","pos_reports":"admin","pos_audit":"admin","kitchen_display":"admin",
      "orders":"admin","delivery":"admin","rappi":"admin","reservations":"admin",
      "brand":"admin","recipes":"admin","menus":"admin","inventory":"admin","suppliers":"admin",
      "talent":"admin","my_development":"admin","loyalty":"admin","feedback":"admin","support":"admin",
      "finances":"admin","invoices":"admin","electronic_invoicing":"admin","sustainability":"admin",
      "new_business":"admin","pre_opening":"admin","first_90_days":"admin","ghost_kitchen":"admin","chain_management":"admin",
      "website":"admin","knowledge":"admin","settings":"write","team":"write","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'manager' THEN '{
      "dashboard":"read","pos":"write","pos_reports":"read","pos_audit":"none","kitchen_display":"write",
      "orders":"write","delivery":"write","rappi":"write","reservations":"write",
      "brand":"none","recipes":"read","menus":"read","inventory":"write","suppliers":"read",
      "talent":"write","my_development":"read","loyalty":"read","feedback":"read","support":"write",
      "finances":"read","invoices":"read","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"read","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"read","settings":"none","team":"read","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'cashier' THEN '{
      "dashboard":"none","pos":"write","pos_reports":"none","pos_audit":"none","kitchen_display":"none",
      "orders":"write","delivery":"read","rappi":"none","reservations":"read",
      "brand":"none","recipes":"none","menus":"read","inventory":"none","suppliers":"none",
      "talent":"none","my_development":"read","loyalty":"read","feedback":"none","support":"none",
      "finances":"none","invoices":"none","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"none","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"none","settings":"none","team":"none","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'kitchen' THEN '{
      "dashboard":"none","pos":"none","pos_reports":"none","pos_audit":"none","kitchen_display":"write",
      "orders":"write","delivery":"none","rappi":"none","reservations":"none",
      "brand":"none","recipes":"read","menus":"read","inventory":"read","suppliers":"none",
      "talent":"none","my_development":"read","loyalty":"none","feedback":"none","support":"none",
      "finances":"none","invoices":"none","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"none","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"read","settings":"none","team":"none","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'staff' THEN '{
      "dashboard":"none","pos":"none","pos_reports":"none","pos_audit":"none","kitchen_display":"none",
      "orders":"none","delivery":"none","rappi":"none","reservations":"none",
      "brand":"none","recipes":"none","menus":"none","inventory":"none","suppliers":"none",
      "talent":"none","my_development":"write","loyalty":"none","feedback":"none","support":"none",
      "finances":"none","invoices":"none","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"none","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"read","settings":"none","team":"none","ecosystem_admin":"none"
    }'::jsonb
    ELSE '{}'::jsonb
  END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_platform_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_restaurants', (SELECT COUNT(*) FROM restaurant_businesses),
    'total_consultants', (SELECT COUNT(*) FROM consultant_profiles),
    'active_jobs', (SELECT COUNT(*) FROM jobs WHERE status = 'active'),
    'total_candidates', (SELECT COUNT(*) FROM candidate_profiles),
    'total_applications', (SELECT COUNT(*) FROM job_applications),
    'active_providers', (SELECT COUNT(*) FROM service_providers WHERE is_verified = true),
    'open_requests', (SELECT COUNT(*) FROM service_requests WHERE status = 'open'),
    'total_proposals', (SELECT COUNT(*) FROM service_proposals),
    'total_reviews', (SELECT COUNT(*) FROM provider_reviews),
    'published_courses', (SELECT COUNT(*) FROM training_courses WHERE is_published = true),
    'total_enrollments', (SELECT COUNT(*) FROM course_enrollments),
    'total_certificates', (SELECT COUNT(*) FROM course_certificates),
    'growth_preregistrations', (SELECT COUNT(*) FROM growth_preregistrations)
  ) INTO result;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Primero verificar si es owner de algún negocio
  SELECT id FROM restaurant_businesses WHERE owner_id = _user_id
  UNION ALL
  -- Luego verificar si es miembro de equipo activo
  SELECT business_id FROM restaurant_team_members 
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    restaurant_name,
    user_type
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'restaurant_name',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'restaurant_owner')
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _business_id uuid, _module text, _level text DEFAULT 'read'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM restaurant_businesses WHERE id = _business_id AND owner_id = _user_id) OR EXISTS (SELECT 1 FROM restaurant_team_members rtm LEFT JOIN restaurant_custom_roles rcr ON rcr.id = rtm.custom_role_id WHERE rtm.business_id = _business_id AND rtm.user_id = _user_id AND rtm.status = 'active' AND (rtm.role IN ('owner','admin') OR (CASE COALESCE(NULLIF(rtm.permissions->>_module,'none'), rcr.permissions->>_module, public.get_default_permissions_for_role(rtm.role)->>_module) WHEN 'admin' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END) >= (CASE _level WHEN 'admin' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END))); $function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.has_team_role(_user_id uuid, _business_id uuid, _role public.team_member_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_team_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND role = _role
      AND status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM restaurant_businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
$function$
;

CREATE OR REPLACE FUNCTION public.increment_campaign_responses(campaign_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.feedback_campaigns
    SET responses_count = COALESCE(responses_count, 0) + 1
    WHERE id = campaign_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_job_applications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.jobs SET applications_count = COALESCE(applications_count, 0) + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_job_views(job_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.jobs
  SET views_count = views_count + 1
  WHERE id = job_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_consultant_of(_consultant_user uuid, _client_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.consultant_clients cc
    JOIN public.consultant_profiles cp ON cp.id = cc.consultant_id
    WHERE cp.user_id = _consultant_user
      AND cc.client_user_id = _client_user
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_demo_user(_uid uuid)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT _uid IN ('de300000-0000-4000-8000-000000000001'::uuid,
                  'de300000-0000-4000-8000-000000000002'::uuid,
                  'de300000-0000-4000-8000-000000000003'::uuid);
$function$
;

CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_team_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND role = 'admin'
      AND status = 'active'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_team_lead(_user_id uuid, _business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_team_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND role IN ('admin', 'manager')
      AND status = 'active'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.log_consultant_impersonation_end(p_log_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.consultant_impersonation_log
  SET ended_at = now()
  WHERE id = p_log_id
    AND consultant_id = auth.uid()
    AND ended_at IS NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_consultant_impersonation_start(p_client_user_id uuid, p_client_business_id uuid, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.consultant_impersonation_log (
    consultant_id, client_user_id, client_business_id, user_agent
  )
  VALUES (auth.uid(), p_client_user_id, p_client_business_id, p_user_agent)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.demo_seeding', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by, notes)
    VALUES (NEW.id, NEW.status, auth.uid(), 'created');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by, notes)
    VALUES (
      NEW.id,
      NEW.status,
      auth.uid(),
      format('%s -> %s', COALESCE(OLD.status, 'null'), COALESCE(NEW.status, 'null'))
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_team_member_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND (
       OLD.role IS DISTINCT FROM NEW.role
    OR OLD.permissions IS DISTINCT FROM NEW.permissions
    OR OLD.status IS DISTINCT FROM NEW.status
  ) THEN
    INSERT INTO public.team_permissions_history (
      team_member_id, business_id, user_id, changed_by,
      old_role, new_role, old_permissions, new_permissions, old_status, new_status
    ) VALUES (
      NEW.id, NEW.business_id, NEW.user_id, auth.uid(),
      OLD.role::text, NEW.role::text, OLD.permissions, NEW.permissions, OLD.status, NEW.status
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.marketing_menu_opportunities(p_owner uuid, p_days integer DEFAULT 28)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_days integer := LEAST(GREATEST(coalesce(p_days, 28), 7), 120);
  v_rate numeric := 0;
  v_included boolean := true;
  v_result jsonb;
BEGIN
  IF p_owner IS NULL OR p_owner NOT IN (SELECT public.team_owner_ids(ARRAY['brand', 'menus', 'recipes'], 'read')) THEN
    RAISE EXCEPTION 'Sin acceso a este negocio' USING ERRCODE = '42501';
  END IF;

  SELECT CASE WHEN (tax_config->>'rate')::numeric > 1 THEN (tax_config->>'rate')::numeric / 100
              ELSE coalesce((tax_config->>'rate')::numeric, 0) END,
         coalesce((tax_config->>'included_in_price')::boolean, true)
    INTO v_rate, v_included
    FROM restaurant_businesses WHERE owner_id = p_owner ORDER BY created_at LIMIT 1;
  v_rate := coalesce(v_rate, 0);

  WITH sold AS (
    SELECT (li->>'menu_item_id')::uuid AS item_id,
           sum(coalesce((li->>'quantity')::numeric, 1)) AS units
    FROM restaurant_orders o
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(o.items) = 'array' THEN o.items ELSE '[]'::jsonb END) li
    WHERE o.user_id = p_owner AND o.status NOT IN ('cancelled', 'pending')
      AND o.created_at >= now() - make_interval(days => v_days)
      AND (li->>'menu_item_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    GROUP BY 1
  ), items AS (
    SELECT mi.id, mi.name, coalesce(mi.category, 'Sin categoría') AS category, mi.price,
           CASE WHEN v_included THEN mi.price / (1 + v_rate) ELSE mi.price END AS net_price,
           coalesce(nullif(r.cost_per_portion, 0), nullif(mi.cost, 0)) AS cost,
           coalesce(s.units, 0) AS units
    FROM menu_items mi
    JOIN restaurant_menus m ON m.id = mi.menu_id
    LEFT JOIN recipes r ON r.id = mi.recipe_id
    LEFT JOIN sold s ON s.item_id = mi.id
    WHERE m.user_id = p_owner AND coalesce(mi.is_available, true) AND coalesce(mi.price, 0) > 0
  ), calc AS (
    SELECT *, net_price - coalesce(cost, 0) AS margin,
           CASE WHEN net_price > 0 AND cost IS NOT NULL THEN (net_price - cost) / net_price END AS margin_pct
    FROM items
  ), cat_th AS (
    -- Popularidad contra los platos de su misma categoría (Kasavana–Smith): el
    -- brunch solo se vende el fin de semana y contra toda la carta salía "perro".
    SELECT category, 0.7 * coalesce(avg(units), 0) AS pop_threshold
    FROM calc GROUP BY category
  ), th AS (
    SELECT 0.7 * coalesce(avg(units), 0) AS pop_threshold,
           CASE WHEN sum(units) FILTER (WHERE cost IS NOT NULL) > 0
                THEN sum(margin * units) FILTER (WHERE cost IS NOT NULL) / sum(units) FILTER (WHERE cost IS NOT NULL)
                ELSE avg(margin) FILTER (WHERE cost IS NOT NULL) END AS margin_threshold
    FROM calc
  )
  SELECT jsonb_build_object(
    'days', v_days,
    'tax_rate_pct', round(v_rate * 100, 2),
    'popularity_threshold', round((SELECT pop_threshold FROM th), 1),
    'margin_threshold', round((SELECT margin_threshold FROM th)),
    'items', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'category', c.category, 'price', round(c.price),
        'net_price', round(c.net_price), 'cost', round(c.cost), 'margin', round(c.margin),
        'margin_pct', round(c.margin_pct * 100, 1), 'units', round(c.units),
        'revenue', round(c.price * c.units), 'contribution', round(c.margin * c.units),
        'has_cost', c.cost IS NOT NULL,
        'quadrant', CASE
          WHEN c.cost IS NULL THEN 'sin_costo'
          WHEN c.units >= ct.pop_threshold AND c.margin >= th.margin_threshold THEN 'estrella'
          WHEN c.units >= ct.pop_threshold THEN 'caballo'
          WHEN c.margin >= th.margin_threshold THEN 'rompecabezas'
          ELSE 'perro' END)
      ORDER BY c.margin * c.units DESC) FROM calc c JOIN cat_th ct ON ct.category = c.category, th), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END $function$
;

CREATE OR REPLACE FUNCTION public.match_knowledge(query_embedding public.vector, match_user_id uuid, match_count integer DEFAULT 5, min_similarity double precision DEFAULT 0.5)
 RETURNS TABLE(chunk_id uuid, source_id uuid, source_title text, source_type text, content text, similarity double precision)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    kc.id AS chunk_id,
    kc.source_id,
    ks.title AS source_title,
    ks.source_type,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_sources ks ON ks.id = kc.source_id
  WHERE kc.user_id = match_user_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > min_similarity
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$function$
;

CREATE OR REPLACE FUNCTION public.menu_out_of_stock_ids(p_owner uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH links AS (
    SELECT r.id AS recipe_id, r.menu_item_id
    FROM recipes r
    WHERE r.user_id = p_owner AND r.menu_item_id IS NOT NULL
    UNION
    SELECT l.recipe_id, l.menu_item_id
    FROM recipe_menu_items l
    JOIN recipes r ON r.id = l.recipe_id
    WHERE r.user_id = p_owner AND l.is_primary
  )
  SELECT DISTINCT links.menu_item_id
  FROM links
  JOIN recipe_ingredients ri ON ri.recipe_id = links.recipe_id
  JOIN inventory_items ii ON ii.id = ri.inventory_item_id
  WHERE p_owner IN (SELECT public.team_owner_ids(ARRAY['pos', 'orders', 'menus', 'inventory'], 'read'))
    AND NOT coalesce(ri.is_optional, false)
    AND coalesce(ii.track_stock, true)
    AND coalesce(ri.quantity, 0) > 0
    AND coalesce(ii.current_stock, 0) <
        ri.quantity * 100.0 / CASE WHEN coalesce(ri.yield_percentage, 0) > 0 THEN ri.yield_percentage ELSE 100 END;
$function$
;

CREATE OR REPLACE FUNCTION public.pos_audit_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'pos_audit_log is immutable';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.pos_audit_order_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.demo_seeding', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, before, after, amount)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'cancel', auth.uid(),
              jsonb_build_object('status', OLD.status, 'total', OLD.total),
              jsonb_build_object('status', NEW.status, 'total', NEW.total),
              NEW.total);
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, before, after)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'status_change', auth.uid(),
              jsonb_build_object('status', OLD.status),
              jsonb_build_object('status', NEW.status));
    END IF;

    IF COALESCE(OLD.discount_amount, 0) IS DISTINCT FROM COALESCE(NEW.discount_amount, 0) THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, amount, before, after)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'discount_applied', auth.uid(),
              COALESCE(NEW.discount_amount, 0) - COALESCE(OLD.discount_amount, 0),
              jsonb_build_object('discount', OLD.discount_amount),
              jsonb_build_object('discount', NEW.discount_amount));
    END IF;

    IF OLD.table_id IS DISTINCT FROM NEW.table_id THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, before, after)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'transfer_table', auth.uid(),
              jsonb_build_object('table_id', OLD.table_id),
              jsonb_build_object('table_id', NEW.table_id));
    END IF;
  ELSIF TG_OP = 'INSERT' AND NEW.is_pos_order = true THEN
    INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, after)
    VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'open', auth.uid(),
            jsonb_build_object('table_id', NEW.table_id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.pos_audit_session()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.demo_seeding', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pos_audit_log (user_id, session_id, entity, entity_id, action, actor_user_id, amount, after)
    VALUES (NEW.user_id, NEW.id, 'pos_session', NEW.id, 'open_session', auth.uid(),
            NEW.opening_cash, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'closed' THEN
    INSERT INTO public.pos_audit_log (user_id, session_id, entity, entity_id, action, actor_user_id, amount, before, after)
    VALUES (NEW.user_id, NEW.id, 'pos_session', NEW.id, 'close_session', auth.uid(),
            NEW.cash_difference,
            jsonb_build_object('opening_cash', OLD.opening_cash, 'status', OLD.status),
            to_jsonb(NEW));

    -- Cash variance fraud signal
    IF NEW.cash_difference IS NOT NULL AND abs(NEW.cash_difference) >= GREATEST(50000, COALESCE(NEW.opening_cash, 0) * 0.10) THEN
      INSERT INTO public.pos_fraud_signals (user_id, signal_type, severity, session_id, entity, entity_id, amount, description, evidence)
      VALUES (NEW.user_id, 'cash_variance',
              CASE WHEN abs(NEW.cash_difference) >= 200000 THEN 'high' ELSE 'medium' END,
              NEW.id, 'pos_session', NEW.id, NEW.cash_difference,
              'Descuadre de caja al cierre de turno',
              jsonb_build_object('expected', NEW.expected_cash, 'actual', NEW.actual_cash, 'diff', NEW.cash_difference));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.pos_audit_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF current_setting('app.demo_seeding', true) = 'on' THEN RETURN NEW; END IF;
  -- Derivar el dueño del negocio desde la sesión (o la orden); pos_transactions no tiene user_id.
  SELECT user_id INTO v_user_id FROM public.pos_sessions WHERE id = NEW.session_id;
  IF v_user_id IS NULL AND NEW.order_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id FROM public.restaurant_orders WHERE id = NEW.order_id;
  END IF;
  v_user_id := COALESCE(v_user_id, auth.uid());

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, amount, after)
    VALUES (v_user_id, 'pos_transaction', NEW.id, 'payment', auth.uid(), NEW.amount, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('voided', 'refunded') THEN
    INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, amount, before, after)
    VALUES (v_user_id, 'pos_transaction', NEW.id, NEW.status, auth.uid(), NEW.amount,
            jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status));
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.pos_log_audit(p_user_id uuid, p_entity text, p_action text, p_entity_id uuid DEFAULT NULL::uuid, p_actor_staff_id uuid DEFAULT NULL::uuid, p_actor_name text DEFAULT NULL::text, p_actor_role text DEFAULT NULL::text, p_supervisor_staff_id uuid DEFAULT NULL::uuid, p_supervisor_name text DEFAULT NULL::text, p_authorization_id uuid DEFAULT NULL::uuid, p_session_id uuid DEFAULT NULL::uuid, p_terminal_id text DEFAULT NULL::text, p_reason text DEFAULT NULL::text, p_amount numeric DEFAULT NULL::numeric, p_before jsonb DEFAULT NULL::jsonb, p_after jsonb DEFAULT NULL::jsonb, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.pos_pin_guard(p_owner uuid, p_kind text, p_ip text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.pos_pin_record(p_owner uuid, p_kind text, p_ip text, p_ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.pos_verify_supervisor_pin(p_user_id uuid, p_pin text, p_reason_code text, p_reason_text text DEFAULT NULL::text, p_amount numeric DEFAULT NULL::numeric, p_entity text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_terminal_id text DEFAULT NULL::text, p_requester_staff_id uuid DEFAULT NULL::uuid, p_requester_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_order_inventory_deduction(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
  v_item  jsonb;
  v_menu_item_id uuid;
  v_qty numeric;
  v_recipe_id uuid;
  v_ing RECORD;
  v_deduct numeric;
  v_inv RECORD;
BEGIN
  SELECT id, user_id, items, status
    INTO v_order
  FROM public.restaurant_orders
  WHERE id = p_order_id;

  IF v_order IS NULL THEN RETURN; END IF;

  -- Idempotencia: si ya hay deducciones para esta orden, no repetir
  IF EXISTS (SELECT 1 FROM public.inventory_deductions WHERE order_id = p_order_id) THEN
    RETURN;
  END IF;

  IF v_order.items IS NULL THEN RETURN; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items::jsonb)
  LOOP
    v_menu_item_id := NULLIF(v_item->>'menu_item_id','')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::numeric, 1);

    IF v_menu_item_id IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    -- recipe link (menu_items first, then recipes side)
    SELECT recipe_id INTO v_recipe_id FROM public.menu_items WHERE id = v_menu_item_id;
    IF v_recipe_id IS NULL THEN
      SELECT id INTO v_recipe_id FROM public.recipes WHERE menu_item_id = v_menu_item_id LIMIT 1;
    END IF;
    IF v_recipe_id IS NULL THEN CONTINUE; END IF;

    FOR v_ing IN
      SELECT inventory_item_id, quantity, unit
        FROM public.recipe_ingredients
       WHERE recipe_id = v_recipe_id
         AND inventory_item_id IS NOT NULL
    LOOP
      v_deduct := COALESCE(v_ing.quantity, 0) * v_qty;
      IF v_deduct <= 0 THEN CONTINUE; END IF;

      SELECT id, current_stock, unit_cost
        INTO v_inv
      FROM public.inventory_items
      WHERE id = v_ing.inventory_item_id;

      IF v_inv IS NULL THEN CONTINUE; END IF;

      UPDATE public.inventory_items
         SET current_stock = GREATEST(0, COALESCE(current_stock,0) - v_deduct),
             updated_at = now()
       WHERE id = v_ing.inventory_item_id;

      INSERT INTO public.inventory_deductions
        (user_id, order_id, inventory_item_id, recipe_id, quantity_deducted, unit, deducted_at)
      VALUES
        (v_order.user_id, p_order_id, v_ing.inventory_item_id, v_recipe_id,
         v_deduct, v_ing.unit, now());
    END LOOP;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.public_create_reservation(p_slug text, p_customer_name text, p_customer_phone text, p_party_size integer, p_reservation_date date, p_reservation_time time without time zone, p_customer_email text DEFAULT NULL::text, p_special_requests text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_site record;
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_phone text := left(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9+]', '', 'g'), 20);
  v_name text := left(btrim(coalesce(p_customer_name, '')), 100);
  v_recent integer;
  v_code text;
BEGIN
  SELECT w.user_id, w.show_reservations, w.reservation_max_party_size, w.reservation_advance_days
    INTO v_site
    FROM restaurant_websites w
   WHERE w.slug = p_slug AND w.is_published
   LIMIT 1;
  IF v_site IS NULL THEN
    RAISE EXCEPTION 'Restaurante no encontrado' USING ERRCODE = 'P0001';
  END IF;
  IF NOT coalesce(v_site.show_reservations, false) THEN
    RAISE EXCEPTION 'Este restaurante no recibe reservas en línea' USING ERRCODE = 'P0001';
  END IF;
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'Escribe tu nombre' USING ERRCODE = 'P0001';
  END IF;
  IF length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 7 THEN
    RAISE EXCEPTION 'Teléfono inválido' USING ERRCODE = 'P0001';
  END IF;
  IF p_party_size IS NULL OR p_party_size < 1 OR p_party_size > coalesce(v_site.reservation_max_party_size, 30) THEN
    RAISE EXCEPTION 'El máximo por reserva es % personas', coalesce(v_site.reservation_max_party_size, 30) USING ERRCODE = 'P0001';
  END IF;
  IF p_reservation_date IS NULL OR p_reservation_date < v_today THEN
    RAISE EXCEPTION 'La fecha ya pasó' USING ERRCODE = 'P0001';
  END IF;
  IF p_reservation_date > v_today + coalesce(v_site.reservation_advance_days, 60) THEN
    RAISE EXCEPTION 'Solo se puede reservar con % días de anticipación', coalesce(v_site.reservation_advance_days, 60) USING ERRCODE = 'P0001';
  END IF;
  IF p_reservation_date = v_today AND p_reservation_time < (now() AT TIME ZONE 'America/Bogota')::time THEN
    RAISE EXCEPTION 'Esa hora ya pasó' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_recent FROM table_reservations
   WHERE user_id = v_site.user_id AND customer_phone = v_phone AND created_at > now() - interval '10 minutes';
  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Demasiadas solicitudes. Intenta en unos minutos.' USING ERRCODE = 'P0001';
  END IF;
  SELECT count(*) INTO v_recent FROM table_reservations
   WHERE user_id = v_site.user_id AND source = 'website' AND created_at > now() - interval '1 hour';
  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'El restaurante recibió muchas solicitudes. Intenta más tarde o llama.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO table_reservations (user_id, customer_name, customer_email, customer_phone, party_size,
                                  reservation_date, reservation_time, special_requests, source, status)
  VALUES (v_site.user_id, v_name, nullif(left(btrim(coalesce(p_customer_email, '')), 255), ''), v_phone,
          p_party_size, p_reservation_date, p_reservation_time,
          nullif(left(btrim(coalesce(p_special_requests, '')), 500), ''), 'website', 'pending')
  RETURNING confirmation_code INTO v_code;

  RETURN jsonb_build_object('ok', true, 'confirmation_code', v_code);
END $function$
;

CREATE OR REPLACE FUNCTION public.public_feedback_after_submit(p_feedback_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.public_loyalty_find(p_value text, p_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.public_loyalty_profile(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.public_loyalty_redeem(p_code text, p_catalog_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.recalculate_recipe_cost(p_recipe_id uuid, p_depth integer DEFAULT 0)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_cost numeric := 0;
  v_portions numeric;
  v_per_portion numeric;
  v_ing record;
  v_sub record;
  v_converted numeric;
  v_sub_cost numeric;
  v_sub_pp numeric;
  v_ri_uid uuid;
  v_inv_uid uuid;
BEGIN
  IF p_depth > 5 THEN
    RAISE EXCEPTION 'Recipe nesting too deep (>5 levels) — possible cycle in recipe %', p_recipe_id;
  END IF;

  -- Suma ingredientes
  FOR v_ing IN
    SELECT ri.quantity, ri.unit_id, ri.unit AS ri_unit_text, ri.cost_per_unit, ri.yield_percentage,
           ri.inventory_item_id, ii.unit AS inv_unit_text, ii.unit_cost AS inv_unit_cost
    FROM public.recipe_ingredients ri
    LEFT JOIN public.inventory_items ii ON ii.id = ri.inventory_item_id
    WHERE ri.recipe_id = p_recipe_id
  LOOP
    -- Rama inventario: usa unit_cost real; convierte por unidad de texto o measurement_units
    IF v_ing.inventory_item_id IS NOT NULL AND v_ing.inv_unit_cost IS NOT NULL THEN
      IF lower(COALESCE(v_ing.ri_unit_text,'')) = lower(COALESCE(v_ing.inv_unit_text,'')) THEN
        v_converted := v_ing.quantity;
      ELSE
        v_ri_uid := COALESCE(v_ing.unit_id,
          (SELECT id FROM public.measurement_units
           WHERE lower(name)=lower(v_ing.ri_unit_text) OR lower(abbreviation)=lower(v_ing.ri_unit_text) LIMIT 1));
        v_inv_uid := (SELECT id FROM public.measurement_units
           WHERE lower(name)=lower(v_ing.inv_unit_text) OR lower(abbreviation)=lower(v_ing.inv_unit_text) LIMIT 1);
        IF v_ri_uid IS NOT NULL AND v_inv_uid IS NOT NULL THEN
          v_converted := public.convert_unit(v_ing.quantity, v_ri_uid, v_inv_uid, v_ing.inventory_item_id);
        ELSE
          v_converted := NULL;
        END IF;
      END IF;
      IF v_converted IS NOT NULL THEN
        v_total_cost := v_total_cost + (v_converted * v_ing.inv_unit_cost
                                        / GREATEST(COALESCE(v_ing.yield_percentage,100), 1) * 100);
        CONTINUE;
      END IF;
    END IF;
    -- Fallback: cost_per_unit directo del ingrediente
    v_total_cost := v_total_cost + (COALESCE(v_ing.quantity,0) * COALESCE(v_ing.cost_per_unit,0)
                                    / GREATEST(COALESCE(v_ing.yield_percentage,100), 1) * 100);
  END LOOP;

  -- Suma sub-recetas: costo POR PORCIÓN del sub (no total del lote)
  FOR v_sub IN
    SELECT sub_recipe_id, quantity FROM public.recipe_sub_recipes
    WHERE parent_recipe_id = p_recipe_id
  LOOP
    v_sub_cost := public.recalculate_recipe_cost(v_sub.sub_recipe_id, p_depth + 1);
    SELECT COALESCE(cost_per_portion, 0) INTO v_sub_pp FROM public.recipes WHERE id = v_sub.sub_recipe_id;
    v_total_cost := v_total_cost + COALESCE(v_sub_pp, 0) * COALESCE(v_sub.quantity, 1);
  END LOOP;

  SELECT GREATEST(portions, 1) INTO v_portions FROM public.recipes WHERE id = p_recipe_id;
  v_per_portion := v_total_cost / v_portions;

  UPDATE public.recipes
  SET total_cost = v_total_cost,
      cost_per_portion = v_per_portion,
      updated_at = now()
  WHERE id = p_recipe_id;

  RETURN v_total_cost;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recompute_loyalty_customer_for(_user_id uuid, _email text, _phone text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _customer_id uuid;
  _total_spent numeric := 0;
  _total_orders integer := 0;
  _first_at timestamptz;
  _last_at timestamptz;
  _avg numeric := 0;
BEGIN
  SELECT id INTO _customer_id
  FROM public.loyalty_customers
  WHERE user_id = _user_id
    AND (
      (_email IS NOT NULL AND customer_email = _email)
      OR (_phone IS NOT NULL AND customer_phone = _phone)
    )
  ORDER BY created_at ASC
  LIMIT 1;

  IF _customer_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(total), 0),
    COUNT(*),
    MIN(created_at),
    MAX(created_at)
  INTO _total_spent, _total_orders, _first_at, _last_at
  FROM public.restaurant_orders
  WHERE user_id = _user_id
    AND status IN ('completed','paid','served','closed','delivered')
    AND (
      (_email IS NOT NULL AND customer_email = _email)
      OR (_phone IS NOT NULL AND customer_phone = _phone)
    );

  IF _total_orders > 0 THEN
    _avg := _total_spent / _total_orders;
  END IF;

  UPDATE public.loyalty_customers
  SET total_spent = _total_spent,
      total_orders = _total_orders,
      avg_order_value = _avg,
      first_order_at = COALESCE(first_order_at, _first_at),
      last_order_at = _last_at,
      predicted_ltv = _avg * GREATEST(_total_orders, 1) * 1.5,
      updated_at = now()
  WHERE id = _customer_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_inventory_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.current_stock IS DISTINCT FROM NEW.current_stock THEN
    INSERT INTO public.inventory_movements (
      user_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      unit_cost,
      total_cost
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      'adjustment',
      NEW.current_stock - OLD.current_stock,
      OLD.current_stock,
      NEW.current_stock,
      NEW.unit_cost,
      (NEW.current_stock - OLD.current_stock) * COALESCE(NEW.unit_cost, 0)
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_price_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.unit_cost IS DISTINCT FROM NEW.unit_cost THEN
    INSERT INTO public.inventory_price_history (
      inventory_item_id, 
      old_price, 
      new_price, 
      change_percentage
    )
    VALUES (
      NEW.id,
      OLD.unit_cost,
      NEW.unit_cost,
      CASE WHEN OLD.unit_cost > 0 
        THEN ROUND(((NEW.unit_cost - OLD.unit_cost) / OLD.unit_cost * 100)::NUMERIC, 2)
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(p_customer_id uuid, p_catalog_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_cust public.loyalty_customers;
  v_item public.loyalty_rewards_catalog;
  v_code text;
  v_reward_id uuid;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_cust FROM public.loyalty_customers WHERE id = p_customer_id FOR UPDATE;
  IF v_cust.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Cliente no encontrado'); END IF;
  IF v_cust.user_id <> v_uid AND NOT EXISTS (
     SELECT 1 FROM public.restaurant_businesses b JOIN public.restaurant_team_members tm ON tm.business_id=b.id
     WHERE b.owner_id = v_cust.user_id AND tm.user_id = v_uid AND tm.status='active') THEN
    RETURN jsonb_build_object('ok', false, 'message', 'No autorizado');
  END IF;

  SELECT * INTO v_item FROM public.loyalty_rewards_catalog WHERE id = p_catalog_item_id AND user_id = v_cust.user_id FOR UPDATE;
  IF v_item.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa no encontrada'); END IF;
  IF COALESCE(v_item.is_active, true) = false THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa inactiva'); END IF;
  IF v_item.valid_from IS NOT NULL AND v_item.valid_from > now() THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa aún no válida'); END IF;
  IF v_item.valid_until IS NOT NULL AND v_item.valid_until < now() THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa expirada'); END IF;
  IF COALESCE(v_cust.current_points,0) < v_item.points_required THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Puntos insuficientes'); END IF;
  IF v_item.stock_limit IS NOT NULL AND COALESCE(v_item.stock_used,0) >= v_item.stock_limit THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sin stock de la recompensa'); END IF;

  BEGIN v_code := public.generate_redemption_code();
  EXCEPTION WHEN OTHERS THEN v_code := 'RW' || upper(substr(md5(random()::text),1,8)); END;

  v_new_balance := v_cust.current_points - v_item.points_required;

  INSERT INTO public.loyalty_rewards (user_id, customer_id, catalog_item_id, points_spent, redemption_code, expires_at)
  VALUES (v_cust.user_id, p_customer_id, p_catalog_item_id, v_item.points_required, v_code, now() + interval '30 days')
  RETURNING id INTO v_reward_id;

  UPDATE public.loyalty_customers SET current_points = v_new_balance, updated_at = now() WHERE id = p_customer_id;

  INSERT INTO public.loyalty_points_transactions (user_id, customer_id, points, transaction_type, source, source_id, description, balance_after)
  VALUES (v_cust.user_id, p_customer_id, -v_item.points_required, 'redeem', 'reward_redemption', v_reward_id, 'Canje: ' || v_item.name, v_new_balance);

  IF v_item.stock_limit IS NOT NULL THEN
    UPDATE public.loyalty_rewards_catalog SET stock_used = COALESCE(stock_used,0) + 1, updated_at = now() WHERE id = p_catalog_item_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'redemption_code', v_code, 'reward_id', v_reward_id, 'new_balance', v_new_balance);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reverse_order_inventory_deduction(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT inventory_item_id, quantity_deducted FROM public.inventory_deductions WHERE order_id = p_order_id
  LOOP
    UPDATE public.inventory_items
       SET current_stock = COALESCE(current_stock,0) + r.quantity_deducted,
           updated_at = now()
     WHERE id = r.inventory_item_id;
  END LOOP;
  DELETE FROM public.inventory_deductions WHERE order_id = p_order_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.seed_demo_restaurant()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        AND c.table_name NOT IN ('profiles','user_roles','restaurant_team_members','pos_audit_log')
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
          '{"type":"impoconsumo","rate":0.08,"included_in_price":true,"label":"Impoconsumo 8%"}'::jsonb, true);

  UPDATE profiles SET restaurant_name = 'Clutch Sports Bar & Grill' WHERE user_id IN (c_owner, c_mgr, c_cash);

  -- 4. Equipo (35 personas: dos turnos diarios de 13 horas con descanso legal)
  INSERT INTO staff_members (user_id, name, position, department, hourly_rate, hire_date, is_active,
                             max_hours_per_week, contract_type, performance_score, email, employee_id)
  SELECT c_owner, n, p, d, r, v_today - (60 + (i * 37) % 700), true, 42, ct,
         (62 + (i * 13) % 33)::numeric,  -- escala 0-100, igual que los restaurantes reales
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
  -- par = nivel objetivo tras el pedido (el stock arranca surtido). Antes par = 3 × reorden
  -- dejaba los 37 insumos "bajo par" y la alerta perdía sentido.
  SELECT c_owner, n, c, u, cost, stock, rp, stock, rp, sup, true, true, per
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
  UPDATE inventory_items SET current_stock = 9 WHERE user_id = c_owner AND item_name = 'Alitas de pollo';
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
  -- Cierre de cada día terminado (venta, comensales, costos). Solo días cerrados:
  -- un "hoy" a medias en daily_sales dispara alertas falsas de caída de ventas.
  PERFORM _demo_refresh_daily_close(v_from, v_today - 1);

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

  -- 15. Finanzas integrales: gastos, saldos, supuestos y liquidaciones (sobre las ventas ya generadas).
  PERFORM _demo_seed_finance();
  PERFORM _demo_seed_marketing();

  RETURN jsonb_build_object(
    'orders', v_orders,
    'revenue_30d', (SELECT SUM(total - COALESCE(tip_amount, 0)) FROM restaurant_orders
                     WHERE user_id = c_owner AND created_at >= now() - interval '30 days'),
    'staff', (SELECT COUNT(*) FROM staff_members WHERE user_id = c_owner),
    'shifts', (SELECT COUNT(*) FROM staff_shifts WHERE user_id = c_owner),
    'events', (SELECT COUNT(*) FROM demand_events WHERE user_id = c_owner),
    'tip_periods', (SELECT COUNT(*) FROM tip_periods WHERE user_id = c_owner));
END $function$
;

CREATE OR REPLACE FUNCTION public.seed_platform_admin(p_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only allow existing admins or if no admins exist yet
  IF EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') 
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Find user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Insert admin role (ignore if already exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.seed_system_roles_for_business(_business_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE r record; BEGIN FOR r IN SELECT * FROM (VALUES ('owner','Propietario','Acceso total','LayoutDashboard','/r/dashboard'), ('admin','Administrador','Gestiona el negocio','Shield','/r/dashboard'), ('manager','Gerente','Operacion diaria','Briefcase','/r/dashboard'), ('cashier','Cajero','Punto de venta','CreditCard','/r/pos'), ('kitchen','Cocina','Pantalla de cocina','ChefHat','/r/kitchen'), ('staff','Empleado','Mi desarrollo','Users','/r/my-development')) AS t(key,label,descr,icon,landing) LOOP INSERT INTO public.restaurant_custom_roles (business_id,key,label,description,base_role,permissions,default_landing,icon,is_system) VALUES (_business_id, r.key, r.label, r.descr, r.key::team_member_role, public.get_default_permissions_for_role(r.key::team_member_role), r.landing, r.icon, true) ON CONFLICT (business_id,key) DO UPDATE SET permissions = EXCLUDED.permissions, default_landing = EXCLUDED.default_landing, is_system = true, updated_at = now(); END LOOP; END; $function$
;

CREATE OR REPLACE FUNCTION public.set_staff_pin(_staff_id uuid, _pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.shift_net_hours(_start time without time zone, _end time without time zone, _break integer)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT GREATEST(0,
    (EXTRACT(EPOCH FROM (_end - _start)) / 3600.0
      + CASE WHEN _end <= _start THEN 24 ELSE 0 END)
    - COALESCE(_break, 0) / 60.0)::numeric;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_menu_item_to_recipe()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.recipe_id IS DISTINCT FROM OLD.recipe_id THEN
    IF OLD.recipe_id IS NOT NULL THEN
      UPDATE public.recipes
        SET menu_item_id = NULL
      WHERE id = OLD.recipe_id AND menu_item_id = NEW.id;
    END IF;
    IF NEW.recipe_id IS NOT NULL THEN
      UPDATE public.recipes
        SET menu_item_id = NEW.id
      WHERE id = NEW.recipe_id AND (menu_item_id IS DISTINCT FROM NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_recipe_to_menu_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Si se vincula a un nuevo platillo, escribir su recipe_id
  IF NEW.menu_item_id IS DISTINCT FROM OLD.menu_item_id THEN
    IF OLD.menu_item_id IS NOT NULL THEN
      UPDATE public.menu_items
        SET recipe_id = NULL
      WHERE id = OLD.menu_item_id AND recipe_id = NEW.id;
    END IF;
    IF NEW.menu_item_id IS NOT NULL THEN
      UPDATE public.menu_items
        SET recipe_id = NEW.id
      WHERE id = NEW.menu_item_id AND (recipe_id IS DISTINCT FROM NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_restaurant_name_to_loyalty_customer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When a loyalty customer is created or updated, sync the restaurant name
  NEW.restaurant_name := (
    SELECT COALESCE(p.restaurant_name, 'Restaurante')
    FROM profiles p
    WHERE p.id = NEW.user_id
    LIMIT 1
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.team_can(_owner uuid, _modules text[], _level text DEFAULT 'read'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _owner IS NOT NULL AND (
    _owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM restaurant_businesses b
      JOIN restaurant_team_members m ON m.business_id = b.id
      WHERE b.owner_id = _owner AND m.user_id = auth.uid() AND m.status = 'active'
        AND EXISTS (SELECT 1 FROM unnest(_modules) mod WHERE public.has_module_access(auth.uid(), b.id, mod, _level))
    )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.team_member_owner_id(_uid uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.owner_id
    FROM restaurant_team_members m
    JOIN restaurant_businesses b ON b.id = m.business_id
   WHERE m.user_id = _uid AND m.status = 'active'
     AND (auth.uid() IS NULL OR _uid = auth.uid())
     AND NOT EXISTS (SELECT 1 FROM restaurant_businesses o WHERE o.owner_id = _uid)
   ORDER BY m.created_at
   LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.team_owner_ids(_modules text[], _level text DEFAULT 'read'::text)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() WHERE auth.uid() IS NOT NULL
  UNION
  SELECT b.owner_id
  FROM restaurant_businesses b
  JOIN restaurant_team_members m ON m.business_id = b.id
  WHERE m.user_id = auth.uid() AND m.status = 'active'
    AND EXISTS (SELECT 1 FROM unnest(_modules) mod WHERE public.has_module_access(auth.uid(), b.id, mod, _level));
$function$
;

CREATE OR REPLACE FUNCTION public.tg_seed_roles_for_new_business()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.seed_system_roles_for_business(NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tg_tip_allocations_locked()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM tip_periods
   WHERE id = COALESCE(NEW.period_id, OLD.period_id);
  IF v_status = 'closed' AND current_setting('app.demo_seeding', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'La quincena está cerrada: no se puede modificar';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $function$
;

CREATE OR REPLACE FUNCTION public.trg_order_inventory_deduction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.demo_seeding', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('completed','delivered','paid') THEN
      PERFORM public.process_order_inventory_deduction(NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- transición hacia completada
    IF NEW.status IN ('completed','delivered','paid')
       AND (OLD.status IS DISTINCT FROM NEW.status)
       AND OLD.status NOT IN ('completed','delivered','paid') THEN
      PERFORM public.process_order_inventory_deduction(NEW.id);
    END IF;
    -- transición a anulada/refund
    IF NEW.status IN ('cancelled','refunded','voided')
       AND OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.reverse_order_inventory_deduction(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sync_loyalty_from_orders()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.demo_seeding', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.customer_email IS NOT NULL OR NEW.customer_phone IS NOT NULL THEN
    PERFORM public.recompute_loyalty_customer_for(NEW.user_id, NEW.customer_email, NEW.customer_phone);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_update_menu_scores_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.demo_seeding', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.status IN ('completed', 'delivered') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'delivered')) THEN
    PERFORM calculate_menu_item_scores(NEW.user_id, 30);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_course_avg_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.training_courses SET
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.course_reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_course_lesson_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.training_courses SET
    lessons_count = (SELECT COUNT(*) FROM public.course_lessons WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)),
    total_duration_minutes = (SELECT COALESCE(SUM(duration_minutes), 0) FROM public.course_lessons WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_customer_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_tier_id UUID;
  restaurant_user_id UUID;
BEGIN
  -- Get the user_id from the customer
  SELECT user_id INTO restaurant_user_id FROM public.loyalty_customers WHERE id = NEW.customer_id;
  
  -- Find the appropriate tier based on lifetime points
  SELECT id INTO new_tier_id
  FROM public.loyalty_tiers
  WHERE user_id = restaurant_user_id AND is_active = true AND min_points <= (
    SELECT lifetime_points FROM public.loyalty_customers WHERE id = NEW.customer_id
  )
  ORDER BY min_points DESC
  LIMIT 1;
  
  -- Update customer tier if different
  IF new_tier_id IS NOT NULL THEN
    UPDATE public.loyalty_customers 
    SET tier_id = new_tier_id, updated_at = now()
    WHERE id = NEW.customer_id AND (tier_id IS NULL OR tier_id != new_tier_id);
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_loyalty_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_provider_review_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.service_providers SET
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.provider_reviews WHERE provider_id = NEW.provider_id),
    reviews_count = (SELECT COUNT(*) FROM public.provider_reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_request_proposals_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.service_requests SET proposals_count = proposals_count + 1 WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.service_requests SET proposals_count = GREATEST(proposals_count - 1, 0) WHERE id = OLD.request_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_track_course_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.learning_tracks SET
    courses_count = (SELECT COUNT(*) FROM public.learning_track_courses WHERE track_id = COALESCE(NEW.track_id, OLD.track_id))
  WHERE id = COALESCE(NEW.track_id, OLD.track_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;

CREATE OR REPLACE FUNCTION public.validate_pos_discount(p_discount_id uuid, p_auth_code text, p_order_total numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_d public.pos_discounts;
  v_amount numeric;
  v_access boolean;
BEGIN
  SELECT * INTO v_d FROM public.pos_discounts WHERE id = p_discount_id;
  IF v_d.id IS NULL OR v_d.is_active = false THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'Descuento no encontrado');
  END IF;

  v_access := (v_d.user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.restaurant_businesses b
    JOIN public.restaurant_team_members tm ON tm.business_id = b.id
    WHERE b.owner_id = v_d.user_id AND tm.user_id = auth.uid() AND tm.status = 'active'
  );
  IF NOT v_access THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'No autorizado');
  END IF;

  IF v_d.requires_authorization AND (p_auth_code IS NULL OR p_auth_code <> v_d.authorization_code) THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'Código de autorización inválido');
  END IF;

  IF p_order_total < COALESCE(v_d.min_order_value, 0) THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message',
      'Pedido mínimo: $' || COALESCE(v_d.min_order_value, 0)::text);
  END IF;
  IF v_d.valid_from IS NOT NULL AND v_d.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'Descuento aún no válido');
  END IF;
  IF v_d.valid_until IS NOT NULL AND v_d.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'Descuento expirado');
  END IF;

  v_amount := CASE WHEN v_d.discount_type = 'percent'
                   THEN p_order_total * (v_d.value / 100.0)
                   ELSE v_d.value END;
  IF v_d.max_discount_amount IS NOT NULL AND v_amount > v_d.max_discount_amount THEN
    v_amount := v_d.max_discount_amount;
  END IF;

  UPDATE public.pos_discounts SET usage_count = usage_count + 1, updated_at = now() WHERE id = p_discount_id;

  RETURN jsonb_build_object('valid', true, 'amount', v_amount);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_staff_pin(_restaurant_user_id uuid, _pin text)
 RETURNS TABLE(staff_id uuid, linked_user_id uuid, staff_name text, pos_role text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

-- Tablas
CREATE TABLE public._demo_customers (
  name text,
  phone text NOT NULL,
  affinity numeric
);

CREATE TABLE public._demo_menu_weights (
  id uuid NOT NULL,
  name text,
  category text,
  price numeric,
  weight numeric,
  is_brunch_only boolean
);

CREATE TABLE public.aggregator_integrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  brand_id uuid,
  platform public.delivery_platform NOT NULL,
  store_id text,
  api_key_encrypted text,
  is_active boolean DEFAULT true,
  commission_percent numeric DEFAULT 0,
  last_sync_at timestamp with time zone,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  client_id text,
  client_secret_encrypted text,
  access_token_encrypted text,
  token_expires_at timestamp with time zone,
  store_ids text[] DEFAULT '{}'::text[],
  webhook_secret text,
  sync_status jsonb DEFAULT '{}'::jsonb,
  environment text DEFAULT 'sandbox'::text
);

CREATE TABLE public.aggregator_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  brand_id uuid,
  platform public.delivery_platform NOT NULL,
  external_order_id text,
  order_status text DEFAULT 'pending'::text,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  net_total numeric DEFAULT 0,
  customer_name text,
  delivery_address text,
  estimated_delivery timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  raw_payload jsonb,
  status_history jsonb DEFAULT '[]'::jsonb,
  rejection_reason text,
  pickup_code text,
  courier_info jsonb,
  customer_phone text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.ai_usage_daily (
  user_id uuid NOT NULL,
  fn text NOT NULL,
  day date DEFAULT ((now() AT TIME ZONE 'America/Bogota'::text))::date NOT NULL,
  calls integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.allergens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  icon text,
  severity text DEFAULT 'high'::text,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.applicant_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  headline text,
  bio text,
  experience_years integer DEFAULT 0,
  skills text[],
  resume_url text,
  linkedin_url text,
  portfolio_url text,
  preferred_locations text[],
  preferred_job_types public.job_type[],
  is_available boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  business_id uuid,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  request_id text,
  ip text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.benefit_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  staff_member_id uuid NOT NULL,
  benefit_id uuid NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  message text,
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.brand_assets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid,
  asset_type text NOT NULL,
  asset_name text,
  asset_url text,
  ai_generated boolean DEFAULT false,
  prompt_used text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.brand_menus (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  item_name text NOT NULL,
  description text,
  price numeric DEFAULT 0 NOT NULL,
  cost numeric DEFAULT 0,
  category text DEFAULT 'main'::text,
  image_url text,
  is_available boolean DEFAULT true,
  preparation_time integer DEFAULT 15,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.business_opening_projects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  project_name text NOT NULL,
  business_type text NOT NULL,
  cuisine_type text,
  city text NOT NULL,
  country text DEFAULT 'México'::text NOT NULL,
  neighborhood text,
  estimated_budget numeric,
  target_opening_date date,
  current_phase text DEFAULT 'planning'::text,
  progress_percentage numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  description text
);

CREATE TABLE public.candidate_experience (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  candidate_id uuid NOT NULL,
  company_name text NOT NULL,
  "position" text NOT NULL,
  city text,
  start_date date,
  end_date date,
  description text,
  is_current boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.candidate_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  headline text,
  bio text,
  phone text,
  city text,
  country text DEFAULT 'Colombia'::text,
  years_experience integer DEFAULT 0,
  desired_salary_min integer,
  desired_salary_max integer,
  desired_job_types text[],
  desired_categories text[],
  skills text[],
  certifications text[],
  languages text[],
  availability text DEFAULT 'immediate'::text,
  resume_url text,
  photo_url text,
  is_actively_looking boolean DEFAULT true,
  profile_completeness integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.carbon_footprint_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  item_name text NOT NULL,
  category text DEFAULT 'ingredient'::text NOT NULL,
  co2_per_kg numeric DEFAULT 0 NOT NULL,
  water_usage_liters numeric DEFAULT 0,
  is_local boolean DEFAULT false,
  supplier_name text,
  distance_km numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.chain_locations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  chain_id uuid NOT NULL,
  location_name text NOT NULL,
  location_type public.chain_location_type DEFAULT 'standard'::public.chain_location_type,
  address text NOT NULL,
  city text NOT NULL,
  state text,
  country text DEFAULT 'México'::text,
  latitude numeric,
  longitude numeric,
  manager_name text,
  manager_email text,
  phone text,
  opening_date date,
  seating_capacity integer,
  is_active boolean DEFAULT true,
  local_user_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.chain_master_menus (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  chain_id uuid NOT NULL,
  item_name text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  category text DEFAULT 'main'::text,
  image_url text,
  is_core_item boolean DEFAULT true,
  allow_local_pricing boolean DEFAULT false,
  allow_local_removal boolean DEFAULT false,
  nutritional_info jsonb DEFAULT '{}'::jsonb,
  allergens text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.compliance_checklists (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  chain_id uuid NOT NULL,
  checklist_name text NOT NULL,
  category text DEFAULT 'operations'::text,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  frequency text DEFAULT 'daily'::text,
  is_mandatory boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.compliance_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  location_id uuid NOT NULL,
  checklist_id uuid NOT NULL,
  completed_by text,
  completion_date date DEFAULT CURRENT_DATE NOT NULL,
  responses jsonb DEFAULT '{}'::jsonb NOT NULL,
  score numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.consultant_clients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  consultant_id uuid NOT NULL,
  client_user_id uuid,
  status public.consultant_client_status DEFAULT 'prospect'::public.consultant_client_status,
  start_date date,
  end_date date,
  monthly_fee numeric,
  services_included text[],
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  restaurant_name text,
  restaurant_city text,
  restaurant_cuisine_type text,
  restaurant_phone text,
  restaurant_email text,
  invitation_token uuid DEFAULT gen_random_uuid(),
  invitation_sent_at timestamp with time zone,
  claimed_at timestamp with time zone
);

CREATE TABLE public.consultant_impersonation_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  consultant_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  client_business_id uuid,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  ended_at timestamp with time zone,
  ip text,
  user_agent text
);

CREATE TABLE public.consultant_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  consultant_type public.consultant_type DEFAULT 'independent'::public.consultant_type,
  company_name text,
  specializations text[],
  bio text,
  years_experience integer DEFAULT 0,
  certifications text[],
  hourly_rate numeric,
  website_url text,
  linkedin_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  logo_url text,
  brand_colors jsonb DEFAULT '{"primary": "#000000", "secondary": "#ffffff"}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.consultant_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  consultant_id uuid NOT NULL,
  client_id uuid,
  report_title text NOT NULL,
  report_type text DEFAULT 'assessment'::text,
  content jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  is_shared_with_client boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.consulting_invoices (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  consultant_id uuid NOT NULL,
  client_id uuid NOT NULL,
  invoice_number text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'MXN'::text,
  description text,
  status text DEFAULT 'pending'::text,
  due_date date,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.copilot_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  priority public.copilot_alert_priority DEFAULT 'medium'::public.copilot_alert_priority,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  action_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.copilot_conversations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text,
  context jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.copilot_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  conversation_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.course_certificates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  course_id uuid,
  track_id uuid,
  certificate_type text DEFAULT 'course'::text NOT NULL,
  certificate_number text DEFAULT ('CERT-'::text || upper(SUBSTRING(md5((gen_random_uuid())::text) FROM 1 FOR 10))) NOT NULL,
  issued_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.course_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  course_id uuid NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  progress_percent integer DEFAULT 0 NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  lessons_completed integer DEFAULT 0 NOT NULL,
  total_lessons integer DEFAULT 0 NOT NULL,
  last_lesson_id uuid,
  certificate_id uuid,
  enrolled_via text DEFAULT 'direct'::text NOT NULL
);

CREATE TABLE public.course_lessons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  course_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  content_type text DEFAULT 'text'::text NOT NULL,
  content text,
  video_url text,
  duration_minutes integer DEFAULT 10 NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  is_free_preview boolean DEFAULT false NOT NULL,
  ai_generated boolean DEFAULT false NOT NULL,
  quiz_data jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.course_reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  course_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.customer_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  source text DEFAULT 'in_store'::text,
  rating integer,
  food_rating integer,
  service_rating integer,
  ambiance_rating integer,
  value_rating integer,
  comment text,
  sentiment_score numeric,
  sentiment_label text,
  key_topics jsonb DEFAULT '[]'::jsonb,
  ai_response_suggestion text,
  responded boolean DEFAULT false,
  response_text text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  campaign_id uuid,
  order_id uuid
);

CREATE TABLE public.daily_briefings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  briefing_date date DEFAULT CURRENT_DATE NOT NULL,
  content jsonb DEFAULT '{}'::jsonb NOT NULL,
  highlights text[],
  alerts_count integer DEFAULT 0,
  recommendations text[],
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.daily_sales (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  sale_date date DEFAULT CURRENT_DATE NOT NULL,
  total_revenue numeric DEFAULT 0 NOT NULL,
  covers_count integer DEFAULT 0,
  average_ticket numeric,
  food_cost numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  other_costs numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.debug_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  scope text NOT NULL,
  action text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.delivery_zones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  zone_name text NOT NULL,
  polygon jsonb,
  delivery_fee numeric DEFAULT 0,
  min_order numeric DEFAULT 0,
  estimated_time_minutes integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.demand_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  event_date date NOT NULL,
  start_time time without time zone,
  title text NOT NULL,
  category text DEFAULT 'deporte'::text NOT NULL,
  expected_lift numeric DEFAULT 1.3 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.event_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.event_quotations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  consultant_id uuid NOT NULL,
  restaurant_id uuid,
  zone_id uuid,
  client_type text DEFAULT 'corporate'::text,
  client_company text,
  client_contact_name text NOT NULL,
  client_email text,
  client_phone text,
  event_name text NOT NULL,
  event_type text NOT NULL,
  event_date timestamp with time zone,
  event_end_date timestamp with time zone,
  guest_count integer DEFAULT 10,
  event_duration_hours integer DEFAULT 4,
  event_description text,
  venue_cost numeric DEFAULT 0,
  menu_cost_per_person numeric DEFAULT 0,
  services_cost numeric DEFAULT 0,
  additional_costs numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  profit_margin_percentage numeric DEFAULT 20,
  status text DEFAULT 'draft'::text,
  public_slug text,
  valid_until timestamp with time zone,
  notes text,
  internal_notes text,
  sent_at timestamp with time zone,
  viewed_at timestamp with time zone,
  responded_at timestamp with time zone,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organizer_id uuid NOT NULL,
  category_id uuid,
  venue_id uuid,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  guest_count integer,
  budget numeric(12,2),
  status public.event_status DEFAULT 'draft'::public.event_status NOT NULL,
  cover_image text,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.feedback_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  qr_code_url text,
  short_url text,
  active boolean DEFAULT true,
  incentive text,
  responses_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.finance_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  account_type text DEFAULT 'bank'::text NOT NULL,
  balance numeric(16,2) DEFAULT 0 NOT NULL,
  balance_as_of date DEFAULT ((now() AT TIME ZONE 'America/Bogota'::text))::date NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.finance_settings (
  user_id uuid DEFAULT auth.uid() NOT NULL,
  card_fee_pct numeric(5,2) DEFAULT 3.00 NOT NULL,
  card_withholding_pct numeric(5,2) DEFAULT 0 NOT NULL,
  card_settlement_days integer DEFAULT 1 NOT NULL,
  digital_fee_pct numeric(5,2) DEFAULT 0 NOT NULL,
  rappi_commission_pct numeric(5,2) DEFAULT 25 NOT NULL,
  rappi_settlement_days integer DEFAULT 14 NOT NULL,
  supplier_payment_days integer DEFAULT 20 NOT NULL,
  min_cash_buffer numeric(14,2) DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.finance_settlements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  channel text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_reported numeric(14,2),
  fees_reported numeric(14,2) DEFAULT 0 NOT NULL,
  withholdings_reported numeric(14,2) DEFAULT 0 NOT NULL,
  net_deposited numeric(14,2) NOT NULL,
  deposit_date date,
  account_id uuid,
  reference text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.food_waste_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  waste_date date DEFAULT CURRENT_DATE NOT NULL,
  category public.waste_category DEFAULT 'other'::public.waste_category NOT NULL,
  item_name text NOT NULL,
  quantity_kg numeric DEFAULT 0 NOT NULL,
  estimated_cost numeric DEFAULT 0,
  reason text,
  preventable boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.growth_preregistrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  interest_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.industry_benchmarks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  metric_name text NOT NULL,
  metric_category text NOT NULL,
  avg_value numeric NOT NULL,
  percentile_25 numeric,
  percentile_75 numeric,
  sample_size integer DEFAULT 0,
  region text DEFAULT 'LATAM'::text,
  restaurant_type text DEFAULT 'casual'::text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.inventory_count_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  count_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  system_quantity numeric(10,3) NOT NULL,
  counted_quantity numeric(10,3),
  variance_quantity numeric(10,3),
  variance_value numeric(10,2),
  variance_percentage numeric(5,2),
  unit_cost numeric(10,4),
  notes text,
  counted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory_counts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  count_name character varying(200) NOT NULL,
  count_type character varying(50) DEFAULT 'full'::character varying,
  status character varying(30) DEFAULT 'in_progress'::character varying,
  storage_location_id uuid,
  scheduled_date date,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  counted_by character varying(100),
  verified_by character varying(100),
  total_items integer DEFAULT 0,
  items_counted integer DEFAULT 0,
  total_variance_value numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory_deductions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid,
  inventory_item_id uuid,
  recipe_id uuid,
  quantity_deducted numeric NOT NULL,
  unit text NOT NULL,
  deducted_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.inventory_item_suppliers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  inventory_item_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  supplier_sku character varying(100),
  unit_cost numeric(10,4) NOT NULL,
  purchase_unit character varying(50),
  units_per_purchase numeric(10,3) DEFAULT 1,
  is_preferred boolean DEFAULT false,
  min_order_quantity numeric(10,3) DEFAULT 1,
  last_ordered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  item_name text NOT NULL,
  category text DEFAULT 'general'::text,
  current_stock numeric DEFAULT 0 NOT NULL,
  unit text DEFAULT 'kg'::text NOT NULL,
  unit_cost numeric DEFAULT 0,
  reorder_point numeric DEFAULT 0,
  supplier_name text,
  last_restocked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  track_stock boolean DEFAULT true,
  alert_when_low boolean DEFAULT true,
  min_stock_level numeric(12,2) DEFAULT 0,
  storage_location_id uuid,
  par_level numeric(10,3) DEFAULT 0,
  max_level numeric(10,3),
  expiration_date date,
  lot_number character varying(100),
  barcode character varying(100),
  sku character varying(50),
  purchase_unit character varying(50),
  purchase_quantity numeric(10,3) DEFAULT 1,
  min_order_quantity numeric(10,3) DEFAULT 1,
  lead_time_days integer DEFAULT 1,
  is_perishable boolean DEFAULT false,
  shelf_life_days integer,
  preferred_supplier_id uuid,
  notes text
);

CREATE TABLE public.inventory_movements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  movement_type character varying(50) NOT NULL,
  quantity_change numeric(10,3) NOT NULL,
  quantity_before numeric(10,3) NOT NULL,
  quantity_after numeric(10,3) NOT NULL,
  unit_cost numeric(10,4),
  total_cost numeric(12,4),
  reference_type character varying(50),
  reference_id uuid,
  from_location_id uuid,
  to_location_id uuid,
  lot_number character varying(100),
  expiration_date date,
  notes text,
  performed_by character varying(100),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory_price_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  inventory_item_id uuid NOT NULL,
  supplier_id uuid,
  old_price numeric(10,4),
  new_price numeric(10,4) NOT NULL,
  change_percentage numeric(5,2),
  change_reason character varying(200),
  recorded_at timestamp with time zone DEFAULT now(),
  recorded_by uuid
);

CREATE TABLE public.inventory_suppliers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  supplier_name character varying(200) NOT NULL,
  contact_name character varying(100),
  email character varying(100),
  phone character varying(50),
  address text,
  city character varying(100),
  payment_terms character varying(100),
  minimum_order numeric(10,2),
  delivery_days character varying(100),
  lead_time_days integer DEFAULT 1,
  notes text,
  is_active boolean DEFAULT true,
  rating numeric(3,2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory_transfers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  chain_id uuid NOT NULL,
  from_location_id uuid NOT NULL,
  to_location_id uuid NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  total_value numeric DEFAULT 0,
  status text DEFAULT 'pending'::text,
  requested_by text,
  approved_by text,
  shipped_at timestamp with time zone,
  received_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.inventory_waste (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  inventory_item_id uuid NOT NULL,
  waste_date date DEFAULT CURRENT_DATE,
  quantity numeric(10,3) NOT NULL,
  unit character varying(50) NOT NULL,
  unit_cost numeric(10,4),
  total_cost numeric(12,4),
  waste_reason character varying(100) NOT NULL,
  is_preventable boolean DEFAULT false,
  lot_number character varying(100),
  storage_location_id uuid,
  notes text,
  reported_by character varying(100),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.job_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  cover_letter text,
  resume_url text,
  status public.application_status DEFAULT 'pending'::public.application_status NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  candidate_profile_id uuid,
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  ai_match_score integer,
  ai_summary text,
  interview_date timestamp with time zone,
  rejection_reason text,
  employer_notes text
);

CREATE TABLE public.job_saved (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  employer_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  benefits text,
  location text NOT NULL,
  job_type public.job_type DEFAULT 'full_time'::public.job_type NOT NULL,
  category public.job_category DEFAULT 'other'::public.job_category NOT NULL,
  experience_level public.experience_level DEFAULT 'entry'::public.experience_level NOT NULL,
  salary_min numeric(10,2),
  salary_max numeric(10,2),
  is_salary_visible boolean DEFAULT true NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  views_count integer DEFAULT 0 NOT NULL,
  applications_count integer DEFAULT 0 NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  company_name text,
  company_logo_url text,
  urgent boolean DEFAULT false,
  remote_option text DEFAULT 'onsite'::text,
  responsibilities text,
  skills_required text[],
  perks text[]
);

CREATE TABLE public.kitchen_production_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid,
  brand_id uuid,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  priority integer DEFAULT 0,
  station text DEFAULT 'main'::text,
  status text DEFAULT 'pending'::text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  assigned_to text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.knowledge_chunks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  source_id uuid NOT NULL,
  user_id uuid NOT NULL,
  chunk_index integer DEFAULT 0 NOT NULL,
  content text NOT NULL,
  embedding public.vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.knowledge_sources (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  business_id uuid,
  title text NOT NULL,
  source_type text DEFAULT 'manual'::text NOT NULL,
  source_ref text,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  indexed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.learning_track_courses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  track_id uuid NOT NULL,
  course_id uuid NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  is_mandatory boolean DEFAULT true NOT NULL
);

CREATE TABLE public.learning_tracks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  description text,
  short_description text,
  target_role text,
  difficulty text DEFAULT 'beginner'::text NOT NULL,
  estimated_weeks integer,
  courses_count integer DEFAULT 0 NOT NULL,
  enrollments_count integer DEFAULT 0 NOT NULL,
  thumbnail_url text,
  icon_emoji text,
  is_published boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lesson_progress (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  course_id uuid NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  completed_at timestamp with time zone,
  time_spent_seconds integer DEFAULT 0 NOT NULL,
  quiz_score integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.loyalty_achievements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'trophy'::text,
  achievement_type text NOT NULL,
  threshold integer NOT NULL,
  bonus_points integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.loyalty_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL,
  target_segment text,
  target_tier_ids uuid[],
  points_multiplier numeric(3,2) DEFAULT 1.00,
  bonus_points integer DEFAULT 0,
  min_order_value numeric(10,2) DEFAULT 0,
  conditions jsonb DEFAULT '{}'::jsonb,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone,
  is_active boolean DEFAULT true NOT NULL,
  uses_count integer DEFAULT 0,
  max_uses integer,
  budget_points integer,
  points_spent integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.loyalty_customer_achievements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
  points_awarded integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.loyalty_customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  tier_id uuid,
  current_points integer DEFAULT 0 NOT NULL,
  lifetime_points integer DEFAULT 0 NOT NULL,
  total_spent numeric(12,2) DEFAULT 0 NOT NULL,
  total_orders integer DEFAULT 0 NOT NULL,
  avg_order_value numeric(10,2) DEFAULT 0 NOT NULL,
  first_order_at timestamp with time zone,
  last_order_at timestamp with time zone,
  churn_risk_score numeric(3,2) DEFAULT 0,
  predicted_ltv numeric(12,2) DEFAULT 0,
  preferred_items jsonb DEFAULT '[]'::jsonb,
  preferred_order_time text,
  ai_insights jsonb DEFAULT '{}'::jsonb,
  birthday date,
  notes text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  loyalty_code text DEFAULT upper(SUBSTRING(md5((random())::text) FROM 1 FOR 8)),
  restaurant_name text
);

CREATE TABLE public.loyalty_points_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  customer_id uuid NOT NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL,
  source text NOT NULL,
  source_id uuid,
  description text,
  balance_after integer NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.loyalty_rewards (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  customer_id uuid NOT NULL,
  catalog_item_id uuid NOT NULL,
  points_spent integer NOT NULL,
  redemption_code text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  redeemed_at timestamp with time zone,
  expires_at timestamp with time zone,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.loyalty_rewards_catalog (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  points_required integer NOT NULL,
  reward_type text NOT NULL,
  reward_value numeric(10,2),
  min_tier_id uuid,
  stock_limit integer,
  stock_used integer DEFAULT 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  terms text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.loyalty_tiers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  min_points integer DEFAULT 0 NOT NULL,
  points_multiplier numeric(3,2) DEFAULT 1.00 NOT NULL,
  benefits jsonb DEFAULT '[]'::jsonb,
  color text DEFAULT '#6B7280'::text,
  icon text DEFAULT 'star'::text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.marketing_content (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  moment_date date NOT NULL,
  moment_title text NOT NULL,
  channel text NOT NULL,
  title text,
  body text NOT NULL,
  publish_at timestamp with time zone,
  status text DEFAULT 'draft'::text NOT NULL,
  menu_item_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  offer jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.maturity_action_tracking (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  diagnosis_id uuid NOT NULL,
  action_id text NOT NULL,
  action_title text NOT NULL,
  pillar_id text NOT NULL,
  priority text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.maturity_diagnoses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb NOT NULL,
  pillar_scores jsonb DEFAULT '{}'::jsonb NOT NULL,
  overall_score numeric(5,2) DEFAULT 0 NOT NULL,
  overall_level public.maturity_level DEFAULT 'inicial'::public.maturity_level NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  ai_analysis jsonb,
  ai_action_plan jsonb,
  ai_benchmark jsonb,
  restaurant_context jsonb,
  ai_generated_at timestamp with time zone
);

CREATE TABLE public.measurement_units (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  abbreviation text NOT NULL,
  category text DEFAULT 'volume'::text NOT NULL,
  base_unit_id uuid,
  conversion_factor numeric DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.menu_allergens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  name_en text NOT NULL,
  icon text,
  sort_order integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.menu_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  menu_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.menu_item_modifier_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  menu_item_id uuid NOT NULL,
  modifier_id uuid NOT NULL,
  is_required boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.menu_item_modifiers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  menu_id uuid NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'single'::text NOT NULL,
  min_selections integer DEFAULT 0,
  max_selections integer DEFAULT 1,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.menu_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  menu_id uuid NOT NULL,
  category text DEFAULT 'General'::text NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) DEFAULT 0 NOT NULL,
  image_url text,
  is_available boolean DEFAULT true NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  allergens text[],
  dietary_tags text[],
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  ai_description text,
  suggested_price numeric,
  profitability_score numeric,
  popularity_score numeric,
  bcg_category character varying(20) DEFAULT 'unknown'::character varying,
  category_id uuid,
  preparation_time_minutes integer,
  calories integer,
  spicy_level integer,
  is_new boolean DEFAULT false,
  is_bestseller boolean DEFAULT false,
  cost numeric(10,2),
  recipe_id uuid
);

CREATE TABLE public.menu_modifier_options (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  modifier_id uuid NOT NULL,
  name text NOT NULL,
  price_adjustment numeric(10,2) DEFAULT 0 NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.menu_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  preview_image text,
  cuisine_type public.cuisine_type DEFAULT 'other'::public.cuisine_type,
  is_active boolean DEFAULT true NOT NULL,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  email_notifications boolean DEFAULT true NOT NULL,
  push_notifications boolean DEFAULT true NOT NULL,
  job_alerts boolean DEFAULT true NOT NULL,
  event_reminders boolean DEFAULT true NOT NULL,
  marketing boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notifications_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.opening_analysis_runs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  current_phase text,
  phases_completed text[] DEFAULT '{}'::text[],
  phases_failed text[] DEFAULT '{}'::text[],
  total_phases integer DEFAULT 7 NOT NULL,
  error_message text,
  include_checklist boolean DEFAULT true,
  checklist_generated boolean DEFAULT false,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.opening_checklist_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid,
  phase text NOT NULL,
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.opening_phase_analyses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid,
  phase text NOT NULL,
  analysis_data jsonb,
  sources jsonb,
  recommendations jsonb,
  estimated_cost numeric,
  estimated_time_days integer,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.order_status_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid,
  status text NOT NULL,
  notes text,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payment_gateway_credentials (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  gateway text NOT NULL,
  public_key text,
  private_key text,
  is_sandbox boolean DEFAULT true NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.payment_webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  provider text NOT NULL,
  external_event_id text,
  event_type text,
  signature_valid boolean,
  payload jsonb,
  processed_at timestamp with time zone,
  error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  terminal_id text,
  actor_staff_id uuid,
  actor_user_id uuid,
  actor_name text,
  actor_role text,
  supervisor_staff_id uuid,
  supervisor_name text,
  authorization_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  reason text,
  amount numeric,
  before jsonb,
  after jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_cash_movements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id uuid NOT NULL,
  movement_type text NOT NULL,
  amount numeric(12,2) NOT NULL,
  reason text,
  authorized_by text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_discounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  discount_type text NOT NULL,
  value numeric(12,2) NOT NULL,
  min_order_value numeric(12,2) DEFAULT 0,
  max_discount_amount numeric(12,2),
  requires_authorization boolean DEFAULT false,
  authorization_code text,
  is_active boolean DEFAULT true NOT NULL,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_fraud_signals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  signal_type text NOT NULL,
  severity text DEFAULT 'medium'::text NOT NULL,
  actor_staff_id uuid,
  actor_name text,
  terminal_id text,
  session_id uuid,
  entity text,
  entity_id uuid,
  amount numeric,
  score numeric,
  description text NOT NULL,
  evidence jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'open'::text NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  resolution_notes text,
  detected_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_payment_methods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  method_name text NOT NULL,
  method_type text NOT NULL,
  provider text,
  is_active boolean DEFAULT true NOT NULL,
  requires_reference boolean DEFAULT false,
  commission_percent numeric(5,2) DEFAULT 0,
  icon text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_pin_attempts (
  id bigint DEFAULT nextval('public.pos_pin_attempts_id_seq'::regclass) NOT NULL,
  restaurant_user_id uuid NOT NULL,
  kind text NOT NULL,
  ip text,
  succeeded boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_session_closures (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  cashier_name text,
  opened_at timestamp with time zone,
  closed_at timestamp with time zone DEFAULT now() NOT NULL,
  opening_cash numeric DEFAULT 0 NOT NULL,
  expected_cash numeric,
  actual_cash numeric,
  cash_difference numeric,
  total_sales numeric DEFAULT 0 NOT NULL,
  order_count integer DEFAULT 0 NOT NULL,
  payment_breakdown jsonb DEFAULT '{}'::jsonb,
  top_items jsonb DEFAULT '[]'::jsonb,
  audit_summary jsonb DEFAULT '{}'::jsonb,
  ai_summary text,
  ai_recommendations jsonb DEFAULT '[]'::jsonb,
  pdf_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  cashier_name text NOT NULL,
  terminal_id text DEFAULT 'main'::text,
  opened_at timestamp with time zone DEFAULT now() NOT NULL,
  closed_at timestamp with time zone,
  opening_cash numeric(12,2) DEFAULT 0 NOT NULL,
  closing_cash numeric(12,2),
  expected_cash numeric(12,2),
  actual_cash numeric(12,2),
  difference numeric(12,2),
  status text DEFAULT 'open'::text NOT NULL,
  notes text,
  sales_count integer DEFAULT 0,
  total_sales numeric(12,2) DEFAULT 0,
  total_tips numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_supervisor_authorizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  supervisor_staff_id uuid NOT NULL,
  supervisor_name text NOT NULL,
  requester_staff_id uuid,
  requester_name text,
  terminal_id text,
  reason_code text NOT NULL,
  reason_text text,
  amount numeric,
  entity text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id uuid,
  order_id uuid,
  transaction_type text NOT NULL,
  payment_method_id uuid,
  payment_method_name text,
  amount numeric(12,2) NOT NULL,
  reference_number text,
  authorization_code text,
  tip_amount numeric(12,2) DEFAULT 0,
  processor_response jsonb,
  status text DEFAULT 'completed'::text NOT NULL,
  processed_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_by text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pos_user_activity (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  staff_id uuid,
  staff_name text,
  terminal_id text,
  activity_type text DEFAULT 'ping'::text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pre_opening_tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  project_id uuid,
  task_key text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  days_before_opening integer DEFAULT 0 NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  full_name text,
  restaurant_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_type text DEFAULT 'restaurant_owner'::text
);

CREATE TABLE public.provider_portfolio (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  provider_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  client_name text,
  project_date date,
  category public.service_category DEFAULT 'other'::public.service_category,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.provider_reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  request_id uuid,
  rating integer NOT NULL,
  quality_rating integer,
  punctuality_rating integer,
  communication_rating integer,
  comment text,
  response text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.purchase_order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  purchase_order_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  quantity_ordered numeric(10,3) NOT NULL,
  quantity_received numeric(10,3) DEFAULT 0,
  unit character varying(50) NOT NULL,
  unit_cost numeric(10,4) NOT NULL,
  total_cost numeric(12,4) NOT NULL,
  lot_number character varying(100),
  expiration_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.purchase_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  supplier_id uuid,
  order_number character varying(50) NOT NULL,
  status character varying(30) DEFAULT 'draft'::character varying,
  order_date date DEFAULT CURRENT_DATE,
  expected_delivery date,
  received_date date,
  subtotal numeric(12,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  shipping_cost numeric(10,2) DEFAULT 0,
  total_amount numeric(12,2) DEFAULT 0,
  notes text,
  internal_notes text,
  created_by character varying(100),
  received_by character varying(100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.quotation_gallery (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quotation_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quotation_menu_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quotation_id uuid NOT NULL,
  menu_item_id uuid,
  category text DEFAULT 'main'::text,
  item_name text NOT NULL,
  item_description text,
  price_per_person numeric DEFAULT 0,
  quantity integer DEFAULT 1,
  is_included boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quotation_services (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quotation_id uuid NOT NULL,
  service_provider_id uuid,
  service_type text NOT NULL,
  service_name text NOT NULL,
  service_description text,
  price numeric DEFAULT 0,
  duration_hours integer,
  provider_name text,
  provider_contact text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rappi_menu_sync (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL,
  menu_item_id uuid,
  external_item_id text,
  store_id text,
  status text DEFAULT 'pending'::text NOT NULL,
  last_synced_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.rappi_settlements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL,
  store_id text,
  settlement_date date NOT NULL,
  gross_amount numeric DEFAULT 0 NOT NULL,
  commission_amount numeric DEFAULT 0 NOT NULL,
  net_amount numeric DEFAULT 0 NOT NULL,
  orders_count integer DEFAULT 0 NOT NULL,
  currency text DEFAULT 'COP'::text,
  raw_payload jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.rappi_store_status (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL,
  store_id text NOT NULL,
  status text NOT NULL,
  reason text,
  pause_until timestamp with time zone,
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.rappi_webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  integration_id uuid,
  event_id text,
  event_type text,
  payload jsonb NOT NULL,
  signature text,
  processed boolean DEFAULT false NOT NULL,
  process_error text,
  received_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_ingredients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  recipe_id uuid,
  inventory_item_id uuid,
  ingredient_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  cost_per_unit numeric DEFAULT 0,
  notes text,
  is_optional boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  unit_id uuid,
  gross_quantity numeric,
  yield_percentage numeric DEFAULT 100,
  preparation_method text,
  allergen_ids uuid[] DEFAULT '{}'::uuid[],
  calories_per_unit numeric DEFAULT 0,
  protein_per_unit numeric DEFAULT 0,
  carbs_per_unit numeric DEFAULT 0,
  fat_per_unit numeric DEFAULT 0
);

CREATE TABLE public.recipe_menu_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  recipe_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  variant_name text,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_nutrition (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  recipe_id uuid NOT NULL,
  calories numeric DEFAULT 0,
  protein_grams numeric DEFAULT 0,
  carbs_grams numeric DEFAULT 0,
  fat_grams numeric DEFAULT 0,
  fiber_grams numeric DEFAULT 0,
  sugar_grams numeric DEFAULT 0,
  sodium_mg numeric DEFAULT 0,
  saturated_fat_grams numeric DEFAULT 0,
  cholesterol_mg numeric DEFAULT 0,
  is_estimated boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.recipe_steps (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  recipe_id uuid NOT NULL,
  step_number integer NOT NULL,
  title text,
  instruction text NOT NULL,
  duration_minutes integer,
  temperature_celsius numeric,
  technique text,
  equipment text,
  photo_url text,
  tips text,
  critical_point boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.recipe_sub_recipes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  parent_recipe_id uuid NOT NULL,
  sub_recipe_id uuid NOT NULL,
  quantity numeric DEFAULT 1 NOT NULL,
  unit text DEFAULT 'porción'::text NOT NULL,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.recipe_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  recipe_id uuid,
  version_number integer NOT NULL,
  changes_description text,
  ingredients_snapshot jsonb,
  instructions_snapshot text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.recipes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  menu_item_id uuid,
  name text NOT NULL,
  category text DEFAULT 'plato_fuerte'::text,
  portions integer DEFAULT 1,
  preparation_time_minutes integer,
  difficulty text DEFAULT 'media'::text,
  instructions text,
  tips text,
  photo_url text,
  video_url text,
  is_secret boolean DEFAULT false,
  total_cost numeric DEFAULT 0,
  cost_per_portion numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  yield_quantity numeric DEFAULT 1,
  yield_unit text DEFAULT 'porciones'::text,
  yield_weight_grams numeric,
  waste_percentage numeric DEFAULT 0,
  labor_time_minutes integer,
  labor_cost_per_hour numeric DEFAULT 0,
  overhead_percentage numeric DEFAULT 0,
  is_sub_recipe boolean DEFAULT false,
  parent_recipe_ids uuid[] DEFAULT '{}'::uuid[],
  serving_size_grams numeric,
  shelf_life_hours integer,
  storage_instructions text,
  plating_instructions text,
  equipment_needed text[],
  allergen_ids uuid[] DEFAULT '{}'::uuid[],
  tags text[] DEFAULT '{}'::text[]
);

CREATE TABLE public.restaurant_brands (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  brand_name text NOT NULL,
  logo_url text,
  tagline text,
  primary_color text DEFAULT '#6B46C1'::text,
  secondary_color text DEFAULT '#F7FAFC'::text,
  accent_color text DEFAULT '#ED8936'::text,
  font_primary text DEFAULT 'Lato'::text,
  font_secondary text DEFAULT 'Montserrat'::text,
  brand_voice text,
  brand_values jsonb DEFAULT '[]'::jsonb,
  brand_manual_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  logo_white_url text,
  logo_dark_url text,
  logo_square_url text,
  favicon_url text,
  mission text,
  vision text,
  story text,
  differentiators jsonb DEFAULT '[]'::jsonb,
  target_audience text,
  gallery_photos jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE public.restaurant_businesses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  business_type text,
  cuisine_type text,
  address text,
  city text,
  state text,
  country text DEFAULT 'México'::text,
  phone text,
  website text,
  employee_count integer,
  monthly_revenue_range text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  opening_date date,
  tax_config jsonb DEFAULT '{"rate": 0, "type": "exento", "label": "Exento", "included_in_price": false}'::jsonb NOT NULL,
  allow_oversell boolean DEFAULT true NOT NULL
);

CREATE TABLE public.restaurant_chains (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  chain_name text NOT NULL,
  logo_url text,
  headquarters_city text,
  headquarters_country text DEFAULT 'México'::text,
  total_locations integer DEFAULT 0,
  founded_year integer,
  description text,
  is_franchise boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.restaurant_custom_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  business_id uuid NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  base_role public.team_member_role DEFAULT 'staff'::public.team_member_role NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
  default_landing text,
  color text DEFAULT '#3E1064'::text,
  icon text DEFAULT 'Shield'::text,
  is_system boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.restaurant_expenses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  expense_date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  vendor text,
  amount numeric(14,2) NOT NULL,
  is_fixed boolean DEFAULT false NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  due_date date,
  paid_at date,
  payment_method text,
  account_id uuid,
  recurrence text DEFAULT 'none'::text NOT NULL,
  recurrence_parent uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.restaurant_menus (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  template_id uuid,
  name text NOT NULL,
  description text,
  logo_url text,
  cover_image text,
  cuisine_type public.cuisine_type DEFAULT 'other'::public.cuisine_type,
  status public.menu_status DEFAULT 'draft'::public.menu_status NOT NULL,
  public_url_slug text,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  brand_id uuid,
  theme_config jsonb DEFAULT '{}'::jsonb,
  ai_recommendations jsonb DEFAULT '[]'::jsonb,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone
);

CREATE TABLE public.restaurant_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  order_number integer DEFAULT nextval('public.restaurant_orders_order_number_seq'::regclass) NOT NULL,
  source text DEFAULT 'in_store'::text,
  order_type text DEFAULT 'dine_in'::text,
  status text DEFAULT 'pending'::text,
  customer_name text,
  customer_phone text,
  customer_email text,
  delivery_address text,
  delivery_notes text,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal numeric DEFAULT 0 NOT NULL,
  delivery_fee numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0 NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending'::text,
  estimated_time_minutes integer,
  assigned_driver text,
  driver_phone text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  session_id uuid,
  table_id uuid,
  waiter_id uuid,
  waiter_name text,
  split_from_order_id uuid,
  tip_amount numeric(12,2) DEFAULT 0,
  tip_percent numeric(5,2) DEFAULT 0,
  discount_id uuid,
  discount_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  guests_count integer DEFAULT 1,
  is_pos_order boolean DEFAULT false,
  kitchen_status text DEFAULT 'pending'::text,
  kitchen_started_at timestamp with time zone,
  kitchen_ready_at timestamp with time zone,
  kitchen_notes text,
  sales_channel text DEFAULT 'pos'::text,
  merged_into_order_id uuid,
  transferred_from_table_id uuid,
  transferred_by uuid,
  tip_breakdown jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE public.restaurant_tables (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  table_number text NOT NULL,
  zone_id uuid,
  capacity integer DEFAULT 4 NOT NULL,
  status text DEFAULT 'available'::text NOT NULL,
  current_order_id uuid,
  waiter_id uuid,
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  shape text DEFAULT 'rectangle'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.restaurant_team_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  business_id uuid NOT NULL,
  user_id uuid,
  staff_member_id uuid,
  role public.team_member_role DEFAULT 'staff'::public.team_member_role NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
  status public.team_member_status DEFAULT 'invited'::public.team_member_status NOT NULL,
  invited_email text,
  invitation_token uuid DEFAULT gen_random_uuid(),
  invitation_sent_at timestamp with time zone,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  custom_role_id uuid
);

CREATE TABLE public.restaurant_websites (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  slug text NOT NULL,
  template_id uuid,
  is_published boolean DEFAULT false,
  site_title text,
  meta_description text,
  favicon_url text,
  show_menu boolean DEFAULT true,
  show_delivery boolean DEFAULT false,
  show_reservations boolean DEFAULT false,
  show_contact boolean DEFAULT true,
  show_gallery boolean DEFAULT true,
  show_reviews boolean DEFAULT true,
  show_loyalty boolean DEFAULT false,
  show_about boolean DEFAULT true,
  business_hours jsonb DEFAULT '{}'::jsonb,
  hero_image_url text,
  hero_title text,
  hero_subtitle text,
  hero_cta_text text,
  hero_cta_link text,
  about_title text,
  about_description text,
  about_image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  theme_overrides jsonb DEFAULT '{}'::jsonb,
  delivery_min_order numeric(10,2),
  delivery_message text,
  reservation_max_party_size integer DEFAULT 10,
  reservation_advance_days integer DEFAULT 30,
  reservation_slot_duration integer DEFAULT 60,
  reservation_available_times jsonb DEFAULT '[]'::jsonb,
  google_analytics_id text,
  custom_scripts text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  show_feedback boolean DEFAULT true NOT NULL,
  og_image_url text,
  og_title text,
  og_description text,
  schema_type text DEFAULT 'Restaurant'::text,
  featured_items jsonb DEFAULT '[]'::jsonb,
  testimonials jsonb DEFAULT '[]'::jsonb,
  promo_banner_enabled boolean DEFAULT false,
  promo_banner_text text,
  promo_banner_link text,
  promo_banner_bg_color text,
  announcement_bar_enabled boolean DEFAULT false,
  announcement_bar_text text,
  popup_enabled boolean DEFAULT false,
  popup_title text,
  popup_content text,
  popup_cta_text text,
  popup_cta_link text,
  popup_image_url text,
  newsletter_enabled boolean DEFAULT false,
  instagram_feed_enabled boolean DEFAULT false,
  instagram_handle text,
  google_maps_embed_url text,
  whatsapp_number text,
  whatsapp_message text,
  ordering_platforms jsonb DEFAULT '[]'::jsonb,
  reservation_platforms jsonb DEFAULT '[]'::jsonb,
  custom_sections jsonb DEFAULT '[]'::jsonb,
  footer_text text,
  show_powered_by boolean DEFAULT true,
  layout_variant text DEFAULT 'classic'::text,
  hero_style text DEFAULT 'fullscreen'::text,
  hero_video_url text,
  color_scheme text DEFAULT 'auto'::text,
  facebook_pixel_id text,
  gtm_id text,
  tiktok_pixel_id text
);

CREATE TABLE public.restaurant_zones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  restaurant_id uuid,
  consultant_id uuid,
  name text NOT NULL,
  description text,
  capacity_min integer DEFAULT 10,
  capacity_max integer DEFAULT 100,
  price_per_hour numeric DEFAULT 0,
  price_per_event numeric DEFAULT 0,
  amenities jsonb DEFAULT '[]'::jsonb,
  images text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  venue_id uuid,
  provider_id uuid,
  course_id uuid,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.sales_goals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  period_type text DEFAULT 'monthly'::text,
  period_start date NOT NULL,
  period_end date NOT NULL,
  revenue_goal numeric,
  covers_goal integer,
  avg_ticket_goal numeric,
  category_goals jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sales_projections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  projection_date date NOT NULL,
  projected_revenue numeric,
  projected_covers integer,
  confidence_level numeric,
  factors jsonb DEFAULT '{}'::jsonb,
  ai_reasoning text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sentiment_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  total_mentions integer DEFAULT 0,
  avg_sentiment numeric,
  positive_count integer DEFAULT 0,
  negative_count integer DEFAULT 0,
  neutral_count integer DEFAULT 0,
  trending_topics jsonb DEFAULT '[]'::jsonb,
  ai_summary text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.service_bookings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  provider_id uuid NOT NULL,
  event_id uuid,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  service_date timestamp with time zone NOT NULL,
  total_price numeric(10,2),
  status public.booking_status DEFAULT 'pending'::public.booking_status NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  request_id uuid,
  proposal_id uuid,
  review_id uuid
);

CREATE TABLE public.service_proposals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  request_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  message text NOT NULL,
  price numeric,
  estimated_delivery_days integer,
  attachments text[],
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.service_providers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid,
  name text NOT NULL,
  description text,
  category public.service_category DEFAULT 'other'::public.service_category NOT NULL,
  city text NOT NULL,
  state text,
  country text DEFAULT 'México'::text NOT NULL,
  price_min numeric(10,2),
  price_max numeric(10,2),
  services_offered text[],
  portfolio_images text[],
  website_url text,
  is_active boolean DEFAULT true NOT NULL,
  average_rating numeric(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  rating numeric DEFAULT 0,
  specialty text,
  tags text[] DEFAULT '{}'::text[],
  is_verified boolean DEFAULT false,
  contact_email text,
  contact_phone text,
  logo_url text,
  headline text,
  years_in_business integer,
  team_size text,
  response_time_hours integer DEFAULT 24,
  completed_projects integer DEFAULT 0,
  cover_image_url text,
  social_links jsonb,
  certifications text[],
  service_areas text[]
);

CREATE TABLE public.service_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  title text NOT NULL,
  description text,
  category public.service_category DEFAULT 'other'::public.service_category,
  budget_min integer,
  budget_max integer,
  city text,
  country text DEFAULT 'Colombia'::text,
  urgency text DEFAULT 'normal'::text,
  deadline date,
  requirements text[],
  attachments text[],
  status text DEFAULT 'open'::text,
  proposals_count integer DEFAULT 0,
  selected_proposal_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.shift_swap_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  original_shift_id uuid NOT NULL,
  requesting_staff_id uuid NOT NULL,
  target_staff_id uuid,
  target_shift_id uuid,
  swap_type text DEFAULT 'give_away'::text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  reason text,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.shift_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  template_name text NOT NULL,
  "position" text,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  break_minutes integer DEFAULT 0 NOT NULL,
  color text,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.social_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  account_name text,
  account_url text,
  access_token_encrypted text,
  last_sync_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.social_mentions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  external_id text,
  author_name text,
  author_url text,
  content text,
  rating integer,
  sentiment_score numeric,
  sentiment_label text,
  key_topics jsonb DEFAULT '[]'::jsonb,
  engagement_likes integer DEFAULT 0,
  engagement_comments integer DEFAULT 0,
  engagement_shares integer DEFAULT 0,
  responded boolean DEFAULT false,
  response_text text,
  fetched_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.staff_availability (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  notes text,
  effective_from date,
  effective_until date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.staff_benefit_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  benefit_id uuid NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  start_date date DEFAULT CURRENT_DATE NOT NULL,
  end_date date,
  usage_count integer DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.staff_benefits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  benefit_name text NOT NULL,
  benefit_type text DEFAULT 'other'::text NOT NULL,
  description text,
  value numeric DEFAULT 0,
  value_type text DEFAULT 'fixed'::text NOT NULL,
  eligibility_months integer DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  applicable_positions text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.staff_certifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  certification_name text NOT NULL,
  certification_type text DEFAULT 'training'::text,
  issued_date date,
  expiration_date date,
  issuing_authority text,
  document_url text,
  status text DEFAULT 'valid'::text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.staff_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  "position" text NOT NULL,
  hourly_rate numeric DEFAULT 0,
  hire_date date,
  performance_score numeric DEFAULT 0,
  training_progress integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  email text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  max_hours_per_week integer DEFAULT 40,
  preferred_shifts text[] DEFAULT '{}'::text[],
  skills text[] DEFAULT '{}'::text[],
  avatar_url text,
  department text,
  employee_id text,
  linked_user_id uuid,
  contract_type text,
  pin_hash text,
  pin_set_at timestamp with time zone,
  pin_failed_attempts integer DEFAULT 0 NOT NULL,
  pin_locked_until timestamp with time zone,
  pos_role text DEFAULT 'cashier'::text NOT NULL
);

CREATE TABLE public.staff_shifts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  staff_member_id uuid,
  shift_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  break_minutes integer DEFAULT 0,
  hourly_rate_override numeric(10,2),
  actual_start_time time without time zone,
  actual_end_time time without time zone,
  status character varying(20) DEFAULT 'scheduled'::character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  template_id uuid,
  department text,
  color text,
  is_published boolean DEFAULT false,
  published_at timestamp with time zone
);

CREATE TABLE public.staff_training_progress (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  training_program_id uuid NOT NULL,
  status text DEFAULT 'not_started'::text NOT NULL,
  progress_percent integer DEFAULT 0 NOT NULL,
  score integer,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  due_date date,
  modules_completed jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.staffing_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  "position" text NOT NULL,
  orders_per_staff_hour numeric DEFAULT 4 NOT NULL,
  min_staff integer DEFAULT 1 NOT NULL,
  max_staff integer DEFAULT 10 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  peak_only boolean DEFAULT false NOT NULL
);

CREATE TABLE public.storage_locations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  location_name character varying(100) NOT NULL,
  location_type character varying(50) DEFAULT 'dry_storage'::character varying,
  temperature_range character varying(50),
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.supplier_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  inventory_item_id uuid,
  item_name text NOT NULL,
  current_cost numeric,
  current_supplier text,
  city text NOT NULL,
  country text DEFAULT 'México'::text,
  analysis_date timestamp with time zone DEFAULT now(),
  alternatives jsonb DEFAULT '[]'::jsonb,
  market_insights text,
  recommendations text[],
  potential_savings numeric,
  status text DEFAULT 'pending'::text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.supplier_invoices (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  business_id uuid,
  supplier_id uuid,
  supplier_name text,
  invoice_number text,
  invoice_date date,
  due_date date,
  currency text DEFAULT 'COP'::text,
  subtotal numeric(14,2),
  tax_amount numeric(14,2),
  total_amount numeric(14,2),
  items jsonb DEFAULT '[]'::jsonb,
  raw_text text,
  image_url text,
  storage_path text,
  status text DEFAULT 'pending'::text NOT NULL,
  ai_confidence numeric(3,2),
  ai_model text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  paid_at date,
  payment_method text,
  account_id uuid
);

CREATE TABLE public.suppliers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  category text DEFAULT 'Otros'::text NOT NULL,
  payment_terms text,
  lead_time_days integer,
  rating numeric(2,1),
  notes text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.support_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  subject_template text,
  body_template text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.support_tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  ticket_number integer DEFAULT nextval('public.support_tickets_ticket_number_seq'::regclass) NOT NULL,
  type text DEFAULT 'peticion'::text NOT NULL,
  priority text DEFAULT 'medium'::text,
  status text DEFAULT 'open'::text,
  subject text NOT NULL,
  description text NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  order_id uuid,
  assigned_to uuid,
  resolution text,
  satisfaction_rating integer,
  ai_category text,
  ai_priority_suggestion text,
  ai_response_draft text,
  first_response_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sustainability_goals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  goal_type text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text DEFAULT 'kg'::text NOT NULL,
  start_date date DEFAULT CURRENT_DATE NOT NULL,
  end_date date,
  is_achieved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.sustainability_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  report_type text DEFAULT 'monthly'::text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_waste_kg numeric DEFAULT 0,
  total_co2_kg numeric DEFAULT 0,
  cost_savings numeric DEFAULT 0,
  recommendations jsonb DEFAULT '[]'::jsonb,
  report_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.table_reservations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  party_size integer NOT NULL,
  reservation_date date NOT NULL,
  reservation_time time without time zone NOT NULL,
  status text DEFAULT 'pending'::text,
  special_requests text,
  source text DEFAULT 'website'::text,
  confirmation_code text,
  reminder_sent boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  loyalty_customer_id uuid,
  table_id uuid,
  duration_minutes integer DEFAULT 90 NOT NULL
);

CREATE TABLE public.team_permissions_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  team_member_id uuid NOT NULL,
  business_id uuid,
  user_id uuid,
  changed_by uuid,
  old_role text,
  new_role text,
  old_permissions jsonb,
  new_permissions jsonb,
  old_status text,
  new_status text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.ticket_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  ticket_id uuid,
  sender_type text DEFAULT 'staff'::text NOT NULL,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.time_off_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  request_type text DEFAULT 'vacation'::text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  is_full_day boolean DEFAULT true NOT NULL,
  reason text,
  status text DEFAULT 'pending'::text NOT NULL,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tip_allocations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  period_id uuid NOT NULL,
  user_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  staff_name text NOT NULL,
  "position" text,
  tip_group text,
  days_worked integer DEFAULT 0 NOT NULL,
  hours_worked numeric DEFAULT 0 NOT NULL,
  table_tips_generated numeric DEFAULT 0 NOT NULL,
  table_tips_kept numeric DEFAULT 0 NOT NULL,
  role_weight numeric DEFAULT 0 NOT NULL,
  shared_points numeric DEFAULT 0 NOT NULL,
  manager_factor numeric DEFAULT 1 NOT NULL,
  factor_reason text,
  shared_amount numeric DEFAULT 0 NOT NULL,
  adjustment numeric DEFAULT 0 NOT NULL,
  adjustment_reason text,
  total_amount numeric DEFAULT 0 NOT NULL
);

CREATE TABLE public.tip_periods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  total_tips numeric DEFAULT 0 NOT NULL,
  table_kept numeric DEFAULT 0 NOT NULL,
  shared_pool numeric DEFAULT 0 NOT NULL,
  orders_count integer DEFAULT 0 NOT NULL,
  computed_at timestamp with time zone,
  closed_at timestamp with time zone,
  closed_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tip_policies (
  user_id uuid NOT NULL,
  table_share_pct numeric DEFAULT 70 NOT NULL,
  pool_basis text DEFAULT 'days'::text NOT NULL,
  rounding integer DEFAULT 100 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tip_role_weights (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  "position" text NOT NULL,
  tip_group text DEFAULT 'sala'::text NOT NULL,
  weight numeric DEFAULT 1 NOT NULL,
  earns_table_tips boolean DEFAULT false NOT NULL
);

CREATE TABLE public.training_courses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  instructor_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  short_description text,
  thumbnail_url text,
  video_url text,
  duration_hours numeric(5,2),
  level public.experience_level DEFAULT 'entry'::public.experience_level NOT NULL,
  category public.job_category DEFAULT 'other'::public.job_category NOT NULL,
  price numeric(10,2) DEFAULT 0 NOT NULL,
  is_free boolean DEFAULT false NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  enrollments_count integer DEFAULT 0 NOT NULL,
  average_rating numeric(3,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  lessons_count integer DEFAULT 0 NOT NULL,
  total_duration_minutes integer DEFAULT 0 NOT NULL,
  instructor_name text,
  instructor_bio text,
  instructor_photo_url text,
  what_you_learn text[],
  requirements text[],
  tags text[],
  completion_certificate boolean DEFAULT true NOT NULL,
  ai_generated_content boolean DEFAULT false NOT NULL
);

CREATE TABLE public.training_programs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text DEFAULT 'custom'::text NOT NULL,
  "position" text,
  estimated_hours numeric DEFAULT 0,
  is_mandatory boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  content jsonb DEFAULT '{"modules": []}'::jsonb,
  passing_score integer DEFAULT 70,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.unit_conversions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  from_unit_id uuid NOT NULL,
  to_unit_id uuid NOT NULL,
  conversion_factor numeric NOT NULL,
  ingredient_id uuid,
  user_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.venue_bookings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  venue_id uuid NOT NULL,
  event_id uuid,
  user_id uuid NOT NULL,
  booking_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  guest_count integer,
  total_price numeric(10,2),
  status public.booking_status DEFAULT 'pending'::public.booking_status NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.venues (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  state text,
  country text DEFAULT 'México'::text NOT NULL,
  latitude numeric(10,8),
  longitude numeric(11,8),
  venue_type public.venue_type DEFAULT 'other'::public.venue_type NOT NULL,
  capacity_min integer,
  capacity_max integer,
  price_per_hour numeric(10,2),
  price_per_event numeric(10,2),
  amenities text[],
  images text[],
  is_active boolean DEFAULT true NOT NULL,
  average_rating numeric(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.virtual_brands (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  brand_name text NOT NULL,
  brand_logo text,
  description text,
  cuisine_type public.cuisine_type DEFAULT 'other'::public.cuisine_type,
  status public.brand_status DEFAULT 'active'::public.brand_status,
  primary_platform public.delivery_platform DEFAULT 'direct'::public.delivery_platform,
  avg_preparation_time integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.website_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  preview_image text,
  layout_type text DEFAULT 'modern'::text NOT NULL,
  default_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.pos_pin_attempts_id_seq OWNED BY public.pos_pin_attempts.id;
ALTER SEQUENCE public.restaurant_orders_order_number_seq OWNED BY public.restaurant_orders.order_number;
ALTER SEQUENCE public.support_tickets_ticket_number_seq OWNED BY public.support_tickets.ticket_number;

-- Restricciones
ALTER TABLE public._demo_customers ADD CONSTRAINT _demo_customers_pkey PRIMARY KEY (phone);
ALTER TABLE public._demo_menu_weights ADD CONSTRAINT _demo_menu_weights_pkey PRIMARY KEY (id);
ALTER TABLE public.aggregator_integrations ADD CONSTRAINT aggregator_integrations_pkey PRIMARY KEY (id);
ALTER TABLE public.aggregator_orders ADD CONSTRAINT aggregator_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_usage_daily ADD CONSTRAINT ai_usage_daily_pkey PRIMARY KEY (user_id, fn, day);
ALTER TABLE public.allergens ADD CONSTRAINT allergens_pkey PRIMARY KEY (id);
ALTER TABLE public.applicant_profiles ADD CONSTRAINT applicant_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.benefit_requests ADD CONSTRAINT benefit_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_assets ADD CONSTRAINT brand_assets_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_menus ADD CONSTRAINT brand_menus_pkey PRIMARY KEY (id);
ALTER TABLE public.business_opening_projects ADD CONSTRAINT business_opening_projects_pkey PRIMARY KEY (id);
ALTER TABLE public.candidate_experience ADD CONSTRAINT candidate_experience_pkey PRIMARY KEY (id);
ALTER TABLE public.candidate_profiles ADD CONSTRAINT candidate_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.carbon_footprint_items ADD CONSTRAINT carbon_footprint_items_pkey PRIMARY KEY (id);
ALTER TABLE public.chain_locations ADD CONSTRAINT chain_locations_pkey PRIMARY KEY (id);
ALTER TABLE public.chain_master_menus ADD CONSTRAINT chain_master_menus_pkey PRIMARY KEY (id);
ALTER TABLE public.compliance_checklists ADD CONSTRAINT compliance_checklists_pkey PRIMARY KEY (id);
ALTER TABLE public.compliance_records ADD CONSTRAINT compliance_records_pkey PRIMARY KEY (id);
ALTER TABLE public.consultant_clients ADD CONSTRAINT consultant_clients_pkey PRIMARY KEY (id);
ALTER TABLE public.consultant_impersonation_log ADD CONSTRAINT consultant_impersonation_log_pkey PRIMARY KEY (id);
ALTER TABLE public.consultant_profiles ADD CONSTRAINT consultant_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.consultant_reports ADD CONSTRAINT consultant_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.consulting_invoices ADD CONSTRAINT consulting_invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.copilot_alerts ADD CONSTRAINT copilot_alerts_pkey PRIMARY KEY (id);
ALTER TABLE public.copilot_conversations ADD CONSTRAINT copilot_conversations_pkey PRIMARY KEY (id);
ALTER TABLE public.copilot_messages ADD CONSTRAINT copilot_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.course_certificates ADD CONSTRAINT course_certificates_pkey PRIMARY KEY (id);
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);
ALTER TABLE public.course_lessons ADD CONSTRAINT course_lessons_pkey PRIMARY KEY (id);
ALTER TABLE public.course_reviews ADD CONSTRAINT course_reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_pkey PRIMARY KEY (id);
ALTER TABLE public.daily_briefings ADD CONSTRAINT daily_briefings_pkey PRIMARY KEY (id);
ALTER TABLE public.daily_sales ADD CONSTRAINT daily_sales_pkey PRIMARY KEY (id);
ALTER TABLE public.debug_events ADD CONSTRAINT debug_events_pkey PRIMARY KEY (id);
ALTER TABLE public.delivery_zones ADD CONSTRAINT delivery_zones_pkey PRIMARY KEY (id);
ALTER TABLE public.demand_events ADD CONSTRAINT demand_events_pkey PRIMARY KEY (id);
ALTER TABLE public.event_categories ADD CONSTRAINT event_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.event_quotations ADD CONSTRAINT event_quotations_pkey PRIMARY KEY (id);
ALTER TABLE public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE public.feedback_campaigns ADD CONSTRAINT feedback_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE public.finance_accounts ADD CONSTRAINT finance_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE public.finance_settlements ADD CONSTRAINT finance_settlements_pkey PRIMARY KEY (id);
ALTER TABLE public.food_waste_logs ADD CONSTRAINT food_waste_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.growth_preregistrations ADD CONSTRAINT growth_preregistrations_pkey PRIMARY KEY (id);
ALTER TABLE public.industry_benchmarks ADD CONSTRAINT industry_benchmarks_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_deductions ADD CONSTRAINT inventory_deductions_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_item_suppliers ADD CONSTRAINT inventory_item_suppliers_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_price_history ADD CONSTRAINT inventory_price_history_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_suppliers ADD CONSTRAINT inventory_suppliers_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_transfers ADD CONSTRAINT inventory_transfers_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_waste ADD CONSTRAINT inventory_waste_pkey PRIMARY KEY (id);
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);
ALTER TABLE public.job_saved ADD CONSTRAINT job_saved_pkey PRIMARY KEY (id);
ALTER TABLE public.jobs ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.kitchen_production_queue ADD CONSTRAINT kitchen_production_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.knowledge_chunks ADD CONSTRAINT knowledge_chunks_pkey PRIMARY KEY (id);
ALTER TABLE public.knowledge_sources ADD CONSTRAINT knowledge_sources_pkey PRIMARY KEY (id);
ALTER TABLE public.learning_track_courses ADD CONSTRAINT learning_track_courses_pkey PRIMARY KEY (id);
ALTER TABLE public.learning_tracks ADD CONSTRAINT learning_tracks_pkey PRIMARY KEY (id);
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_achievements ADD CONSTRAINT loyalty_achievements_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_campaigns ADD CONSTRAINT loyalty_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_customer_achievements ADD CONSTRAINT loyalty_customer_achievements_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_customers ADD CONSTRAINT loyalty_customers_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_points_transactions ADD CONSTRAINT loyalty_points_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_rewards ADD CONSTRAINT loyalty_rewards_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_rewards_catalog ADD CONSTRAINT loyalty_rewards_catalog_pkey PRIMARY KEY (id);
ALTER TABLE public.loyalty_tiers ADD CONSTRAINT loyalty_tiers_pkey PRIMARY KEY (id);
ALTER TABLE public.marketing_content ADD CONSTRAINT marketing_content_pkey PRIMARY KEY (id);
ALTER TABLE public.maturity_action_tracking ADD CONSTRAINT maturity_action_tracking_pkey PRIMARY KEY (id);
ALTER TABLE public.maturity_diagnoses ADD CONSTRAINT maturity_diagnoses_pkey PRIMARY KEY (id);
ALTER TABLE public.measurement_units ADD CONSTRAINT measurement_units_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_allergens ADD CONSTRAINT menu_allergens_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_categories ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_item_modifier_links ADD CONSTRAINT menu_item_modifier_links_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_item_modifiers ADD CONSTRAINT menu_item_modifiers_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_modifier_options ADD CONSTRAINT menu_modifier_options_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_templates ADD CONSTRAINT menu_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);
ALTER TABLE public.notifications_log ADD CONSTRAINT notifications_log_pkey PRIMARY KEY (id);
ALTER TABLE public.opening_analysis_runs ADD CONSTRAINT opening_analysis_runs_pkey PRIMARY KEY (id);
ALTER TABLE public.opening_checklist_items ADD CONSTRAINT opening_checklist_items_pkey PRIMARY KEY (id);
ALTER TABLE public.opening_phase_analyses ADD CONSTRAINT opening_phase_analyses_pkey PRIMARY KEY (id);
ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_gateway_credentials ADD CONSTRAINT payment_gateway_credentials_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_webhook_events ADD CONSTRAINT payment_webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_audit_log ADD CONSTRAINT pos_audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_cash_movements ADD CONSTRAINT pos_cash_movements_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_discounts ADD CONSTRAINT pos_discounts_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_fraud_signals ADD CONSTRAINT pos_fraud_signals_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_payment_methods ADD CONSTRAINT pos_payment_methods_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_pin_attempts ADD CONSTRAINT pos_pin_attempts_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_session_closures ADD CONSTRAINT pos_session_closures_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_sessions ADD CONSTRAINT pos_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_supervisor_authorizations ADD CONSTRAINT pos_supervisor_authorizations_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_user_activity ADD CONSTRAINT pos_user_activity_pkey PRIMARY KEY (id);
ALTER TABLE public.pre_opening_tasks ADD CONSTRAINT pre_opening_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.provider_portfolio ADD CONSTRAINT provider_portfolio_pkey PRIMARY KEY (id);
ALTER TABLE public.provider_reviews ADD CONSTRAINT provider_reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.quotation_gallery ADD CONSTRAINT quotation_gallery_pkey PRIMARY KEY (id);
ALTER TABLE public.quotation_menu_items ADD CONSTRAINT quotation_menu_items_pkey PRIMARY KEY (id);
ALTER TABLE public.quotation_services ADD CONSTRAINT quotation_services_pkey PRIMARY KEY (id);
ALTER TABLE public.rappi_menu_sync ADD CONSTRAINT rappi_menu_sync_pkey PRIMARY KEY (id);
ALTER TABLE public.rappi_settlements ADD CONSTRAINT rappi_settlements_pkey PRIMARY KEY (id);
ALTER TABLE public.rappi_store_status ADD CONSTRAINT rappi_store_status_pkey PRIMARY KEY (id);
ALTER TABLE public.rappi_webhook_events ADD CONSTRAINT rappi_webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id);
ALTER TABLE public.recipe_menu_items ADD CONSTRAINT recipe_menu_items_pkey PRIMARY KEY (id);
ALTER TABLE public.recipe_nutrition ADD CONSTRAINT recipe_nutrition_pkey PRIMARY KEY (id);
ALTER TABLE public.recipe_steps ADD CONSTRAINT recipe_steps_pkey PRIMARY KEY (id);
ALTER TABLE public.recipe_sub_recipes ADD CONSTRAINT recipe_sub_recipes_pkey PRIMARY KEY (id);
ALTER TABLE public.recipe_versions ADD CONSTRAINT recipe_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.recipes ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_brands ADD CONSTRAINT restaurant_brands_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_businesses ADD CONSTRAINT restaurant_businesses_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_chains ADD CONSTRAINT restaurant_chains_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_custom_roles ADD CONSTRAINT restaurant_custom_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_menus ADD CONSTRAINT restaurant_menus_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_tables ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_team_members ADD CONSTRAINT restaurant_team_members_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_websites ADD CONSTRAINT restaurant_websites_pkey PRIMARY KEY (id);
ALTER TABLE public.restaurant_zones ADD CONSTRAINT restaurant_zones_pkey PRIMARY KEY (id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.sales_goals ADD CONSTRAINT sales_goals_pkey PRIMARY KEY (id);
ALTER TABLE public.sales_projections ADD CONSTRAINT sales_projections_pkey PRIMARY KEY (id);
ALTER TABLE public.sentiment_reports ADD CONSTRAINT sentiment_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.service_bookings ADD CONSTRAINT service_bookings_pkey PRIMARY KEY (id);
ALTER TABLE public.service_proposals ADD CONSTRAINT service_proposals_pkey PRIMARY KEY (id);
ALTER TABLE public.service_providers ADD CONSTRAINT service_providers_pkey PRIMARY KEY (id);
ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.shift_swap_requests ADD CONSTRAINT shift_swap_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.shift_templates ADD CONSTRAINT shift_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.social_mentions ADD CONSTRAINT social_mentions_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_availability ADD CONSTRAINT staff_availability_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_benefit_assignments ADD CONSTRAINT staff_benefit_assignments_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_benefits ADD CONSTRAINT staff_benefits_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_certifications ADD CONSTRAINT staff_certifications_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_shifts ADD CONSTRAINT staff_shifts_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_training_progress ADD CONSTRAINT staff_training_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.staffing_rules ADD CONSTRAINT staffing_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.storage_locations ADD CONSTRAINT storage_locations_pkey PRIMARY KEY (id);
ALTER TABLE public.supplier_analysis ADD CONSTRAINT supplier_analysis_pkey PRIMARY KEY (id);
ALTER TABLE public.supplier_invoices ADD CONSTRAINT supplier_invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);
ALTER TABLE public.support_templates ADD CONSTRAINT support_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);
ALTER TABLE public.sustainability_goals ADD CONSTRAINT sustainability_goals_pkey PRIMARY KEY (id);
ALTER TABLE public.sustainability_reports ADD CONSTRAINT sustainability_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.table_reservations ADD CONSTRAINT table_reservations_pkey PRIMARY KEY (id);
ALTER TABLE public.team_permissions_history ADD CONSTRAINT team_permissions_history_pkey PRIMARY KEY (id);
ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.time_off_requests ADD CONSTRAINT time_off_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.tip_allocations ADD CONSTRAINT tip_allocations_pkey PRIMARY KEY (id);
ALTER TABLE public.tip_periods ADD CONSTRAINT tip_periods_pkey PRIMARY KEY (id);
ALTER TABLE public.tip_policies ADD CONSTRAINT tip_policies_pkey PRIMARY KEY (user_id);
ALTER TABLE public.tip_role_weights ADD CONSTRAINT tip_role_weights_pkey PRIMARY KEY (id);
ALTER TABLE public.training_courses ADD CONSTRAINT training_courses_pkey PRIMARY KEY (id);
ALTER TABLE public.training_programs ADD CONSTRAINT training_programs_pkey PRIMARY KEY (id);
ALTER TABLE public.unit_conversions ADD CONSTRAINT unit_conversions_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.venue_bookings ADD CONSTRAINT venue_bookings_pkey PRIMARY KEY (id);
ALTER TABLE public.venues ADD CONSTRAINT venues_pkey PRIMARY KEY (id);
ALTER TABLE public.virtual_brands ADD CONSTRAINT virtual_brands_pkey PRIMARY KEY (id);
ALTER TABLE public.website_templates ADD CONSTRAINT website_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.allergens ADD CONSTRAINT allergens_name_key UNIQUE (name);
ALTER TABLE public.applicant_profiles ADD CONSTRAINT applicant_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.consultant_profiles ADD CONSTRAINT consultant_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.copilot_alerts ADD CONSTRAINT copilot_alerts_user_id_alert_type_key UNIQUE (user_id, alert_type);
ALTER TABLE public.course_certificates ADD CONSTRAINT course_certificates_certificate_number_key UNIQUE (certificate_number);
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_course_id_user_id_key UNIQUE (course_id, user_id);
ALTER TABLE public.course_reviews ADD CONSTRAINT course_reviews_user_id_course_id_key UNIQUE (user_id, course_id);
ALTER TABLE public.daily_briefings ADD CONSTRAINT daily_briefings_user_id_briefing_date_key UNIQUE (user_id, briefing_date);
ALTER TABLE public.event_categories ADD CONSTRAINT event_categories_name_key UNIQUE (name);
ALTER TABLE public.event_quotations ADD CONSTRAINT event_quotations_public_slug_key UNIQUE (public_slug);
ALTER TABLE public.growth_preregistrations ADD CONSTRAINT growth_preregistrations_email_key UNIQUE (email);
ALTER TABLE public.inventory_item_suppliers ADD CONSTRAINT inventory_item_suppliers_inventory_item_id_supplier_id_key UNIQUE (inventory_item_id, supplier_id);
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_job_id_applicant_id_key UNIQUE (job_id, applicant_id);
ALTER TABLE public.job_saved ADD CONSTRAINT job_saved_user_id_job_id_key UNIQUE (user_id, job_id);
ALTER TABLE public.learning_track_courses ADD CONSTRAINT learning_track_courses_track_id_course_id_key UNIQUE (track_id, course_id);
ALTER TABLE public.learning_tracks ADD CONSTRAINT learning_tracks_slug_key UNIQUE (slug);
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
ALTER TABLE public.loyalty_customer_achievements ADD CONSTRAINT loyalty_customer_achievements_customer_id_achievement_id_key UNIQUE (customer_id, achievement_id);
ALTER TABLE public.loyalty_customers ADD CONSTRAINT loyalty_customers_loyalty_code_key UNIQUE (loyalty_code);
ALTER TABLE public.loyalty_customers ADD CONSTRAINT loyalty_customers_user_id_customer_email_key UNIQUE (user_id, customer_email);
ALTER TABLE public.loyalty_customers ADD CONSTRAINT loyalty_customers_user_id_customer_phone_key UNIQUE (user_id, customer_phone);
ALTER TABLE public.loyalty_rewards ADD CONSTRAINT loyalty_rewards_redemption_code_key UNIQUE (redemption_code);
ALTER TABLE public.maturity_action_tracking ADD CONSTRAINT maturity_action_tracking_diagnosis_id_action_id_key UNIQUE (diagnosis_id, action_id);
ALTER TABLE public.menu_allergens ADD CONSTRAINT menu_allergens_code_key UNIQUE (code);
ALTER TABLE public.menu_item_modifier_links ADD CONSTRAINT menu_item_modifier_links_menu_item_id_modifier_id_key UNIQUE (menu_item_id, modifier_id);
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);
ALTER TABLE public.opening_phase_analyses ADD CONSTRAINT opening_phase_analyses_project_phase_unique UNIQUE (project_id, phase);
ALTER TABLE public.payment_gateway_credentials ADD CONSTRAINT payment_gateway_credentials_user_id_gateway_key UNIQUE (user_id, gateway);
ALTER TABLE public.payment_webhook_events ADD CONSTRAINT payment_webhook_events_provider_external_event_id_key UNIQUE (provider, external_event_id);
ALTER TABLE public.pre_opening_tasks ADD CONSTRAINT pre_opening_tasks_user_id_task_key_key UNIQUE (user_id, task_key);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
ALTER TABLE public.rappi_menu_sync ADD CONSTRAINT rappi_menu_sync_integration_id_menu_item_id_store_id_key UNIQUE (integration_id, menu_item_id, store_id);
ALTER TABLE public.rappi_settlements ADD CONSTRAINT rappi_settlements_integration_id_store_id_settlement_date_key UNIQUE (integration_id, store_id, settlement_date);
ALTER TABLE public.rappi_webhook_events ADD CONSTRAINT rappi_webhook_events_event_id_key UNIQUE (event_id);
ALTER TABLE public.recipe_menu_items ADD CONSTRAINT recipe_menu_items_recipe_id_menu_item_id_key UNIQUE (recipe_id, menu_item_id);
ALTER TABLE public.recipe_nutrition ADD CONSTRAINT recipe_nutrition_recipe_id_key UNIQUE (recipe_id);
ALTER TABLE public.recipe_sub_recipes ADD CONSTRAINT recipe_sub_recipes_parent_recipe_id_sub_recipe_id_key UNIQUE (parent_recipe_id, sub_recipe_id);
ALTER TABLE public.restaurant_custom_roles ADD CONSTRAINT restaurant_custom_roles_business_id_key_key UNIQUE (business_id, key);
ALTER TABLE public.restaurant_menus ADD CONSTRAINT restaurant_menus_public_url_slug_key UNIQUE (public_url_slug);
ALTER TABLE public.restaurant_tables ADD CONSTRAINT restaurant_tables_user_id_table_number_key UNIQUE (user_id, table_number);
ALTER TABLE public.restaurant_team_members ADD CONSTRAINT unique_business_email UNIQUE (business_id, invited_email);
ALTER TABLE public.restaurant_team_members ADD CONSTRAINT unique_business_user UNIQUE (business_id, user_id);
ALTER TABLE public.restaurant_websites ADD CONSTRAINT restaurant_websites_slug_key UNIQUE (slug);
ALTER TABLE public.staff_benefit_assignments ADD CONSTRAINT staff_benefit_assignments_staff_member_id_benefit_id_key UNIQUE (staff_member_id, benefit_id);
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_linked_user_id_key UNIQUE (linked_user_id);
ALTER TABLE public.staff_training_progress ADD CONSTRAINT staff_training_progress_staff_member_id_training_program_id_key UNIQUE (staff_member_id, training_program_id);
ALTER TABLE public.staffing_rules ADD CONSTRAINT staffing_rules_user_id_position_key UNIQUE (user_id, "position");
ALTER TABLE public.tip_allocations ADD CONSTRAINT tip_allocations_period_id_staff_member_id_key UNIQUE (period_id, staff_member_id);
ALTER TABLE public.tip_periods ADD CONSTRAINT tip_periods_user_id_start_date_end_date_key UNIQUE (user_id, start_date, end_date);
ALTER TABLE public.tip_role_weights ADD CONSTRAINT tip_role_weights_user_id_position_key UNIQUE (user_id, "position");
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.copilot_messages ADD CONSTRAINT copilot_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])));
ALTER TABLE public.course_reviews ADD CONSTRAINT course_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_ambiance_rating_check CHECK (((ambiance_rating >= 1) AND (ambiance_rating <= 5)));
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_food_rating_check CHECK (((food_rating >= 1) AND (food_rating <= 5)));
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_service_rating_check CHECK (((service_rating >= 1) AND (service_rating <= 5)));
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_value_rating_check CHECK (((value_rating >= 1) AND (value_rating <= 5)));
ALTER TABLE public.demand_events ADD CONSTRAINT demand_events_category_check CHECK ((category = ANY (ARRAY['deporte'::text, 'festivo'::text, 'evento_privado'::text, 'promocion'::text, 'otro'::text])));
ALTER TABLE public.demand_events ADD CONSTRAINT demand_events_expected_lift_check CHECK (((expected_lift > (0)::numeric) AND (expected_lift <= (5)::numeric)));
ALTER TABLE public.finance_accounts ADD CONSTRAINT finance_accounts_account_type_check CHECK ((account_type = ANY (ARRAY['bank'::text, 'cash'::text, 'wallet'::text])));
ALTER TABLE public.finance_accounts ADD CONSTRAINT finance_accounts_name_check CHECK (((length(btrim(name)) >= 1) AND (length(btrim(name)) <= 80)));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_card_fee_pct_check CHECK (((card_fee_pct >= (0)::numeric) AND (card_fee_pct <= (20)::numeric)));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_card_settlement_days_check CHECK (((card_settlement_days >= 0) AND (card_settlement_days <= 30)));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_card_withholding_pct_check CHECK (((card_withholding_pct >= (0)::numeric) AND (card_withholding_pct <= (20)::numeric)));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_digital_fee_pct_check CHECK (((digital_fee_pct >= (0)::numeric) AND (digital_fee_pct <= (20)::numeric)));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_min_cash_buffer_check CHECK ((min_cash_buffer >= (0)::numeric));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_rappi_commission_pct_check CHECK (((rappi_commission_pct >= (0)::numeric) AND (rappi_commission_pct <= (60)::numeric)));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_rappi_settlement_days_check CHECK (((rappi_settlement_days >= 1) AND (rappi_settlement_days <= 45)));
ALTER TABLE public.finance_settings ADD CONSTRAINT finance_settings_supplier_payment_days_check CHECK (((supplier_payment_days >= 0) AND (supplier_payment_days <= 90)));
ALTER TABLE public.finance_settlements ADD CONSTRAINT finance_settlements_channel_check CHECK ((channel = ANY (ARRAY['card'::text, 'rappi'::text, 'digital'::text])));
ALTER TABLE public.finance_settlements ADD CONSTRAINT finance_settlements_net_deposited_check CHECK ((net_deposited >= (0)::numeric));
ALTER TABLE public.finance_settlements ADD CONSTRAINT finance_settlements_period CHECK ((period_end >= period_start));
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_current_stock_nonneg CHECK (((current_stock IS NULL) OR (current_stock >= (0)::numeric)));
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_item_name_min CHECK ((char_length(TRIM(BOTH FROM item_name)) >= 2));
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_unit_cost_range CHECK (((unit_cost IS NULL) OR ((unit_cost >= (0)::numeric) AND (unit_cost < (100000000)::numeric))));
ALTER TABLE public.loyalty_achievements ADD CONSTRAINT loyalty_achievements_achievement_type_check CHECK ((achievement_type = ANY (ARRAY['orders_count'::text, 'total_spent'::text, 'streak'::text, 'referrals'::text, 'reviews'::text, 'custom'::text])));
ALTER TABLE public.loyalty_campaigns ADD CONSTRAINT loyalty_campaigns_campaign_type_check CHECK ((campaign_type = ANY (ARRAY['points_multiplier'::text, 'bonus_points'::text, 'birthday'::text, 'reactivation'::text, 'referral'::text, 'achievement'::text])));
ALTER TABLE public.loyalty_campaigns ADD CONSTRAINT loyalty_campaigns_target_segment_check CHECK ((target_segment = ANY (ARRAY['all'::text, 'new'::text, 'at_risk'::text, 'inactive'::text, 'vip'::text, 'birthday'::text])));
ALTER TABLE public.loyalty_points_transactions ADD CONSTRAINT loyalty_points_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['earn'::text, 'redeem'::text, 'bonus'::text, 'expire'::text, 'adjustment'::text])));
ALTER TABLE public.loyalty_rewards ADD CONSTRAINT loyalty_rewards_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'redeemed'::text, 'expired'::text, 'cancelled'::text])));
ALTER TABLE public.loyalty_rewards_catalog ADD CONSTRAINT loyalty_rewards_catalog_reward_type_check CHECK ((reward_type = ANY (ARRAY['discount_percent'::text, 'discount_fixed'::text, 'free_item'::text, 'free_delivery'::text, 'experience'::text, 'upgrade'::text])));
ALTER TABLE public.marketing_content ADD CONSTRAINT marketing_content_body_check CHECK (((length(body) >= 1) AND (length(body) <= 4000)));
ALTER TABLE public.marketing_content ADD CONSTRAINT marketing_content_channel_check CHECK ((channel = ANY (ARRAY['instagram'::text, 'story'::text, 'whatsapp'::text, 'google'::text, 'tiktok'::text])));
ALTER TABLE public.marketing_content ADD CONSTRAINT marketing_content_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'discarded'::text])));
ALTER TABLE public.maturity_action_tracking ADD CONSTRAINT maturity_action_tracking_priority_check CHECK ((priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])));
ALTER TABLE public.maturity_action_tracking ADD CONSTRAINT maturity_action_tracking_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text])));
ALTER TABLE public.menu_item_modifiers ADD CONSTRAINT menu_item_modifiers_type_check CHECK ((type = ANY (ARRAY['single'::text, 'multiple'::text, 'required'::text])));
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_spicy_level_check CHECK (((spicy_level >= 0) AND (spicy_level <= 5)));
ALTER TABLE public.opening_analysis_runs ADD CONSTRAINT opening_analysis_runs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])));
ALTER TABLE public.payment_gateway_credentials ADD CONSTRAINT payment_gateway_credentials_gateway_check CHECK ((gateway = ANY (ARRAY['wompi'::text, 'bold'::text, 'mercadopago'::text, 'epayco'::text])));
ALTER TABLE public.pos_cash_movements ADD CONSTRAINT pos_cash_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'adjustment'::text])));
ALTER TABLE public.pos_discounts ADD CONSTRAINT pos_discounts_discount_type_check CHECK ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text])));
ALTER TABLE public.pos_payment_methods ADD CONSTRAINT pos_payment_methods_method_type_check CHECK ((method_type = ANY (ARRAY['cash'::text, 'card'::text, 'digital_wallet'::text, 'transfer'::text, 'qr'::text, 'credit'::text])));
ALTER TABLE public.pos_payment_methods ADD CONSTRAINT pos_payment_methods_provider_check CHECK ((provider = ANY (ARRAY['wompi'::text, 'mercadopago'::text, 'epayco'::text, 'nequi'::text, 'daviplata'::text, 'pse'::text, 'efecty'::text, 'manual'::text])));
ALTER TABLE public.pos_pin_attempts ADD CONSTRAINT pos_pin_attempts_kind_check CHECK ((kind = ANY (ARRAY['login'::text, 'supervisor'::text])));
ALTER TABLE public.pos_sessions ADD CONSTRAINT pos_sessions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'suspended'::text])));
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])));
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['sale'::text, 'refund'::text, 'void'::text, 'tip'::text, 'cash_in'::text, 'cash_out'::text])));
ALTER TABLE public.pre_opening_tasks ADD CONSTRAINT pre_opening_tasks_category_check CHECK ((category = ANY (ARRAY['operations'::text, 'marketing'::text, 'team'::text, 'legal'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check CHECK ((user_type = ANY (ARRAY['restaurant_owner'::text, 'consultant'::text])));
ALTER TABLE public.provider_reviews ADD CONSTRAINT provider_reviews_communication_rating_check CHECK (((communication_rating >= 1) AND (communication_rating <= 5)));
ALTER TABLE public.provider_reviews ADD CONSTRAINT provider_reviews_punctuality_rating_check CHECK (((punctuality_rating >= 1) AND (punctuality_rating <= 5)));
ALTER TABLE public.provider_reviews ADD CONSTRAINT provider_reviews_quality_rating_check CHECK (((quality_rating >= 1) AND (quality_rating <= 5)));
ALTER TABLE public.provider_reviews ADD CONSTRAINT provider_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_yield_percentage_valid CHECK (((yield_percentage IS NULL) OR ((yield_percentage > (0)::numeric) AND (yield_percentage <= (100)::numeric))));
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_amount_check CHECK ((amount > (0)::numeric));
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_category_check CHECK ((category = ANY (ARRAY['arriendo'::text, 'servicios_publicos'::text, 'nomina_prestaciones'::text, 'mercadeo'::text, 'mantenimiento'::text, 'software_licencias'::text, 'comisiones'::text, 'impuestos'::text, 'bancarios'::text, 'seguros'::text, 'domicilios'::text, 'aseo_desechables'::text, 'otros'::text])));
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_description_check CHECK (((length(btrim(description)) >= 1) AND (length(btrim(description)) <= 160)));
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_occurrence_not_template CHECK (((recurrence_parent IS NULL) OR (recurrence = 'none'::text)));
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_paid_has_date CHECK (((status <> 'paid'::text) OR (paid_at IS NOT NULL)));
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_recurrence_check CHECK ((recurrence = ANY (ARRAY['none'::text, 'monthly'::text])));
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])));
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_kitchen_status_check CHECK ((kitchen_status = ANY (ARRAY['pending'::text, 'preparing'::text, 'ready'::text, 'served'::text])));
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_sales_channel_check CHECK ((sales_channel = ANY (ARRAY['dine_in'::text, 'pos'::text, 'delivery_own'::text, 'rappi'::text, 'takeout'::text, 'other'::text])));
ALTER TABLE public.restaurant_tables ADD CONSTRAINT restaurant_tables_shape_check CHECK ((shape = ANY (ARRAY['rectangle'::text, 'circle'::text, 'square'::text])));
ALTER TABLE public.restaurant_tables ADD CONSTRAINT restaurant_tables_status_check CHECK ((status = ANY (ARRAY['available'::text, 'occupied'::text, 'reserved'::text, 'billing'::text, 'maintenance'::text])));
ALTER TABLE public.reviews ADD CONSTRAINT review_target_check CHECK ((((venue_id IS NOT NULL) AND (provider_id IS NULL) AND (course_id IS NULL)) OR ((venue_id IS NULL) AND (provider_id IS NOT NULL) AND (course_id IS NULL)) OR ((venue_id IS NULL) AND (provider_id IS NULL) AND (course_id IS NOT NULL))));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.shift_swap_requests ADD CONSTRAINT shift_swap_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text, 'cancelled'::text, 'accepted_pending_approval'::text])));
ALTER TABLE public.shift_swap_requests ADD CONSTRAINT shift_swap_requests_swap_type_check CHECK ((swap_type = ANY (ARRAY['give_away'::text, 'swap'::text, 'cover'::text])));
ALTER TABLE public.staff_availability ADD CONSTRAINT staff_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)));
ALTER TABLE public.staff_certifications ADD CONSTRAINT staff_certifications_certification_type_check CHECK ((certification_type = ANY (ARRAY['food_safety'::text, 'alcohol'::text, 'first_aid'::text, 'training'::text, 'other'::text])));
ALTER TABLE public.staff_certifications ADD CONSTRAINT staff_certifications_status_check CHECK ((status = ANY (ARRAY['valid'::text, 'expired'::text, 'pending'::text, 'revoked'::text])));
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_pos_role_check CHECK ((pos_role = ANY (ARRAY['cashier'::text, 'waiter'::text, 'supervisor'::text, 'admin'::text])));
ALTER TABLE public.staff_shifts ADD CONSTRAINT staff_shifts_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'no_show'::character varying])::text[])));
ALTER TABLE public.staffing_rules ADD CONSTRAINT staffing_rules_check CHECK ((max_staff >= min_staff));
ALTER TABLE public.staffing_rules ADD CONSTRAINT staffing_rules_min_staff_check CHECK ((min_staff >= 0));
ALTER TABLE public.staffing_rules ADD CONSTRAINT staffing_rules_orders_per_staff_hour_check CHECK ((orders_per_staff_hour > (0)::numeric));
ALTER TABLE public.supplier_analysis ADD CONSTRAINT supplier_analysis_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'analyzing'::text, 'completed'::text, 'error'::text])));
ALTER TABLE public.time_off_requests ADD CONSTRAINT time_off_requests_request_type_check CHECK ((request_type = ANY (ARRAY['vacation'::text, 'sick'::text, 'personal'::text, 'unpaid'::text, 'other'::text])));
ALTER TABLE public.time_off_requests ADD CONSTRAINT time_off_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text, 'cancelled'::text])));
ALTER TABLE public.tip_allocations ADD CONSTRAINT tip_allocations_check CHECK (((adjustment = (0)::numeric) OR (COALESCE(btrim(adjustment_reason), ''::text) <> ''::text)));
ALTER TABLE public.tip_allocations ADD CONSTRAINT tip_allocations_check1 CHECK (((manager_factor = (1)::numeric) OR (COALESCE(btrim(factor_reason), ''::text) <> ''::text)));
ALTER TABLE public.tip_allocations ADD CONSTRAINT tip_allocations_manager_factor_check CHECK (((manager_factor >= (0)::numeric) AND (manager_factor <= (2)::numeric)));
ALTER TABLE public.tip_periods ADD CONSTRAINT tip_periods_check CHECK ((end_date >= start_date));
ALTER TABLE public.tip_periods ADD CONSTRAINT tip_periods_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'closed'::text])));
ALTER TABLE public.tip_policies ADD CONSTRAINT tip_policies_pool_basis_check CHECK ((pool_basis = ANY (ARRAY['days'::text, 'hours'::text])));
ALTER TABLE public.tip_policies ADD CONSTRAINT tip_policies_rounding_check CHECK ((rounding = ANY (ARRAY[1, 10, 50, 100, 500, 1000])));
ALTER TABLE public.tip_policies ADD CONSTRAINT tip_policies_table_share_pct_check CHECK (((table_share_pct >= (0)::numeric) AND (table_share_pct <= (100)::numeric)));
ALTER TABLE public.tip_role_weights ADD CONSTRAINT tip_role_weights_tip_group_check CHECK ((tip_group = ANY (ARRAY['sala'::text, 'barra'::text, 'cocina'::text, 'apoyo'::text, 'gerencia'::text, 'excluido'::text])));
ALTER TABLE public.tip_role_weights ADD CONSTRAINT tip_role_weights_weight_check CHECK (((weight >= (0)::numeric) AND (weight <= (10)::numeric)));
ALTER TABLE public.unit_conversions ADD CONSTRAINT unit_conversions_conversion_factor_check CHECK ((conversion_factor > (0)::numeric));
ALTER TABLE public.aggregator_integrations ADD CONSTRAINT aggregator_integrations_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.virtual_brands(id) ON DELETE SET NULL;
ALTER TABLE public.aggregator_orders ADD CONSTRAINT aggregator_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.virtual_brands(id) ON DELETE SET NULL;
ALTER TABLE public.applicant_profiles ADD CONSTRAINT applicant_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.benefit_requests ADD CONSTRAINT benefit_requests_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.staff_benefits(id) ON DELETE CASCADE;
ALTER TABLE public.benefit_requests ADD CONSTRAINT benefit_requests_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.brand_assets ADD CONSTRAINT brand_assets_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.restaurant_brands(id) ON DELETE CASCADE;
ALTER TABLE public.brand_menus ADD CONSTRAINT brand_menus_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.virtual_brands(id) ON DELETE CASCADE;
ALTER TABLE public.candidate_experience ADD CONSTRAINT candidate_experience_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidate_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.chain_locations ADD CONSTRAINT chain_locations_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.restaurant_chains(id) ON DELETE CASCADE;
ALTER TABLE public.chain_master_menus ADD CONSTRAINT chain_master_menus_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.restaurant_chains(id) ON DELETE CASCADE;
ALTER TABLE public.compliance_checklists ADD CONSTRAINT compliance_checklists_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.restaurant_chains(id) ON DELETE CASCADE;
ALTER TABLE public.compliance_records ADD CONSTRAINT compliance_records_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.compliance_checklists(id) ON DELETE CASCADE;
ALTER TABLE public.compliance_records ADD CONSTRAINT compliance_records_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.chain_locations(id) ON DELETE CASCADE;
ALTER TABLE public.consultant_clients ADD CONSTRAINT consultant_clients_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.consultant_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.consultant_reports ADD CONSTRAINT consultant_reports_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.consultant_clients(id) ON DELETE SET NULL;
ALTER TABLE public.consultant_reports ADD CONSTRAINT consultant_reports_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.consultant_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.consulting_invoices ADD CONSTRAINT consulting_invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.consultant_clients(id) ON DELETE CASCADE;
ALTER TABLE public.consulting_invoices ADD CONSTRAINT consulting_invoices_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.consultant_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.copilot_messages ADD CONSTRAINT copilot_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.copilot_conversations(id) ON DELETE CASCADE;
ALTER TABLE public.course_certificates ADD CONSTRAINT course_certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE SET NULL;
ALTER TABLE public.course_certificates ADD CONSTRAINT course_certificates_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.learning_tracks(id) ON DELETE SET NULL;
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.course_certificates(id) ON DELETE SET NULL;
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.course_lessons ADD CONSTRAINT course_lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;
ALTER TABLE public.course_reviews ADD CONSTRAINT course_reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.feedback_campaigns(id);
ALTER TABLE public.customer_feedback ADD CONSTRAINT customer_feedback_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.restaurant_orders(id);
ALTER TABLE public.event_quotations ADD CONSTRAINT event_quotations_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.consultant_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.event_quotations ADD CONSTRAINT event_quotations_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurant_businesses(id);
ALTER TABLE public.event_quotations ADD CONSTRAINT event_quotations_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.restaurant_zones(id);
ALTER TABLE public.events ADD CONSTRAINT events_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.event_categories(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;
ALTER TABLE public.finance_settlements ADD CONSTRAINT finance_settlements_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_count_id_fkey FOREIGN KEY (count_id) REFERENCES public.inventory_counts(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);
ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_storage_location_id_fkey FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id);
ALTER TABLE public.inventory_deductions ADD CONSTRAINT inventory_deductions_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);
ALTER TABLE public.inventory_deductions ADD CONSTRAINT inventory_deductions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.restaurant_orders(id);
ALTER TABLE public.inventory_deductions ADD CONSTRAINT inventory_deductions_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id);
ALTER TABLE public.inventory_item_suppliers ADD CONSTRAINT inventory_item_suppliers_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_item_suppliers ADD CONSTRAINT inventory_item_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.inventory_suppliers(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_storage_location_id_fkey FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_from_location_id_fkey FOREIGN KEY (from_location_id) REFERENCES public.storage_locations(id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES public.storage_locations(id);
ALTER TABLE public.inventory_price_history ADD CONSTRAINT inventory_price_history_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_price_history ADD CONSTRAINT inventory_price_history_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_transfers ADD CONSTRAINT inventory_transfers_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.restaurant_chains(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_transfers ADD CONSTRAINT inventory_transfers_from_location_id_fkey FOREIGN KEY (from_location_id) REFERENCES public.chain_locations(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_transfers ADD CONSTRAINT inventory_transfers_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES public.chain_locations(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_waste ADD CONSTRAINT inventory_waste_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);
ALTER TABLE public.inventory_waste ADD CONSTRAINT inventory_waste_storage_location_id_fkey FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id);
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_candidate_profile_id_fkey FOREIGN KEY (candidate_profile_id) REFERENCES public.candidate_profiles(id);
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.job_saved ADD CONSTRAINT job_saved_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.kitchen_production_queue ADD CONSTRAINT kitchen_production_queue_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.virtual_brands(id) ON DELETE SET NULL;
ALTER TABLE public.kitchen_production_queue ADD CONSTRAINT kitchen_production_queue_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.aggregator_orders(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_chunks ADD CONSTRAINT knowledge_chunks_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.knowledge_sources(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_chunks ADD CONSTRAINT knowledge_chunks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_sources ADD CONSTRAINT knowledge_sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.learning_track_courses ADD CONSTRAINT learning_track_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;
ALTER TABLE public.learning_track_courses ADD CONSTRAINT learning_track_courses_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.learning_tracks(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_customer_achievements ADD CONSTRAINT loyalty_customer_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.loyalty_achievements(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_customer_achievements ADD CONSTRAINT loyalty_customer_achievements_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.loyalty_customers(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_customers ADD CONSTRAINT loyalty_customers_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL;
ALTER TABLE public.loyalty_points_transactions ADD CONSTRAINT loyalty_points_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.loyalty_customers(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_rewards ADD CONSTRAINT loyalty_rewards_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES public.loyalty_rewards_catalog(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_rewards ADD CONSTRAINT loyalty_rewards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.loyalty_customers(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_rewards_catalog ADD CONSTRAINT loyalty_rewards_catalog_min_tier_id_fkey FOREIGN KEY (min_tier_id) REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL;
ALTER TABLE public.maturity_action_tracking ADD CONSTRAINT maturity_action_tracking_diagnosis_id_fkey FOREIGN KEY (diagnosis_id) REFERENCES public.maturity_diagnoses(id) ON DELETE CASCADE;
ALTER TABLE public.maturity_diagnoses ADD CONSTRAINT maturity_diagnoses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.measurement_units ADD CONSTRAINT measurement_units_base_unit_id_fkey FOREIGN KEY (base_unit_id) REFERENCES public.measurement_units(id);
ALTER TABLE public.menu_categories ADD CONSTRAINT menu_categories_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.restaurant_menus(id) ON DELETE CASCADE;
ALTER TABLE public.menu_item_modifier_links ADD CONSTRAINT menu_item_modifier_links_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
ALTER TABLE public.menu_item_modifier_links ADD CONSTRAINT menu_item_modifier_links_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.menu_item_modifiers(id) ON DELETE CASCADE;
ALTER TABLE public.menu_item_modifiers ADD CONSTRAINT menu_item_modifiers_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.restaurant_menus(id) ON DELETE CASCADE;
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id) ON DELETE SET NULL;
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.restaurant_menus(id) ON DELETE CASCADE;
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;
ALTER TABLE public.menu_modifier_options ADD CONSTRAINT menu_modifier_options_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.menu_item_modifiers(id) ON DELETE CASCADE;
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications_log ADD CONSTRAINT notifications_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.opening_analysis_runs ADD CONSTRAINT opening_analysis_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.business_opening_projects(id) ON DELETE CASCADE;
ALTER TABLE public.opening_checklist_items ADD CONSTRAINT opening_checklist_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.business_opening_projects(id) ON DELETE CASCADE;
ALTER TABLE public.opening_phase_analyses ADD CONSTRAINT opening_phase_analyses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.business_opening_projects(id) ON DELETE CASCADE;
ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.restaurant_orders(id) ON DELETE CASCADE;
ALTER TABLE public.pos_cash_movements ADD CONSTRAINT pos_cash_movements_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.restaurant_orders(id) ON DELETE SET NULL;
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.pos_payment_methods(id);
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.pre_opening_tasks ADD CONSTRAINT pre_opening_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.business_opening_projects(id) ON DELETE CASCADE;
ALTER TABLE public.pre_opening_tasks ADD CONSTRAINT pre_opening_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.provider_portfolio ADD CONSTRAINT provider_portfolio_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;
ALTER TABLE public.provider_reviews ADD CONSTRAINT provider_reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;
ALTER TABLE public.provider_reviews ADD CONSTRAINT provider_reviews_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE SET NULL;
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.inventory_suppliers(id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.quotation_gallery ADD CONSTRAINT quotation_gallery_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.event_quotations(id) ON DELETE CASCADE;
ALTER TABLE public.quotation_menu_items ADD CONSTRAINT quotation_menu_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);
ALTER TABLE public.quotation_menu_items ADD CONSTRAINT quotation_menu_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.event_quotations(id) ON DELETE CASCADE;
ALTER TABLE public.quotation_services ADD CONSTRAINT quotation_services_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.event_quotations(id) ON DELETE CASCADE;
ALTER TABLE public.quotation_services ADD CONSTRAINT quotation_services_service_provider_id_fkey FOREIGN KEY (service_provider_id) REFERENCES public.service_providers(id);
ALTER TABLE public.rappi_menu_sync ADD CONSTRAINT rappi_menu_sync_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.aggregator_integrations(id) ON DELETE CASCADE;
ALTER TABLE public.rappi_menu_sync ADD CONSTRAINT rappi_menu_sync_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
ALTER TABLE public.rappi_settlements ADD CONSTRAINT rappi_settlements_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.aggregator_integrations(id) ON DELETE CASCADE;
ALTER TABLE public.rappi_store_status ADD CONSTRAINT rappi_store_status_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.aggregator_integrations(id) ON DELETE CASCADE;
ALTER TABLE public.rappi_webhook_events ADD CONSTRAINT rappi_webhook_events_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.aggregator_integrations(id) ON DELETE SET NULL;
ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE SET NULL;
ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.measurement_units(id);
ALTER TABLE public.recipe_menu_items ADD CONSTRAINT recipe_menu_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_menu_items ADD CONSTRAINT recipe_menu_items_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_nutrition ADD CONSTRAINT recipe_nutrition_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_steps ADD CONSTRAINT recipe_steps_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_sub_recipes ADD CONSTRAINT recipe_sub_recipes_parent_recipe_id_fkey FOREIGN KEY (parent_recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_sub_recipes ADD CONSTRAINT recipe_sub_recipes_sub_recipe_id_fkey FOREIGN KEY (sub_recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_versions ADD CONSTRAINT recipe_versions_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
ALTER TABLE public.recipes ADD CONSTRAINT recipes_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_custom_roles ADD CONSTRAINT restaurant_custom_roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.restaurant_businesses(id) ON DELETE CASCADE;
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_expenses ADD CONSTRAINT restaurant_expenses_recurrence_parent_fkey FOREIGN KEY (recurrence_parent) REFERENCES public.restaurant_expenses(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_menus ADD CONSTRAINT restaurant_menus_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.restaurant_brands(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_menus ADD CONSTRAINT restaurant_menus_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.menu_templates(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_menus ADD CONSTRAINT restaurant_menus_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.pos_discounts(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_merged_into_order_id_fkey FOREIGN KEY (merged_into_order_id) REFERENCES public.restaurant_orders(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_split_from_order_id_fkey FOREIGN KEY (split_from_order_id) REFERENCES public.restaurant_orders(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_orders ADD CONSTRAINT restaurant_orders_transferred_from_table_id_fkey FOREIGN KEY (transferred_from_table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_tables ADD CONSTRAINT restaurant_tables_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.restaurant_zones(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_team_members ADD CONSTRAINT restaurant_team_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.restaurant_businesses(id) ON DELETE CASCADE;
ALTER TABLE public.restaurant_team_members ADD CONSTRAINT restaurant_team_members_custom_role_id_fkey FOREIGN KEY (custom_role_id) REFERENCES public.restaurant_custom_roles(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_team_members ADD CONSTRAINT restaurant_team_members_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_team_members ADD CONSTRAINT restaurant_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_websites ADD CONSTRAINT restaurant_websites_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.website_templates(id);
ALTER TABLE public.restaurant_websites ADD CONSTRAINT restaurant_websites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.restaurant_zones ADD CONSTRAINT restaurant_zones_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.consultant_profiles(id);
ALTER TABLE public.restaurant_zones ADD CONSTRAINT restaurant_zones_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurant_businesses(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;
ALTER TABLE public.service_bookings ADD CONSTRAINT service_bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.service_bookings ADD CONSTRAINT service_bookings_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.service_proposals(id) ON DELETE SET NULL;
ALTER TABLE public.service_bookings ADD CONSTRAINT service_bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;
ALTER TABLE public.service_bookings ADD CONSTRAINT service_bookings_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE SET NULL;
ALTER TABLE public.service_bookings ADD CONSTRAINT service_bookings_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.provider_reviews(id) ON DELETE SET NULL;
ALTER TABLE public.service_bookings ADD CONSTRAINT service_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.service_proposals ADD CONSTRAINT service_proposals_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;
ALTER TABLE public.service_proposals ADD CONSTRAINT service_proposals_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;
ALTER TABLE public.service_providers ADD CONSTRAINT service_providers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.shift_swap_requests ADD CONSTRAINT shift_swap_requests_original_shift_id_fkey FOREIGN KEY (original_shift_id) REFERENCES public.staff_shifts(id) ON DELETE CASCADE;
ALTER TABLE public.shift_swap_requests ADD CONSTRAINT shift_swap_requests_requesting_staff_id_fkey FOREIGN KEY (requesting_staff_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.shift_swap_requests ADD CONSTRAINT shift_swap_requests_target_shift_id_fkey FOREIGN KEY (target_shift_id) REFERENCES public.staff_shifts(id) ON DELETE SET NULL;
ALTER TABLE public.shift_swap_requests ADD CONSTRAINT shift_swap_requests_target_staff_id_fkey FOREIGN KEY (target_staff_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE public.staff_availability ADD CONSTRAINT staff_availability_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.staff_benefit_assignments ADD CONSTRAINT staff_benefit_assignments_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.staff_benefits(id) ON DELETE CASCADE;
ALTER TABLE public.staff_benefit_assignments ADD CONSTRAINT staff_benefit_assignments_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.staff_certifications ADD CONSTRAINT staff_certifications_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.staff_shifts ADD CONSTRAINT staff_shifts_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.staff_shifts ADD CONSTRAINT staff_shifts_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.shift_templates(id) ON DELETE SET NULL;
ALTER TABLE public.staff_training_progress ADD CONSTRAINT staff_training_progress_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.staff_training_progress ADD CONSTRAINT staff_training_progress_training_program_id_fkey FOREIGN KEY (training_program_id) REFERENCES public.training_programs(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_analysis ADD CONSTRAINT supplier_analysis_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE SET NULL;
ALTER TABLE public.supplier_invoices ADD CONSTRAINT supplier_invoices_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.supplier_invoices ADD CONSTRAINT supplier_invoices_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.restaurant_orders(id) ON DELETE SET NULL;
ALTER TABLE public.table_reservations ADD CONSTRAINT table_reservations_loyalty_customer_id_fkey FOREIGN KEY (loyalty_customer_id) REFERENCES public.loyalty_customers(id);
ALTER TABLE public.table_reservations ADD CONSTRAINT table_reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;
ALTER TABLE public.table_reservations ADD CONSTRAINT table_reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.team_permissions_history ADD CONSTRAINT team_permissions_history_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.restaurant_team_members(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;
ALTER TABLE public.time_off_requests ADD CONSTRAINT time_off_requests_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
ALTER TABLE public.tip_allocations ADD CONSTRAINT tip_allocations_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.tip_periods(id) ON DELETE CASCADE;
ALTER TABLE public.training_courses ADD CONSTRAINT training_courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.unit_conversions ADD CONSTRAINT unit_conversions_from_unit_id_fkey FOREIGN KEY (from_unit_id) REFERENCES public.measurement_units(id) ON DELETE CASCADE;
ALTER TABLE public.unit_conversions ADD CONSTRAINT unit_conversions_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
ALTER TABLE public.unit_conversions ADD CONSTRAINT unit_conversions_to_unit_id_fkey FOREIGN KEY (to_unit_id) REFERENCES public.measurement_units(id) ON DELETE CASCADE;
ALTER TABLE public.unit_conversions ADD CONSTRAINT unit_conversions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.venue_bookings ADD CONSTRAINT venue_bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.venue_bookings ADD CONSTRAINT venue_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.venue_bookings ADD CONSTRAINT venue_bookings_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;
ALTER TABLE public.venues ADD CONSTRAINT venues_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Índices
CREATE INDEX demand_events_user_date_idx ON public.demand_events USING btree (user_id, event_date);
CREATE INDEX finance_accounts_user_idx ON public.finance_accounts USING btree (user_id);
CREATE INDEX finance_settlements_user_idx ON public.finance_settlements USING btree (user_id, channel, period_start);
CREATE INDEX idx_aggregator_integrations_brand_id ON public.aggregator_integrations USING btree (brand_id);
CREATE INDEX idx_aggregator_orders_brand_id ON public.aggregator_orders USING btree (brand_id);
CREATE INDEX idx_aggregator_orders_user_created ON public.aggregator_orders USING btree (user_id, created_at DESC);
CREATE INDEX idx_aggregator_orders_user_platform_status ON public.aggregator_orders USING btree (user_id, platform, order_status);
CREATE INDEX idx_audit_log_actor ON public.audit_log USING btree (actor_id, created_at DESC);
CREATE INDEX idx_audit_log_business ON public.audit_log USING btree (business_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_recent ON public.audit_log USING btree (created_at DESC);
CREATE INDEX idx_benefit_requests_benefit_id ON public.benefit_requests USING btree (benefit_id);
CREATE INDEX idx_benefit_requests_staff_member_id ON public.benefit_requests USING btree (staff_member_id);
CREATE INDEX idx_brand_assets_brand_id ON public.brand_assets USING btree (brand_id);
CREATE INDEX idx_brand_menus_brand_id ON public.brand_menus USING btree (brand_id);
CREATE INDEX idx_candidate_experience_candidate_id ON public.candidate_experience USING btree (candidate_id);
CREATE INDEX idx_chain_locations_chain_id ON public.chain_locations USING btree (chain_id);
CREATE INDEX idx_chain_master_menus_chain_id ON public.chain_master_menus USING btree (chain_id);
CREATE INDEX idx_compliance_checklists_chain_id ON public.compliance_checklists USING btree (chain_id);
CREATE INDEX idx_compliance_records_checklist_id ON public.compliance_records USING btree (checklist_id);
CREATE INDEX idx_compliance_records_location_id ON public.compliance_records USING btree (location_id);
CREATE INDEX idx_consultant_clients_client_user_id ON public.consultant_clients USING btree (client_user_id);
CREATE INDEX idx_consultant_clients_client_user_id_v2 ON public.consultant_clients USING btree (client_user_id);
CREATE INDEX idx_consultant_clients_consultant_id ON public.consultant_clients USING btree (consultant_id);
CREATE INDEX idx_consultant_clients_invitation_token ON public.consultant_clients USING btree (invitation_token) WHERE (invitation_token IS NOT NULL);
CREATE INDEX idx_consultant_profiles_user_id ON public.consultant_profiles USING btree (user_id);
CREATE INDEX idx_consultant_profiles_user_id_v2 ON public.consultant_profiles USING btree (user_id);
CREATE INDEX idx_consultant_reports_client_id ON public.consultant_reports USING btree (client_id);
CREATE INDEX idx_consultant_reports_consultant_id ON public.consultant_reports USING btree (consultant_id);
CREATE INDEX idx_consulting_invoices_client_id ON public.consulting_invoices USING btree (client_id);
CREATE INDEX idx_consulting_invoices_consultant_id ON public.consulting_invoices USING btree (consultant_id);
CREATE INDEX idx_copilot_messages_conversation_id ON public.copilot_messages USING btree (conversation_id);
CREATE INDEX idx_course_certificates_course_id ON public.course_certificates USING btree (course_id);
CREATE INDEX idx_course_certificates_track_id ON public.course_certificates USING btree (track_id);
CREATE INDEX idx_course_enrollments_certificate_id ON public.course_enrollments USING btree (certificate_id);
CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments USING btree (user_id);
CREATE INDEX idx_course_lessons_course_id ON public.course_lessons USING btree (course_id);
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews USING btree (course_id);
CREATE INDEX idx_custom_roles_business ON public.restaurant_custom_roles USING btree (business_id);
CREATE INDEX idx_customer_feedback_campaign_id ON public.customer_feedback USING btree (campaign_id);
CREATE INDEX idx_customer_feedback_order_id ON public.customer_feedback USING btree (order_id);
CREATE INDEX idx_daily_sales_user_id ON public.daily_sales USING btree (user_id);
CREATE INDEX idx_debug_events_user_created ON public.debug_events USING btree (user_id, created_at DESC);
CREATE INDEX idx_event_quotations_consultant_id ON public.event_quotations USING btree (consultant_id);
CREATE INDEX idx_event_quotations_restaurant_id ON public.event_quotations USING btree (restaurant_id);
CREATE INDEX idx_event_quotations_zone_id ON public.event_quotations USING btree (zone_id);
CREATE INDEX idx_events_category_id ON public.events USING btree (category_id);
CREATE INDEX idx_events_date ON public.events USING btree (event_date);
CREATE INDEX idx_events_organizer_id ON public.events USING btree (organizer_id);
CREATE INDEX idx_events_venue_id ON public.events USING btree (venue_id);
CREATE INDEX idx_imp_client ON public.consultant_impersonation_log USING btree (client_user_id, started_at DESC);
CREATE INDEX idx_imp_consultant ON public.consultant_impersonation_log USING btree (consultant_id, started_at DESC);
CREATE INDEX idx_inventory_count_items_count_id ON public.inventory_count_items USING btree (count_id);
CREATE INDEX idx_inventory_count_items_inventory_item_id ON public.inventory_count_items USING btree (inventory_item_id);
CREATE INDEX idx_inventory_counts_status ON public.inventory_counts USING btree (status);
CREATE INDEX idx_inventory_counts_storage_location_id ON public.inventory_counts USING btree (storage_location_id);
CREATE INDEX idx_inventory_deductions_inventory_item_id ON public.inventory_deductions USING btree (inventory_item_id);
CREATE INDEX idx_inventory_deductions_order_id ON public.inventory_deductions USING btree (order_id);
CREATE INDEX idx_inventory_deductions_recipe_id ON public.inventory_deductions USING btree (recipe_id);
CREATE INDEX idx_inventory_item_suppliers_supplier_id ON public.inventory_item_suppliers USING btree (supplier_id);
CREATE INDEX idx_inventory_items_barcode ON public.inventory_items USING btree (barcode);
CREATE INDEX idx_inventory_items_expiration ON public.inventory_items USING btree (expiration_date);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items USING btree (sku);
CREATE INDEX idx_inventory_items_storage ON public.inventory_items USING btree (storage_location_id);
CREATE INDEX idx_inventory_items_user_id ON public.inventory_items USING btree (user_id);
CREATE INDEX idx_inventory_movements_date ON public.inventory_movements USING btree (created_at);
CREATE INDEX idx_inventory_movements_from_location_id ON public.inventory_movements USING btree (from_location_id);
CREATE INDEX idx_inventory_movements_item ON public.inventory_movements USING btree (inventory_item_id);
CREATE INDEX idx_inventory_movements_to_location_id ON public.inventory_movements USING btree (to_location_id);
CREATE INDEX idx_inventory_movements_user_created ON public.inventory_movements USING btree (user_id, created_at DESC);
CREATE INDEX idx_inventory_price_history_inventory_item_id ON public.inventory_price_history USING btree (inventory_item_id);
CREATE INDEX idx_inventory_price_history_supplier_id ON public.inventory_price_history USING btree (supplier_id);
CREATE INDEX idx_inventory_transfers_chain_id ON public.inventory_transfers USING btree (chain_id);
CREATE INDEX idx_inventory_transfers_from_location_id ON public.inventory_transfers USING btree (from_location_id);
CREATE INDEX idx_inventory_transfers_to_location_id ON public.inventory_transfers USING btree (to_location_id);
CREATE INDEX idx_inventory_waste_inventory_item_id ON public.inventory_waste USING btree (inventory_item_id);
CREATE INDEX idx_inventory_waste_storage_location_id ON public.inventory_waste USING btree (storage_location_id);
CREATE INDEX idx_job_applications_applicant_id ON public.job_applications USING btree (applicant_id);
CREATE INDEX idx_job_applications_candidate_profile_id ON public.job_applications USING btree (candidate_profile_id);
CREATE INDEX idx_job_applications_job_id ON public.job_applications USING btree (job_id);
CREATE INDEX idx_job_saved_job_id ON public.job_saved USING btree (job_id);
CREATE INDEX idx_jobs_category ON public.jobs USING btree (category);
CREATE INDEX idx_jobs_employer_id ON public.jobs USING btree (employer_id);
CREATE INDEX idx_jobs_location ON public.jobs USING btree (location);
CREATE INDEX idx_kitchen_production_queue_brand_id ON public.kitchen_production_queue USING btree (brand_id);
CREATE INDEX idx_kitchen_production_queue_order_id ON public.kitchen_production_queue USING btree (order_id);
CREATE INDEX idx_knowledge_chunks_embedding ON public.knowledge_chunks USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');
CREATE INDEX idx_knowledge_chunks_source ON public.knowledge_chunks USING btree (source_id);
CREATE INDEX idx_knowledge_chunks_user ON public.knowledge_chunks USING btree (user_id);
CREATE INDEX idx_knowledge_sources_type ON public.knowledge_sources USING btree (source_type);
CREATE INDEX idx_knowledge_sources_user ON public.knowledge_sources USING btree (user_id);
CREATE INDEX idx_learning_track_courses_course_id ON public.learning_track_courses USING btree (course_id);
CREATE INDEX idx_lesson_progress_course_id ON public.lesson_progress USING btree (course_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress USING btree (lesson_id);
CREATE INDEX idx_loyalty_campaigns_active ON public.loyalty_campaigns USING btree (user_id, is_active, starts_at, ends_at);
CREATE INDEX idx_loyalty_customer_achievements_achievement_id ON public.loyalty_customer_achievements USING btree (achievement_id);
CREATE INDEX idx_loyalty_customers_churn_risk ON public.loyalty_customers USING btree (user_id, churn_risk_score DESC);
CREATE INDEX idx_loyalty_customers_email ON public.loyalty_customers USING btree (customer_email) WHERE (customer_email IS NOT NULL);
CREATE INDEX idx_loyalty_customers_last_order ON public.loyalty_customers USING btree (user_id, last_order_at DESC);
CREATE INDEX idx_loyalty_customers_phone ON public.loyalty_customers USING btree (customer_phone) WHERE (customer_phone IS NOT NULL);
CREATE INDEX idx_loyalty_customers_tier_id ON public.loyalty_customers USING btree (tier_id);
CREATE INDEX idx_loyalty_customers_user_id ON public.loyalty_customers USING btree (user_id);
CREATE INDEX idx_loyalty_points_transactions_customer ON public.loyalty_points_transactions USING btree (customer_id);
CREATE INDEX idx_loyalty_rewards_catalog_item_id ON public.loyalty_rewards USING btree (catalog_item_id);
CREATE INDEX idx_loyalty_rewards_catalog_min_tier_id ON public.loyalty_rewards_catalog USING btree (min_tier_id);
CREATE INDEX idx_loyalty_rewards_customer ON public.loyalty_rewards USING btree (customer_id);
CREATE INDEX idx_loyalty_rewards_status ON public.loyalty_rewards USING btree (status);
CREATE INDEX idx_maturity_action_tracking_diagnosis ON public.maturity_action_tracking USING btree (diagnosis_id);
CREATE INDEX idx_maturity_action_tracking_status ON public.maturity_action_tracking USING btree (status);
CREATE INDEX idx_maturity_action_tracking_user ON public.maturity_action_tracking USING btree (user_id);
CREATE INDEX idx_maturity_diagnoses_user_id ON public.maturity_diagnoses USING btree (user_id);
CREATE INDEX idx_measurement_units_base_unit_id ON public.measurement_units USING btree (base_unit_id);
CREATE INDEX idx_menu_categories_menu_id ON public.menu_categories USING btree (menu_id);
CREATE INDEX idx_menu_item_modifier_links_modifier_id ON public.menu_item_modifier_links USING btree (modifier_id);
CREATE INDEX idx_menu_item_modifiers_menu_id ON public.menu_item_modifiers USING btree (menu_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items USING btree (category_id);
CREATE INDEX idx_menu_items_menu_id ON public.menu_items USING btree (menu_id);
CREATE INDEX idx_menu_items_menu_id_sort ON public.menu_items USING btree (menu_id, sort_order);
CREATE INDEX idx_menu_items_recipe_id ON public.menu_items USING btree (recipe_id);
CREATE INDEX idx_menu_modifier_options_modifier_id ON public.menu_modifier_options USING btree (modifier_id);
CREATE INDEX idx_notifications_log_created_at ON public.notifications_log USING btree (created_at DESC);
CREATE INDEX idx_notifications_log_user_id ON public.notifications_log USING btree (user_id);
CREATE INDEX idx_opening_analysis_runs_project ON public.opening_analysis_runs USING btree (project_id);
CREATE INDEX idx_opening_analysis_runs_status ON public.opening_analysis_runs USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]));
CREATE INDEX idx_opening_checklist_items_project_id ON public.opening_checklist_items USING btree (project_id);
CREATE INDEX idx_order_status_history_order_created ON public.order_status_history USING btree (order_id, created_at DESC);
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history USING btree (order_id);
CREATE INDEX idx_pos_activity_session ON public.pos_user_activity USING btree (session_id, recorded_at DESC);
CREATE INDEX idx_pos_activity_user_time ON public.pos_user_activity USING btree (user_id, recorded_at DESC);
CREATE INDEX idx_pos_audit_action ON public.pos_audit_log USING btree (action);
CREATE INDEX idx_pos_audit_entity ON public.pos_audit_log USING btree (entity, entity_id);
CREATE INDEX idx_pos_audit_user_created ON public.pos_audit_log USING btree (user_id, created_at DESC);
CREATE INDEX idx_pos_cash_movements_session_id ON public.pos_cash_movements USING btree (session_id);
CREATE INDEX idx_pos_closures_session ON public.pos_session_closures USING btree (session_id);
CREATE INDEX idx_pos_closures_user ON public.pos_session_closures USING btree (user_id, closed_at DESC);
CREATE INDEX idx_pos_fraud_actor ON public.pos_fraud_signals USING btree (actor_staff_id);
CREATE INDEX idx_pos_fraud_user_status ON public.pos_fraud_signals USING btree (user_id, status, detected_at DESC);
CREATE INDEX idx_pos_sessions_status ON public.pos_sessions USING btree (status);
CREATE INDEX idx_pos_sessions_user_id ON public.pos_sessions USING btree (user_id);
CREATE INDEX idx_pos_sup_auth_user ON public.pos_supervisor_authorizations USING btree (user_id, created_at DESC);
CREATE INDEX idx_pos_transactions_order_created ON public.pos_transactions USING btree (order_id, created_at DESC);
CREATE INDEX idx_pos_transactions_order_id ON public.pos_transactions USING btree (order_id);
CREATE INDEX idx_pos_transactions_payment_method_id ON public.pos_transactions USING btree (payment_method_id);
CREATE INDEX idx_pos_transactions_session_created ON public.pos_transactions USING btree (session_id, created_at DESC);
CREATE INDEX idx_pos_transactions_session_id ON public.pos_transactions USING btree (session_id);
CREATE INDEX idx_pre_opening_tasks_project_id ON public.pre_opening_tasks USING btree (project_id);
CREATE INDEX idx_provider_portfolio_provider_id ON public.provider_portfolio USING btree (provider_id);
CREATE INDEX idx_provider_reviews_provider_id ON public.provider_reviews USING btree (provider_id);
CREATE INDEX idx_provider_reviews_request_id ON public.provider_reviews USING btree (request_id);
CREATE INDEX idx_purchase_order_items_inventory_item_id ON public.purchase_order_items USING btree (inventory_item_id);
CREATE INDEX idx_purchase_order_items_purchase_order_id ON public.purchase_order_items USING btree (purchase_order_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders USING btree (supplier_id);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);
CREATE INDEX idx_pwe_user ON public.payment_webhook_events USING btree (user_id, created_at DESC);
CREATE INDEX idx_quotation_gallery_quotation_id ON public.quotation_gallery USING btree (quotation_id);
CREATE INDEX idx_quotation_menu_items_menu_item_id ON public.quotation_menu_items USING btree (menu_item_id);
CREATE INDEX idx_quotation_menu_items_quotation_id ON public.quotation_menu_items USING btree (quotation_id);
CREATE INDEX idx_quotation_services_quotation_id ON public.quotation_services USING btree (quotation_id);
CREATE INDEX idx_quotation_services_service_provider_id ON public.quotation_services USING btree (service_provider_id);
CREATE INDEX idx_rappi_menu_sync_menu_item_id ON public.rappi_menu_sync USING btree (menu_item_id);
CREATE INDEX idx_rappi_webhook_events_integration_id ON public.rappi_webhook_events USING btree (integration_id);
CREATE INDEX idx_recipe_ingredients_inventory_item_id ON public.recipe_ingredients USING btree (inventory_item_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients USING btree (recipe_id);
CREATE INDEX idx_recipe_ingredients_unit_id ON public.recipe_ingredients USING btree (unit_id);
CREATE INDEX idx_recipe_steps_recipe_id ON public.recipe_steps USING btree (recipe_id);
CREATE INDEX idx_recipe_sub_recipes_child ON public.recipe_sub_recipes USING btree (sub_recipe_id);
CREATE INDEX idx_recipe_sub_recipes_parent ON public.recipe_sub_recipes USING btree (parent_recipe_id);
CREATE INDEX idx_recipe_versions_recipe_id ON public.recipe_versions USING btree (recipe_id);
CREATE INDEX idx_recipes_is_sub_recipe ON public.recipes USING btree (is_sub_recipe) WHERE (is_sub_recipe = true);
CREATE INDEX idx_recipes_menu_item_id ON public.recipes USING btree (menu_item_id);
CREATE INDEX idx_restaurant_brands_user_id ON public.restaurant_brands USING btree (user_id);
CREATE INDEX idx_restaurant_menus_brand_id ON public.restaurant_menus USING btree (brand_id);
CREATE INDEX idx_restaurant_menus_slug ON public.restaurant_menus USING btree (public_url_slug);
CREATE INDEX idx_restaurant_menus_template_id ON public.restaurant_menus USING btree (template_id);
CREATE INDEX idx_restaurant_menus_user_id ON public.restaurant_menus USING btree (user_id);
CREATE INDEX idx_restaurant_orders_discount_id ON public.restaurant_orders USING btree (discount_id);
CREATE INDEX idx_restaurant_orders_merged_into ON public.restaurant_orders USING btree (merged_into_order_id);
CREATE INDEX idx_restaurant_orders_session_id ON public.restaurant_orders USING btree (session_id);
CREATE INDEX idx_restaurant_orders_split_from_order_id ON public.restaurant_orders USING btree (split_from_order_id);
CREATE INDEX idx_restaurant_orders_table_id ON public.restaurant_orders USING btree (table_id);
CREATE INDEX idx_restaurant_orders_user_channel ON public.restaurant_orders USING btree (user_id, sales_channel, created_at DESC);
CREATE INDEX idx_restaurant_orders_user_created ON public.restaurant_orders USING btree (user_id, created_at DESC);
CREATE INDEX idx_restaurant_tables_status ON public.restaurant_tables USING btree (status);
CREATE INDEX idx_restaurant_tables_user_id ON public.restaurant_tables USING btree (user_id);
CREATE INDEX idx_restaurant_tables_zone_id ON public.restaurant_tables USING btree (zone_id);
CREATE INDEX idx_restaurant_team_members_staff_member_id ON public.restaurant_team_members USING btree (staff_member_id);
CREATE INDEX idx_restaurant_team_members_user_status ON public.restaurant_team_members USING btree (user_id, status);
CREATE INDEX idx_restaurant_websites_template_id ON public.restaurant_websites USING btree (template_id);
CREATE INDEX idx_restaurant_websites_user_id ON public.restaurant_websites USING btree (user_id);
CREATE INDEX idx_restaurant_zones_consultant_id ON public.restaurant_zones USING btree (consultant_id);
CREATE INDEX idx_restaurant_zones_restaurant_id ON public.restaurant_zones USING btree (restaurant_id);
CREATE INDEX idx_reviews_course_id ON public.reviews USING btree (course_id);
CREATE INDEX idx_reviews_provider_id ON public.reviews USING btree (provider_id);
CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);
CREATE INDEX idx_reviews_venue_id ON public.reviews USING btree (venue_id);
CREATE INDEX idx_service_bookings_event_id ON public.service_bookings USING btree (event_id);
CREATE INDEX idx_service_bookings_proposal_id ON public.service_bookings USING btree (proposal_id);
CREATE INDEX idx_service_bookings_provider_id ON public.service_bookings USING btree (provider_id);
CREATE INDEX idx_service_bookings_request_id ON public.service_bookings USING btree (request_id);
CREATE INDEX idx_service_bookings_review_id ON public.service_bookings USING btree (review_id);
CREATE INDEX idx_service_bookings_user_id ON public.service_bookings USING btree (user_id);
CREATE INDEX idx_service_proposals_provider_id ON public.service_proposals USING btree (provider_id);
CREATE INDEX idx_service_proposals_request_id ON public.service_proposals USING btree (request_id);
CREATE INDEX idx_service_providers_category ON public.service_providers USING btree (category);
CREATE INDEX idx_service_providers_city ON public.service_providers USING btree (city);
CREATE INDEX idx_service_providers_owner_id ON public.service_providers USING btree (owner_id);
CREATE INDEX idx_shift_swap_requests_requesting_staff_id ON public.shift_swap_requests USING btree (requesting_staff_id);
CREATE INDEX idx_shift_swap_requests_shift ON public.shift_swap_requests USING btree (original_shift_id);
CREATE INDEX idx_shift_swap_requests_target_shift_id ON public.shift_swap_requests USING btree (target_shift_id);
CREATE INDEX idx_shift_swap_requests_target_staff_id ON public.shift_swap_requests USING btree (target_staff_id);
CREATE INDEX idx_staff_availability_day ON public.staff_availability USING btree (day_of_week);
CREATE INDEX idx_staff_availability_staff ON public.staff_availability USING btree (staff_member_id);
CREATE INDEX idx_staff_benefit_assignments_benefit_id ON public.staff_benefit_assignments USING btree (benefit_id);
CREATE INDEX idx_staff_certifications_expiry ON public.staff_certifications USING btree (expiration_date);
CREATE INDEX idx_staff_certifications_staff ON public.staff_certifications USING btree (staff_member_id);
CREATE INDEX idx_staff_members_linked_user_id ON public.staff_members USING btree (linked_user_id);
CREATE INDEX idx_staff_members_user_id ON public.staff_members USING btree (user_id);
CREATE INDEX idx_staff_shifts_staff_member ON public.staff_shifts USING btree (staff_member_id);
CREATE INDEX idx_staff_shifts_template_id ON public.staff_shifts USING btree (template_id);
CREATE INDEX idx_staff_shifts_user_date ON public.staff_shifts USING btree (user_id, shift_date);
CREATE INDEX idx_staff_training_progress_training_program_id ON public.staff_training_progress USING btree (training_program_id);
CREATE INDEX idx_supplier_analysis_item_id ON public.supplier_analysis USING btree (inventory_item_id);
CREATE INDEX idx_supplier_analysis_user_id ON public.supplier_analysis USING btree (user_id);
CREATE INDEX idx_supplier_invoices_supplier ON public.supplier_invoices USING btree (supplier_id);
CREATE INDEX idx_supplier_invoices_user ON public.supplier_invoices USING btree (user_id, created_at DESC);
CREATE INDEX idx_suppliers_category ON public.suppliers USING btree (category);
CREATE INDEX idx_suppliers_user_id ON public.suppliers USING btree (user_id);
CREATE INDEX idx_support_tickets_order_id ON public.support_tickets USING btree (order_id);
CREATE INDEX idx_table_reservations_date_time ON public.table_reservations USING btree (user_id, reservation_date, reservation_time);
CREATE INDEX idx_table_reservations_loyalty_customer_id ON public.table_reservations USING btree (loyalty_customer_id);
CREATE INDEX idx_table_reservations_table_id ON public.table_reservations USING btree (table_id);
CREATE INDEX idx_table_reservations_user_id ON public.table_reservations USING btree (user_id);
CREATE INDEX idx_team_members_business ON public.restaurant_team_members USING btree (business_id);
CREATE INDEX idx_team_members_custom_role ON public.restaurant_team_members USING btree (custom_role_id);
CREATE INDEX idx_team_members_status ON public.restaurant_team_members USING btree (status);
CREATE INDEX idx_team_members_token ON public.restaurant_team_members USING btree (invitation_token) WHERE (user_id IS NULL);
CREATE INDEX idx_team_members_user ON public.restaurant_team_members USING btree (user_id);
CREATE INDEX idx_team_perm_hist_business ON public.team_permissions_history USING btree (business_id, created_at DESC);
CREATE INDEX idx_team_perm_hist_member ON public.team_permissions_history USING btree (team_member_id, created_at DESC);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages USING btree (ticket_id);
CREATE INDEX idx_time_off_requests_dates ON public.time_off_requests USING btree (start_date, end_date);
CREATE INDEX idx_time_off_requests_staff ON public.time_off_requests USING btree (staff_member_id);
CREATE INDEX idx_time_off_requests_status ON public.time_off_requests USING btree (status);
CREATE INDEX idx_training_courses_category ON public.training_courses USING btree (category);
CREATE INDEX idx_training_courses_instructor_id ON public.training_courses USING btree (instructor_id);
CREATE INDEX idx_venue_bookings_event_id ON public.venue_bookings USING btree (event_id);
CREATE INDEX idx_venue_bookings_user_id ON public.venue_bookings USING btree (user_id);
CREATE INDEX idx_venue_bookings_venue_id ON public.venue_bookings USING btree (venue_id);
CREATE INDEX idx_venues_city ON public.venues USING btree (city);
CREATE INDEX idx_venues_owner_id ON public.venues USING btree (owner_id);
CREATE INDEX idx_venues_type ON public.venues USING btree (venue_type);
CREATE INDEX marketing_content_user_date_idx ON public.marketing_content USING btree (user_id, moment_date);
CREATE INDEX pos_pin_attempts_owner_idx ON public.pos_pin_attempts USING btree (restaurant_user_id, kind, created_at DESC);
CREATE INDEX rappi_store_status_store_idx ON public.rappi_store_status USING btree (integration_id, store_id, changed_at DESC);
CREATE INDEX recipe_menu_items_menu_item_idx ON public.recipe_menu_items USING btree (menu_item_id);
CREATE INDEX recipe_menu_items_recipe_idx ON public.recipe_menu_items USING btree (recipe_id);
CREATE INDEX restaurant_expenses_user_date_idx ON public.restaurant_expenses USING btree (user_id, expense_date);
CREATE INDEX restaurant_expenses_user_status_idx ON public.restaurant_expenses USING btree (user_id, status, due_date);
CREATE INDEX tip_allocations_period_idx ON public.tip_allocations USING btree (period_id);
CREATE INDEX unit_conversions_lookup_idx ON public.unit_conversions USING btree (from_unit_id, to_unit_id);
CREATE UNIQUE INDEX aggregator_orders_platform_external_uniq ON public.aggregator_orders USING btree (platform, external_order_id) WHERE (external_order_id IS NOT NULL);
CREATE UNIQUE INDEX candidate_profiles_user_id_idx ON public.candidate_profiles USING btree (user_id);
CREATE UNIQUE INDEX recipe_menu_items_one_primary_per_item ON public.recipe_menu_items USING btree (menu_item_id) WHERE (is_primary = true);
CREATE UNIQUE INDEX restaurant_expenses_one_occurrence_per_month ON public.restaurant_expenses USING btree (recurrence_parent, date_trunc('month'::text, (expense_date)::timestamp without time zone)) WHERE (recurrence_parent IS NOT NULL);
CREATE UNIQUE INDEX unit_conversions_unique_generic ON public.unit_conversions USING btree (from_unit_id, to_unit_id) WHERE (ingredient_id IS NULL);
CREATE UNIQUE INDEX unit_conversions_unique_specific ON public.unit_conversions USING btree (from_unit_id, to_unit_id, ingredient_id) WHERE (ingredient_id IS NOT NULL);

-- Vistas
CREATE VIEW public.menu_items_with_costs WITH (security_invoker=true) AS
 SELECT mi.id,
    mi.menu_id,
    mi.name,
    mi.description,
    mi.category,
    mi.price,
    mi.image_url,
    mi.is_available,
    mi.is_featured,
    mi.allergens,
    mi.dietary_tags,
    mi.popularity_score,
    mi.profitability_score,
    mi.bcg_category,
    r.id AS recipe_id,
    r.name AS recipe_name,
    COALESCE(r.cost_per_portion, 0::numeric) AS recipe_cost,
        CASE
            WHEN mi.price > 0::numeric THEN (mi.price - COALESCE(r.cost_per_portion, 0::numeric)) / mi.price * 100::numeric
            ELSE 0::numeric
        END AS margin_percent
   FROM public.menu_items mi
     LEFT JOIN public.recipes r ON r.menu_item_id = mi.id;

CREATE VIEW public.inventory_expiring_soon WITH (security_invoker=true) AS
 SELECT i.id,
    i.user_id,
    i.item_name,
    i.current_stock,
    i.unit,
    i.expiration_date,
    i.lot_number,
    sl.location_name AS storage_location,
        CASE
            WHEN i.expiration_date <= CURRENT_DATE THEN 'expired'::text
            WHEN i.expiration_date <= (CURRENT_DATE + '3 days'::interval) THEN 'critical'::text
            WHEN i.expiration_date <= (CURRENT_DATE + '7 days'::interval) THEN 'warning'::text
            ELSE 'ok'::text
        END AS expiration_status,
    i.expiration_date - CURRENT_DATE AS days_until_expiry
   FROM public.inventory_items i
     LEFT JOIN public.storage_locations sl ON sl.id = i.storage_location_id
  WHERE i.expiration_date IS NOT NULL AND i.current_stock > 0::numeric
  ORDER BY i.expiration_date;

CREATE VIEW public.inventory_below_par WITH (security_invoker=true) AS
 SELECT i.id,
    i.user_id,
    i.item_name,
    i.current_stock,
    i.par_level,
    i.reorder_point,
    i.unit,
    i.unit_cost,
    i.par_level - i.current_stock AS quantity_to_order,
    (i.par_level - i.current_stock) * COALESCE(i.unit_cost, 0::numeric) AS estimated_order_cost,
    s.supplier_name AS preferred_supplier,
    i.lead_time_days
   FROM public.inventory_items i
     LEFT JOIN public.inventory_suppliers s ON s.id = i.preferred_supplier_id
  WHERE i.current_stock < i.par_level AND i.par_level > 0::numeric
  ORDER BY (i.par_level - i.current_stock) DESC;

CREATE VIEW public.unified_orders_view WITH (security_invoker=true) AS
 SELECT ro.id,
    ro.user_id,
    NULL::uuid AS brand_id,
    'inhouse'::text AS channel,
    COALESCE(ro.source, 'pos'::text) AS source,
    ro.order_type,
    ro.status,
    ro.payment_status,
    ro.customer_name,
    ro.customer_phone,
    ro.customer_email,
    ro.items,
    ro.subtotal,
    ro.discount_amount AS discount,
    ro.tax_amount AS tax,
    ro.delivery_fee,
    ro.tip_amount,
    0::numeric AS commission,
    ro.total AS gross_total,
    ro.total AS net_total,
    ro.created_at,
    ro.completed_at,
    ro.updated_at,
    NULL::text AS external_order_id,
    ro.table_id,
    ro.session_id,
    ro.waiter_id
   FROM public.restaurant_orders ro
UNION ALL
 SELECT ao.id,
    ao.user_id,
    ao.brand_id,
    'aggregator'::text AS channel,
    ao.platform::text AS source,
    'delivery'::text AS order_type,
    ao.order_status AS status,
    NULL::text AS payment_status,
    ao.customer_name,
    ao.customer_phone,
    NULL::text AS customer_email,
    ao.items,
    ao.subtotal,
    0::numeric AS discount,
    0::numeric AS tax,
    0::numeric AS delivery_fee,
    0::numeric AS tip_amount,
    ao.commission,
    ao.subtotal AS gross_total,
    ao.net_total,
    ao.created_at,
    ao.completed_at,
    ao.updated_at,
    ao.external_order_id,
    NULL::uuid AS table_id,
    NULL::uuid AS session_id,
    NULL::uuid AS waiter_id
   FROM public.aggregator_orders ao;

CREATE VIEW public.inventory_stock_by_location WITH (security_invoker=on) AS
 WITH inflow AS (
         SELECT inventory_movements.inventory_item_id,
            inventory_movements.to_location_id AS location_id,
            inventory_movements.user_id,
            sum(inventory_movements.quantity_change) AS qty
           FROM public.inventory_movements
          WHERE inventory_movements.to_location_id IS NOT NULL
          GROUP BY inventory_movements.inventory_item_id, inventory_movements.to_location_id, inventory_movements.user_id
        ), outflow AS (
         SELECT inventory_movements.inventory_item_id,
            inventory_movements.from_location_id AS location_id,
            inventory_movements.user_id,
            sum(inventory_movements.quantity_change) AS qty
           FROM public.inventory_movements
          WHERE inventory_movements.from_location_id IS NOT NULL
          GROUP BY inventory_movements.inventory_item_id, inventory_movements.from_location_id, inventory_movements.user_id
        ), combined AS (
         SELECT inflow.inventory_item_id,
            inflow.location_id,
            inflow.user_id,
            inflow.qty
           FROM inflow
        UNION ALL
         SELECT outflow.inventory_item_id,
            outflow.location_id,
            outflow.user_id,
            - outflow.qty
           FROM outflow
        )
 SELECT c.user_id,
    c.inventory_item_id,
    c.location_id,
    COALESCE(sum(c.qty), 0::numeric) AS stock_on_hand,
    l.location_name,
    i.item_name,
    i.unit
   FROM combined c
     LEFT JOIN public.storage_locations l ON l.id = c.location_id
     LEFT JOIN public.inventory_items i ON i.id = c.inventory_item_id
  GROUP BY c.user_id, c.inventory_item_id, c.location_id, l.location_name, i.item_name, i.unit;

CREATE VIEW public.menu_item_cooccurrence WITH (security_invoker=true) AS
 WITH order_items AS (
         SELECT ro.user_id,
            ro.id AS order_id,
            (item.value ->> 'menu_item_id'::text)::uuid AS menu_item_id,
            item.value ->> 'name'::text AS name
           FROM public.restaurant_orders ro,
            LATERAL jsonb_array_elements(ro.items) item(value)
          WHERE ro.created_at >= (now() - '60 days'::interval) AND (ro.status <> ALL (ARRAY['cancelled'::text, 'pending'::text])) AND (item.value ->> 'menu_item_id'::text) IS NOT NULL
        )
 SELECT a.user_id,
    a.menu_item_id AS item_a,
    b.menu_item_id AS item_b,
    a.name AS name_a,
    b.name AS name_b,
    count(*)::integer AS pair_count
   FROM order_items a
     JOIN order_items b ON a.order_id = b.order_id AND a.user_id = b.user_id AND a.menu_item_id < b.menu_item_id
  GROUP BY a.user_id, a.menu_item_id, b.menu_item_id, a.name, b.name
 HAVING count(*) >= 2;

-- Funciones (2 de 2)
CREATE OR REPLACE FUNCTION public.pos_close_session(p_session_id uuid, p_actual_cash numeric, p_notes text DEFAULT NULL::text)
 RETURNS public.pos_sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_session public.pos_sessions;
  v_cash_sales numeric := 0;
  v_cash_refunds numeric := 0;
  v_cash_in numeric := 0;
  v_cash_out numeric := 0;
  v_mov_in numeric := 0;
  v_mov_out numeric := 0;
  v_total_sales numeric := 0;
  v_sales_count integer := 0;
  v_total_tips numeric := 0;
  v_expected numeric;
BEGIN
  SELECT * INTO v_session FROM public.pos_sessions
   WHERE id = p_session_id AND user_id = v_uid AND status = 'open'
   FOR UPDATE;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Sesión no encontrada, ajena o ya cerrada';
  END IF;

  SELECT
    COALESCE(SUM(amount) FILTER (WHERE transaction_type='sale'   AND lower(COALESCE(payment_method_name,'')) IN ('efectivo','cash')),0),
    COALESCE(SUM(amount) FILTER (WHERE transaction_type='refund' AND lower(COALESCE(payment_method_name,'')) IN ('efectivo','cash')),0),
    COALESCE(SUM(amount) FILTER (WHERE transaction_type='cash_in'),0),
    COALESCE(SUM(amount) FILTER (WHERE transaction_type='cash_out'),0),
    COALESCE(SUM(amount) FILTER (WHERE transaction_type='sale'),0),
    COALESCE(COUNT(*)    FILTER (WHERE transaction_type='sale'),0),
    COALESCE(SUM(tip_amount) FILTER (WHERE transaction_type='sale'),0)
  INTO v_cash_sales, v_cash_refunds, v_cash_in, v_cash_out, v_total_sales, v_sales_count, v_total_tips
  FROM public.pos_transactions
  WHERE session_id = p_session_id AND COALESCE(status,'') <> 'voided';

  SELECT
    COALESCE(SUM(amount) FILTER (WHERE movement_type='deposit'),0),
    COALESCE(SUM(amount) FILTER (WHERE movement_type='withdrawal'),0)
  INTO v_mov_in, v_mov_out
  FROM public.pos_cash_movements
  WHERE session_id = p_session_id;

  v_expected := COALESCE(v_session.opening_cash,0)
              + v_cash_sales - v_cash_refunds
              + v_cash_in - v_cash_out
              + v_mov_in - v_mov_out;

  UPDATE public.pos_sessions
  SET status='closed', closed_at=now(),
      closing_cash=p_actual_cash, actual_cash=p_actual_cash,
      expected_cash=v_expected, difference=p_actual_cash - v_expected,
      total_sales=v_total_sales, sales_count=v_sales_count, total_tips=v_total_tips,
      notes=COALESCE(p_notes, notes), updated_at=now()
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$function$
;

-- Triggers
CREATE TRIGGER ensure_user_id_aggregator_integrations BEFORE INSERT OR UPDATE ON public.aggregator_integrations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.aggregator_integrations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_aggregator_integrations_updated_at BEFORE UPDATE ON public.aggregator_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_aggregator_orders BEFORE INSERT OR UPDATE ON public.aggregator_orders FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_aggregator_orders_updated_at BEFORE UPDATE ON public.aggregator_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_applicant_profiles BEFORE INSERT OR UPDATE ON public.applicant_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.applicant_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_applicant_profiles_updated_at BEFORE UPDATE ON public.applicant_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_benefit_requests BEFORE INSERT OR UPDATE ON public.benefit_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.benefit_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_brand_menus_updated_at BEFORE UPDATE ON public.brand_menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_business_opening_projects BEFORE INSERT OR UPDATE ON public.business_opening_projects FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.business_opening_projects FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_business_opening_projects_updated_at BEFORE UPDATE ON public.business_opening_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER calculate_candidate_completeness BEFORE INSERT OR UPDATE ON public.candidate_profiles FOR EACH ROW EXECUTE FUNCTION public.calculate_profile_completeness();
CREATE TRIGGER ensure_user_id_candidate_profiles BEFORE INSERT OR UPDATE ON public.candidate_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.candidate_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON public.candidate_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_carbon_footprint_items BEFORE INSERT OR UPDATE ON public.carbon_footprint_items FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.carbon_footprint_items FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_carbon_footprint_items_updated_at BEFORE UPDATE ON public.carbon_footprint_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chain_locations_updated_at BEFORE UPDATE ON public.chain_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chain_master_menus_updated_at BEFORE UPDATE ON public.chain_master_menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_compliance_checklists_updated_at BEFORE UPDATE ON public.compliance_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultant_clients_updated_at BEFORE UPDATE ON public.consultant_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_consultant_profiles BEFORE INSERT OR UPDATE ON public.consultant_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.consultant_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_consultant_profiles_updated_at BEFORE UPDATE ON public.consultant_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_copilot_alerts BEFORE INSERT OR UPDATE ON public.copilot_alerts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.copilot_alerts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_copilot_conversations BEFORE INSERT OR UPDATE ON public.copilot_conversations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.copilot_conversations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_course_certificates BEFORE INSERT OR UPDATE ON public.course_certificates FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_course_enrollments BEFORE INSERT OR UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_course_lesson_stats AFTER INSERT OR DELETE OR UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.update_course_lesson_stats();
CREATE TRIGGER ensure_user_id_course_reviews BEFORE INSERT OR UPDATE ON public.course_reviews FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.course_reviews FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_update_course_avg_rating AFTER INSERT OR DELETE OR UPDATE ON public.course_reviews FOR EACH ROW EXECUTE FUNCTION public.update_course_avg_rating();
CREATE TRIGGER ensure_user_id_customer_feedback BEFORE INSERT OR UPDATE ON public.customer_feedback FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.customer_feedback FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_daily_briefings BEFORE INSERT OR UPDATE ON public.daily_briefings FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.daily_briefings FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_daily_sales BEFORE INSERT OR UPDATE ON public.daily_sales FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.daily_sales FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_daily_sales_updated_at BEFORE UPDATE ON public.daily_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_debug_events BEFORE INSERT OR UPDATE ON public.debug_events FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.debug_events FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_delivery_zones BEFORE INSERT OR UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.demand_events FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER set_quotation_slug BEFORE INSERT ON public.event_quotations FOR EACH ROW EXECUTE FUNCTION public.generate_quotation_slug();
CREATE TRIGGER update_event_quotations_updated_at BEFORE UPDATE ON public.event_quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_feedback_campaigns BEFORE INSERT OR UPDATE ON public.feedback_campaigns FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.feedback_campaigns FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.finance_accounts FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.finance_settings FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.finance_settlements FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_food_waste_logs BEFORE INSERT OR UPDATE ON public.food_waste_logs FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.food_waste_logs FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.inventory_counts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_inventory_counts BEFORE INSERT OR UPDATE ON public.inventory_counts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.inventory_deductions FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_inventory_deductions BEFORE INSERT OR UPDATE ON public.inventory_deductions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_inventory_items BEFORE INSERT OR UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trigger_record_inventory_movement AFTER UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.record_inventory_movement();
CREATE TRIGGER trigger_record_price_change AFTER UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.record_price_change();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_inventory_movements BEFORE INSERT OR UPDATE ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.inventory_suppliers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_inventory_suppliers BEFORE INSERT OR UPDATE ON public.inventory_suppliers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.inventory_waste FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.inventory_waste FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_inventory_waste BEFORE INSERT OR UPDATE ON public.inventory_waste FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER increment_job_apps_on_insert AFTER INSERT ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.increment_job_applications();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.job_saved FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_job_saved BEFORE INSERT OR UPDATE ON public.job_saved FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.kitchen_production_queue FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_kitchen_production_queue BEFORE INSERT OR UPDATE ON public.kitchen_production_queue FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_knowledge_chunks BEFORE INSERT OR UPDATE ON public.knowledge_chunks FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_knowledge_sources BEFORE INSERT OR UPDATE ON public.knowledge_sources FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_knowledge_sources_updated BEFORE UPDATE ON public.knowledge_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_update_track_course_count AFTER INSERT OR DELETE OR UPDATE ON public.learning_track_courses FOR EACH ROW EXECUTE FUNCTION public.update_track_course_count();
CREATE TRIGGER ensure_user_id_lesson_progress BEFORE INSERT OR UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_check_course_completion AFTER INSERT OR UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.check_course_completion_certificate();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.loyalty_achievements FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_loyalty_achievements BEFORE INSERT OR UPDATE ON public.loyalty_achievements FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.loyalty_campaigns FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_loyalty_campaigns BEFORE INSERT OR UPDATE ON public.loyalty_campaigns FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_loyalty_campaigns_updated_at BEFORE UPDATE ON public.loyalty_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.loyalty_customers FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.loyalty_customers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_loyalty_customers BEFORE INSERT OR UPDATE ON public.loyalty_customers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER sync_loyalty_customer_restaurant_name BEFORE INSERT OR UPDATE OF user_id ON public.loyalty_customers FOR EACH ROW EXECUTE FUNCTION public.sync_restaurant_name_to_loyalty_customer();
CREATE TRIGGER trigger_generate_loyalty_code BEFORE INSERT ON public.loyalty_customers FOR EACH ROW EXECUTE FUNCTION public.generate_loyalty_code();
CREATE TRIGGER update_loyalty_customers_updated_at BEFORE UPDATE ON public.loyalty_customers FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.loyalty_points_transactions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_loyalty_points_transactions BEFORE INSERT OR UPDATE ON public.loyalty_points_transactions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trigger_update_customer_tier AFTER INSERT ON public.loyalty_points_transactions FOR EACH ROW EXECUTE FUNCTION public.update_customer_tier();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.loyalty_rewards FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_loyalty_rewards BEFORE INSERT OR UPDATE ON public.loyalty_rewards FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.loyalty_rewards_catalog FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_loyalty_rewards_catalog BEFORE INSERT OR UPDATE ON public.loyalty_rewards_catalog FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_loyalty_rewards_catalog_updated_at BEFORE UPDATE ON public.loyalty_rewards_catalog FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.loyalty_tiers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_loyalty_tiers BEFORE INSERT OR UPDATE ON public.loyalty_tiers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_loyalty_tiers_updated_at BEFORE UPDATE ON public.loyalty_tiers FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.marketing_content FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.maturity_action_tracking FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_maturity_action_tracking BEFORE INSERT OR UPDATE ON public.maturity_action_tracking FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_maturity_action_tracking_updated_at BEFORE UPDATE ON public.maturity_action_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.maturity_diagnoses FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_maturity_diagnoses BEFORE INSERT OR UPDATE ON public.maturity_diagnoses FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_maturity_diagnoses_updated_at BEFORE UPDATE ON public.maturity_diagnoses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sync_menu_item_to_recipe AFTER UPDATE OF recipe_id ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.sync_menu_item_to_recipe();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_notification_preferences BEFORE INSERT OR UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_notifications_log BEFORE INSERT OR UPDATE ON public.notifications_log FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.opening_analysis_runs FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_opening_analysis_runs BEFORE INSERT OR UPDATE ON public.opening_analysis_runs FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_opening_analysis_runs_updated_at BEFORE UPDATE ON public.opening_analysis_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.payment_gateway_credentials FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_payment_gateway_credentials BEFORE INSERT OR UPDATE ON public.payment_gateway_credentials FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_payment_gateway_credentials_updated_at BEFORE UPDATE ON public.payment_gateway_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_payment_webhook_events BEFORE INSERT OR UPDATE ON public.payment_webhook_events FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_pos_audit_no_delete BEFORE DELETE ON public.pos_audit_log FOR EACH ROW EXECUTE FUNCTION public.pos_audit_immutable();
CREATE TRIGGER trg_pos_audit_no_update BEFORE UPDATE ON public.pos_audit_log FOR EACH ROW EXECUTE FUNCTION public.pos_audit_immutable();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.pos_discounts FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.pos_discounts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_pos_discounts BEFORE INSERT OR UPDATE ON public.pos_discounts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_pos_discounts_updated_at BEFORE UPDATE ON public.pos_discounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.pos_payment_methods FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.pos_payment_methods FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_pos_payment_methods BEFORE INSERT OR UPDATE ON public.pos_payment_methods FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_pos_payment_methods_updated_at BEFORE UPDATE ON public.pos_payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.pos_sessions FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.pos_sessions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_pos_sessions BEFORE INSERT OR UPDATE ON public.pos_sessions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_pos_audit_session AFTER INSERT OR UPDATE ON public.pos_sessions FOR EACH ROW EXECUTE FUNCTION public.pos_audit_session();
CREATE TRIGGER update_pos_sessions_updated_at BEFORE UPDATE ON public.pos_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pos_audit_transaction AFTER INSERT OR UPDATE ON public.pos_transactions FOR EACH ROW EXECUTE FUNCTION public.pos_audit_transaction();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.pre_opening_tasks FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_pre_opening_tasks BEFORE INSERT OR UPDATE ON public.pre_opening_tasks FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_pre_opening_tasks_updated_at BEFORE UPDATE ON public.pre_opening_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_profiles BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.provider_reviews FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_provider_reviews BEFORE INSERT OR UPDATE ON public.provider_reviews FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_update_provider_review_stats AFTER INSERT OR DELETE OR UPDATE ON public.provider_reviews FOR EACH ROW EXECUTE FUNCTION public.update_provider_review_stats();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_purchase_orders BEFORE INSERT OR UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trigger_generate_po_number BEFORE INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.generate_po_number();
CREATE TRIGGER ensure_user_id_push_subscriptions BEFORE INSERT OR UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_rappi_menu_sync BEFORE INSERT OR UPDATE ON public.rappi_menu_sync FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_rappi_menu_sync_updated_at BEFORE UPDATE ON public.rappi_menu_sync FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_rappi_settlements BEFORE INSERT OR UPDATE ON public.rappi_settlements FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_rappi_store_status BEFORE INSERT OR UPDATE ON public.rappi_store_status FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_recipe_nutrition_updated_at BEFORE UPDATE ON public.recipe_nutrition FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recipe_steps_updated_at BEFORE UPDATE ON public.recipe_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_recipes BEFORE INSERT OR UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_sync_recipe_to_menu_item AFTER UPDATE OF menu_item_id ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.sync_recipe_to_menu_item();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.restaurant_brands FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_restaurant_brands BEFORE INSERT OR UPDATE ON public.restaurant_brands FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_restaurant_brands_updated_at BEFORE UPDATE ON public.restaurant_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_seed_roles_on_business_insert AFTER INSERT ON public.restaurant_businesses FOR EACH ROW EXECUTE FUNCTION public.tg_seed_roles_for_new_business();
CREATE TRIGGER update_restaurant_businesses_updated_at BEFORE UPDATE ON public.restaurant_businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_chains_updated_at BEFORE UPDATE ON public.restaurant_chains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_custom_roles_updated_at BEFORE UPDATE ON public.restaurant_custom_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.restaurant_expenses FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.restaurant_menus FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.restaurant_menus FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_restaurant_menus BEFORE INSERT OR UPDATE ON public.restaurant_menus FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_restaurant_menus_updated_at BEFORE UPDATE ON public.restaurant_menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_restaurant_orders BEFORE INSERT OR UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER sync_loyalty_from_orders AFTER INSERT OR UPDATE OF status, total, customer_email, customer_phone ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.trg_sync_loyalty_from_orders();
CREATE TRIGGER trg_log_order_status_change AFTER INSERT OR UPDATE OF status ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();
CREATE TRIGGER trg_order_inventory_deduction AFTER INSERT OR UPDATE OF status ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.trg_order_inventory_deduction();
CREATE TRIGGER trg_pos_audit_order AFTER INSERT OR UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.pos_audit_order_change();
CREATE TRIGGER trigger_menu_scores_on_order AFTER INSERT OR UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.trigger_update_menu_scores_on_order();
CREATE TRIGGER update_restaurant_orders_updated_at BEFORE UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_restaurant_tables BEFORE INSERT OR UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.restaurant_team_members FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_restaurant_team_members BEFORE INSERT OR UPDATE ON public.restaurant_team_members FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_log_team_member_change AFTER UPDATE ON public.restaurant_team_members FOR EACH ROW EXECUTE FUNCTION public.log_team_member_change();
CREATE TRIGGER update_restaurant_team_members_updated_at BEFORE UPDATE ON public.restaurant_team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.restaurant_websites FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_restaurant_websites BEFORE INSERT OR UPDATE ON public.restaurant_websites FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_restaurant_websites_updated_at BEFORE UPDATE ON public.restaurant_websites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_zones_updated_at BEFORE UPDATE ON public.restaurant_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_reviews BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.sales_goals FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_sales_goals BEFORE INSERT OR UPDATE ON public.sales_goals FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_sales_goals_updated_at BEFORE UPDATE ON public.sales_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.sales_projections FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_sales_projections BEFORE INSERT OR UPDATE ON public.sales_projections FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.sentiment_reports FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_sentiment_reports BEFORE INSERT OR UPDATE ON public.sentiment_reports FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_service_bookings BEFORE INSERT OR UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.service_proposals FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_service_proposals BEFORE INSERT OR UPDATE ON public.service_proposals FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_update_proposals_count AFTER INSERT OR DELETE ON public.service_proposals FOR EACH ROW EXECUTE FUNCTION public.update_request_proposals_count();
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON public.service_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_service_requests BEFORE INSERT OR UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.shift_swap_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_shift_swap_requests BEFORE INSERT OR UPDATE ON public.shift_swap_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.shift_templates FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_shift_templates BEFORE INSERT OR UPDATE ON public.shift_templates FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_social_accounts BEFORE INSERT OR UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.social_mentions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_social_mentions BEFORE INSERT OR UPDATE ON public.social_mentions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.staff_availability FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_staff_availability BEFORE INSERT OR UPDATE ON public.staff_availability FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.staff_benefit_assignments FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_staff_benefit_assignments BEFORE INSERT OR UPDATE ON public.staff_benefit_assignments FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_staff_benefit_assignments_updated_at BEFORE UPDATE ON public.staff_benefit_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.staff_benefits FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_staff_benefits BEFORE INSERT OR UPDATE ON public.staff_benefits FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.staff_certifications FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_staff_certifications BEFORE INSERT OR UPDATE ON public.staff_certifications FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_staff_members BEFORE INSERT OR UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.staff_shifts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_staff_shifts BEFORE INSERT OR UPDATE ON public.staff_shifts FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_staff_shifts_updated_at BEFORE UPDATE ON public.staff_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.staff_training_progress FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_staff_training_progress BEFORE INSERT OR UPDATE ON public.staff_training_progress FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_staff_training_progress_updated_at BEFORE UPDATE ON public.staff_training_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.storage_locations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_storage_locations BEFORE INSERT OR UPDATE ON public.storage_locations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.supplier_analysis FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_supplier_analysis BEFORE INSERT OR UPDATE ON public.supplier_analysis FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_supplier_analysis_updated_at BEFORE UPDATE ON public.supplier_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.supplier_invoices FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.supplier_invoices FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_supplier_invoices BEFORE INSERT OR UPDATE ON public.supplier_invoices FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_supplier_invoices_updated_at BEFORE UPDATE ON public.supplier_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_suppliers BEFORE INSERT OR UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.support_templates FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_support_templates BEFORE INSERT OR UPDATE ON public.support_templates FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_support_tickets BEFORE INSERT OR UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.sustainability_goals FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_sustainability_goals BEFORE INSERT OR UPDATE ON public.sustainability_goals FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_sustainability_goals_updated_at BEFORE UPDATE ON public.sustainability_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.sustainability_reports FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_sustainability_reports BEFORE INSERT OR UPDATE ON public.sustainability_reports FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.table_reservations FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.table_reservations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_table_reservations BEFORE INSERT OR UPDATE ON public.table_reservations FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER generate_reservation_code BEFORE INSERT ON public.table_reservations FOR EACH ROW EXECUTE FUNCTION public.generate_reservation_confirmation_code();
CREATE TRIGGER update_table_reservations_updated_at BEFORE UPDATE ON public.table_reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_team_permissions_history BEFORE INSERT OR UPDATE ON public.team_permissions_history FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.time_off_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_time_off_requests BEFORE INSERT OR UPDATE ON public.time_off_requests FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER trg_tip_allocations_locked BEFORE INSERT OR DELETE OR UPDATE ON public.tip_allocations FOR EACH ROW EXECUTE FUNCTION public.tg_tip_allocations_locked();
CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON public.training_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.training_programs FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_training_programs BEFORE INSERT OR UPDATE ON public.training_programs FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_unit_conversions_updated_at BEFORE UPDATE ON public.unit_conversions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_user_roles BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.venue_bookings FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_venue_bookings BEFORE INSERT OR UPDATE ON public.venue_bookings FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_venue_bookings_updated_at BEFORE UPDATE ON public.venue_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ensure_user_id_for_rls BEFORE INSERT OR UPDATE ON public.virtual_brands FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER ensure_user_id_virtual_brands BEFORE INSERT OR UPDATE ON public.virtual_brands FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls();
CREATE TRIGGER update_virtual_brands_updated_at BEFORE UPDATE ON public.virtual_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seguridad a nivel de fila
ALTER TABLE public._demo_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._demo_menu_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregator_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregator_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_opening_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_footprint_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_master_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_impersonation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_preregistrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_item_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_waste ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_saved ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_production_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_track_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_customer_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturity_action_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturity_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifier_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_phase_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateway_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_pin_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_session_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_supervisor_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_opening_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rappi_menu_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rappi_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rappi_store_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rappi_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_sub_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_benefit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_permissions_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_role_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their aggregator integrations" ON public.aggregator_integrations AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their aggregator orders" ON public.aggregator_orders AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can view allergens" ON public.allergens AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Employers can view applicant profiles" ON public.applicant_profiles AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role]))))) OR (is_available = true)));
CREATE POLICY "Users can manage their own applicant profile" ON public.applicant_profiles AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Admins read all audit" ON public.audit_log AS PERMISSIVE FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Business owners read their audit" ON public.audit_log AS PERMISSIVE FOR SELECT TO public
  USING (((business_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.restaurant_businesses rb
  WHERE ((rb.id = audit_log.business_id) AND (rb.owner_id = auth.uid()))))));
CREATE POLICY "Service role inserts audit" ON public.audit_log AS PERMISSIVE FOR INSERT TO service_role
  WITH CHECK (true);
CREATE POLICY "Owners manage benefit requests" ON public.benefit_requests AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Team members can create benefit requests" ON public.benefit_requests AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((staff_member_id IN ( SELECT staff_members.id
   FROM public.staff_members
  WHERE (staff_members.linked_user_id = auth.uid()))));
CREATE POLICY "Team members can view own benefit requests" ON public.benefit_requests AS PERMISSIVE FOR SELECT TO public
  USING ((staff_member_id IN ( SELECT staff_members.id
   FROM public.staff_members
  WHERE (staff_members.linked_user_id = auth.uid()))));
CREATE POLICY "Users can manage assets of their brands" ON public.brand_assets AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_brands
  WHERE ((restaurant_brands.id = brand_assets.brand_id) AND (restaurant_brands.user_id = auth.uid())))));
CREATE POLICY "Users can manage brand menus" ON public.brand_menus AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.virtual_brands
  WHERE ((virtual_brands.id = brand_menus.brand_id) AND (virtual_brands.user_id = auth.uid())))));
CREATE POLICY "Users can create their own projects" ON public.business_opening_projects AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own projects" ON public.business_opening_projects AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own projects" ON public.business_opening_projects AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own projects" ON public.business_opening_projects AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Employers can view applicant experience" ON public.candidate_experience AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM (public.job_applications ja
     JOIN public.jobs j ON ((j.id = ja.job_id)))
  WHERE ((ja.candidate_profile_id = candidate_experience.candidate_id) AND (j.employer_id = auth.uid())))));
CREATE POLICY "Users can delete own experience" ON public.candidate_experience AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.candidate_profiles cp
  WHERE ((cp.id = candidate_experience.candidate_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Users can insert own experience" ON public.candidate_experience AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.candidate_profiles cp
  WHERE ((cp.id = candidate_experience.candidate_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Users can update own experience" ON public.candidate_experience AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.candidate_profiles cp
  WHERE ((cp.id = candidate_experience.candidate_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Users can view own experience" ON public.candidate_experience AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.candidate_profiles cp
  WHERE ((cp.id = candidate_experience.candidate_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Employers can view applicant profiles" ON public.candidate_profiles AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM (public.job_applications ja
     JOIN public.jobs j ON ((j.id = ja.job_id)))
  WHERE ((ja.candidate_profile_id = candidate_profiles.id) AND (j.employer_id = auth.uid())))));
CREATE POLICY "Platform admins can read all candidates" ON public.candidate_profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can delete own profile" ON public.candidate_profiles AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own profile" ON public.candidate_profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own profile" ON public.candidate_profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own profile" ON public.candidate_profiles AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their carbon footprint items" ON public.carbon_footprint_items AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Chain owners can manage locations" ON public.chain_locations AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_chains
  WHERE ((restaurant_chains.id = chain_locations.chain_id) AND (restaurant_chains.owner_id = auth.uid())))));
CREATE POLICY "Location managers can view their location" ON public.chain_locations AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = local_user_id));
CREATE POLICY "Chain owners can manage master menus" ON public.chain_master_menus AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_chains
  WHERE ((restaurant_chains.id = chain_master_menus.chain_id) AND (restaurant_chains.owner_id = auth.uid())))));
CREATE POLICY "Chain owners can manage checklists" ON public.compliance_checklists AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_chains
  WHERE ((restaurant_chains.id = compliance_checklists.chain_id) AND (restaurant_chains.owner_id = auth.uid())))));
CREATE POLICY "Location users can manage compliance records" ON public.compliance_records AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.chain_locations
  WHERE ((chain_locations.id = compliance_records.location_id) AND ((chain_locations.local_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.restaurant_chains
          WHERE ((restaurant_chains.id = chain_locations.chain_id) AND (restaurant_chains.owner_id = auth.uid())))))))));
CREATE POLICY "Clients can view their consultant relationship" ON public.consultant_clients AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = client_user_id));
CREATE POLICY "Consultants can delete their own clients" ON public.consultant_clients AS PERMISSIVE FOR DELETE TO public
  USING ((consultant_id IN ( SELECT consultant_profiles.id
   FROM public.consultant_profiles
  WHERE (consultant_profiles.user_id = auth.uid()))));
CREATE POLICY "Consultants can insert their own clients" ON public.consultant_clients AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((consultant_id IN ( SELECT consultant_profiles.id
   FROM public.consultant_profiles
  WHERE (consultant_profiles.user_id = auth.uid()))));
CREATE POLICY "Consultants can manage their clients" ON public.consultant_clients AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.consultant_profiles
  WHERE ((consultant_profiles.id = consultant_clients.consultant_id) AND (consultant_profiles.user_id = auth.uid())))));
CREATE POLICY "Consultants can update their own clients" ON public.consultant_clients AS PERMISSIVE FOR UPDATE TO public
  USING ((consultant_id IN ( SELECT consultant_profiles.id
   FROM public.consultant_profiles
  WHERE (consultant_profiles.user_id = auth.uid()))));
CREATE POLICY "Consultants can view their own clients" ON public.consultant_clients AS PERMISSIVE FOR SELECT TO public
  USING ((consultant_id IN ( SELECT consultant_profiles.id
   FROM public.consultant_profiles
  WHERE (consultant_profiles.user_id = auth.uid()))));
CREATE POLICY "Restaurant owners can view their consultant relationship" ON public.consultant_clients AS PERMISSIVE FOR SELECT TO public
  USING ((client_user_id = auth.uid()));
CREATE POLICY "Consultants close their session" ON public.consultant_impersonation_log AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = consultant_id));
CREATE POLICY "Consultants log their own impersonation" ON public.consultant_impersonation_log AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = consultant_id));
CREATE POLICY "Consultants read their own impersonation" ON public.consultant_impersonation_log AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid() = consultant_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Consultants can create own profile" ON public.consultant_profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Consultants can delete own profile" ON public.consultant_profiles AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Consultants can update own profile" ON public.consultant_profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Consultants can view own profile" ON public.consultant_profiles AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Platform admins can read all consultants" ON public.consultant_profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can manage their consultant profile" ON public.consultant_profiles AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Consultants can manage their reports" ON public.consultant_reports AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.consultant_profiles
  WHERE ((consultant_profiles.id = consultant_reports.consultant_id) AND (consultant_profiles.user_id = auth.uid())))));
CREATE POLICY "Consultants can manage their invoices" ON public.consulting_invoices AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.consultant_profiles
  WHERE ((consultant_profiles.id = consulting_invoices.consultant_id) AND (consultant_profiles.user_id = auth.uid())))));
CREATE POLICY "Users can manage their copilot alerts" ON public.copilot_alerts AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their copilot conversations" ON public.copilot_conversations AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their copilot messages" ON public.copilot_messages AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.copilot_conversations
  WHERE ((copilot_conversations.id = copilot_messages.conversation_id) AND (copilot_conversations.user_id = auth.uid())))));
CREATE POLICY "Platform admins can read all certificates" ON public.course_certificates AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users view own certificates" ON public.course_certificates AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Platform admins can read all enrollments" ON public.course_enrollments AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can enroll themselves" ON public.course_enrollments AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own enrollments" ON public.course_enrollments AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage lessons" ON public.course_lessons AS PERMISSIVE FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can view free preview lessons" ON public.course_lessons AS PERMISSIVE FOR SELECT TO public
  USING ((is_free_preview = true));
CREATE POLICY "Enrolled users can view lessons" ON public.course_lessons AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.course_enrollments ce
  WHERE ((ce.course_id = course_lessons.course_id) AND (ce.user_id = auth.uid())))));
CREATE POLICY "Anyone can view reviews" ON public.course_reviews AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Users delete own reviews" ON public.course_reviews AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users manage own reviews" ON public.course_reviews AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own reviews" ON public.course_reviews AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can submit feedback with valid user_id" ON public.customer_feedback AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id IS NOT NULL));
CREATE POLICY "Users can manage their feedback" ON public.customer_feedback AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their daily briefings" ON public.daily_briefings AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY daily_sales_modify ON public.daily_sales AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY daily_sales_select ON public.daily_sales AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_consultant_of(( SELECT auth.uid() AS uid), user_id)));
CREATE POLICY team_read ON public.daily_sales AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{finances,dashboard}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.daily_sales AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{finances}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{finances}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can insert their own debug events" ON public.debug_events AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own debug events" ON public.debug_events AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their delivery zones" ON public.delivery_zones AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.demand_events AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text, 'dashboard'::text, 'reservations'::text, 'pos'::text, 'marketing'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.demand_events AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text, 'reservations'::text, 'brand'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text, 'reservations'::text, 'brand'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Anyone can view active categories" ON public.event_categories AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));
CREATE POLICY "Consultants can manage their quotations" ON public.event_quotations AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.consultant_profiles cp
  WHERE ((cp.id = event_quotations.consultant_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Public can view quotations by slug" ON public.event_quotations AS PERMISSIVE FOR SELECT TO public
  USING (((public_slug IS NOT NULL) AND (status <> 'draft'::text)));
CREATE POLICY "Anyone can view public events" ON public.events AS PERMISSIVE FOR SELECT TO public
  USING (((is_public = true) AND (status = 'published'::public.event_status)));
CREATE POLICY "Organizers can manage their own events" ON public.events AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = organizer_id));
CREATE POLICY "Users can manage their campaigns" ON public.feedback_campaigns AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY owner_all ON public.finance_accounts AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY team_read ON public.finance_accounts AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.finance_accounts AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY owner_all ON public.finance_settings AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY team_read ON public.finance_settings AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.finance_settings AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY owner_all ON public.finance_settlements AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY team_read ON public.finance_settlements AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.finance_settlements AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can manage their food waste logs" ON public.food_waste_logs AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can submit a pre-registration" ON public.growth_preregistrations AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "Authenticated users can delete pre-registrations" ON public.growth_preregistrations AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Authenticated users can read pre-registrations" ON public.growth_preregistrations AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Platform admins can read all preregistrations" ON public.growth_preregistrations AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Authenticated users can view benchmarks" ON public.industry_benchmarks AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can create count items" ON public.inventory_count_items AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inventory_counts c
  WHERE ((c.id = inventory_count_items.count_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can delete own count items" ON public.inventory_count_items AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.inventory_counts c
  WHERE ((c.id = inventory_count_items.count_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can update own count items" ON public.inventory_count_items AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.inventory_counts c
  WHERE ((c.id = inventory_count_items.count_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can view own count items" ON public.inventory_count_items AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.inventory_counts c
  WHERE ((c.id = inventory_count_items.count_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can create counts" ON public.inventory_counts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own counts" ON public.inventory_counts AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own counts" ON public.inventory_counts AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own counts" ON public.inventory_counts AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own deductions" ON public.inventory_deductions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own deductions" ON public.inventory_deductions AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.inventory_deductions AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory,finances,dashboard,recipes}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.inventory_deductions AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory,pos}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{inventory,pos}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create item suppliers" ON public.inventory_item_suppliers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inventory_items i
  WHERE ((i.id = inventory_item_suppliers.inventory_item_id) AND (i.user_id = auth.uid())))));
CREATE POLICY "Users can delete own item suppliers" ON public.inventory_item_suppliers AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.inventory_items i
  WHERE ((i.id = inventory_item_suppliers.inventory_item_id) AND (i.user_id = auth.uid())))));
CREATE POLICY "Users can update own item suppliers" ON public.inventory_item_suppliers AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.inventory_items i
  WHERE ((i.id = inventory_item_suppliers.inventory_item_id) AND (i.user_id = auth.uid())))));
CREATE POLICY "Users can view own item suppliers" ON public.inventory_item_suppliers AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.inventory_items i
  WHERE ((i.id = inventory_item_suppliers.inventory_item_id) AND (i.user_id = auth.uid())))));
CREATE POLICY inventory_items_delete ON public.inventory_items AS PERMISSIVE FOR DELETE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY inventory_items_insert ON public.inventory_items AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY inventory_items_select ON public.inventory_items AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_consultant_of(( SELECT auth.uid() AS uid), user_id)));
CREATE POLICY inventory_items_update ON public.inventory_items AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY team_read ON public.inventory_items AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory,recipes}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.inventory_items AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create movements" ON public.inventory_movements AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own movements" ON public.inventory_movements AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create price history" ON public.inventory_price_history AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inventory_items i
  WHERE ((i.id = inventory_price_history.inventory_item_id) AND (i.user_id = auth.uid())))));
CREATE POLICY "Users can view own price history" ON public.inventory_price_history AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.inventory_items i
  WHERE ((i.id = inventory_price_history.inventory_item_id) AND (i.user_id = auth.uid())))));
CREATE POLICY "Users can create suppliers" ON public.inventory_suppliers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own suppliers" ON public.inventory_suppliers AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own suppliers" ON public.inventory_suppliers AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own suppliers" ON public.inventory_suppliers AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.inventory_suppliers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory,suppliers,invoices}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.inventory_suppliers AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Chain owners can manage transfers" ON public.inventory_transfers AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_chains
  WHERE ((restaurant_chains.id = inventory_transfers.chain_id) AND (restaurant_chains.owner_id = auth.uid())))));
CREATE POLICY "Users can create waste" ON public.inventory_waste AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own waste" ON public.inventory_waste AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own waste" ON public.inventory_waste AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own waste" ON public.inventory_waste AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Applicants can create applications" ON public.job_applications AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = applicant_id));
CREATE POLICY "Applicants can view their own applications" ON public.job_applications AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = applicant_id));
CREATE POLICY "Employers can update applications for their jobs" ON public.job_applications AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = job_applications.job_id) AND (jobs.employer_id = auth.uid())))));
CREATE POLICY "Employers can view applications for their jobs" ON public.job_applications AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = job_applications.job_id) AND (jobs.employer_id = auth.uid())))));
CREATE POLICY "Platform admins can read all applications" ON public.job_applications AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can save jobs" ON public.job_saved AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can unsave jobs" ON public.job_saved AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own saved jobs" ON public.job_saved AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can view active jobs" ON public.jobs AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));
CREATE POLICY "Employers can manage their own jobs" ON public.jobs AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = employer_id));
CREATE POLICY "Platform admins can read all jobs" ON public.jobs AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can update jobs" ON public.jobs AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can manage their kitchen queue" ON public.kitchen_production_queue AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own knowledge chunks" ON public.knowledge_chunks AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own knowledge chunks" ON public.knowledge_chunks AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users view own knowledge chunks" ON public.knowledge_chunks AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own knowledge sources" ON public.knowledge_sources AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own knowledge sources" ON public.knowledge_sources AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own knowledge sources" ON public.knowledge_sources AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users view own knowledge sources" ON public.knowledge_sources AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage track courses" ON public.learning_track_courses AS PERMISSIVE FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can view track courses" ON public.learning_track_courses AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Admins can manage tracks" ON public.learning_tracks AS PERMISSIVE FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can view published tracks" ON public.learning_tracks AS PERMISSIVE FOR SELECT TO public
  USING ((is_published = true));
CREATE POLICY "Users manage own progress" ON public.lesson_progress AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Public can read active achievements" ON public.loyalty_achievements AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));
CREATE POLICY "Users can create their own achievements" ON public.loyalty_achievements AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own achievements" ON public.loyalty_achievements AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own achievements" ON public.loyalty_achievements AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own achievements" ON public.loyalty_achievements AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own campaigns" ON public.loyalty_campaigns AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own campaigns" ON public.loyalty_campaigns AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own campaigns" ON public.loyalty_campaigns AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own campaigns" ON public.loyalty_campaigns AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create customer achievements" ON public.loyalty_customer_achievements AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.loyalty_customers lc
  WHERE ((lc.id = loyalty_customer_achievements.customer_id) AND (lc.user_id = auth.uid())))));
CREATE POLICY "Users can view customer achievements" ON public.loyalty_customer_achievements AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.loyalty_customers lc
  WHERE ((lc.id = loyalty_customer_achievements.customer_id) AND (lc.user_id = auth.uid())))));
CREATE POLICY "Users can create their own customers" ON public.loyalty_customers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own customers" ON public.loyalty_customers AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own customers" ON public.loyalty_customers AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own customers" ON public.loyalty_customers AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.loyalty_customers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{loyalty,pos,dashboard}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.loyalty_customers AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{loyalty,pos}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{loyalty,pos}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create their own transactions" ON public.loyalty_points_transactions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own transactions" ON public.loyalty_points_transactions AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own rewards" ON public.loyalty_rewards AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own rewards" ON public.loyalty_rewards AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own rewards" ON public.loyalty_rewards AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Public can read active rewards catalog" ON public.loyalty_rewards_catalog AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));
CREATE POLICY "Users can create their own catalog items" ON public.loyalty_rewards_catalog AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own catalog items" ON public.loyalty_rewards_catalog AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own catalog items" ON public.loyalty_rewards_catalog AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own catalog" ON public.loyalty_rewards_catalog AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Public can read loyalty tiers" ON public.loyalty_tiers AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Users can create their own tiers" ON public.loyalty_tiers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own tiers" ON public.loyalty_tiers AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own tiers" ON public.loyalty_tiers AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own tiers" ON public.loyalty_tiers AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY owner_all ON public.marketing_content AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY team_read ON public.marketing_content AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['brand'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.marketing_content AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['brand'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['brand'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can delete their own action tracking" ON public.maturity_action_tracking AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own action tracking" ON public.maturity_action_tracking AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own action tracking" ON public.maturity_action_tracking AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own action tracking" ON public.maturity_action_tracking AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own diagnoses" ON public.maturity_diagnoses AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own diagnoses" ON public.maturity_diagnoses AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own diagnoses" ON public.maturity_diagnoses AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can view measurement units" ON public.measurement_units AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Allergens are publicly readable" ON public.menu_allergens AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Public can view categories of published menus" ON public.menu_categories AS PERMISSIVE FOR SELECT TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.status = 'published'::public.menu_status))));
CREATE POLICY "Users can create menu categories" ON public.menu_categories AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY "Users can delete their own menu categories" ON public.menu_categories AS PERMISSIVE FOR DELETE TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY "Users can update their own menu categories" ON public.menu_categories AS PERMISSIVE FOR UPDATE TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY "Users can view their own menu categories" ON public.menu_categories AS PERMISSIVE FOR SELECT TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY team_read ON public.menu_categories AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_menus m
  WHERE ((m.id = menu_categories.menu_id) AND (m.user_id IN ( SELECT public.team_owner_ids(ARRAY['menus'::text, 'pos'::text, 'orders'::text, 'recipes'::text, 'kitchen_display'::text], 'read'::text) AS team_owner_ids))))));
CREATE POLICY "Users can manage item modifier links" ON public.menu_item_modifier_links AS PERMISSIVE FOR ALL TO public
  USING ((menu_item_id IN ( SELECT menu_items.id
   FROM public.menu_items
  WHERE (menu_items.menu_id IN ( SELECT restaurant_menus.id
           FROM public.restaurant_menus
          WHERE (restaurant_menus.user_id = auth.uid()))))));
CREATE POLICY "Users can view their item modifier links" ON public.menu_item_modifier_links AS PERMISSIVE FOR SELECT TO public
  USING ((menu_item_id IN ( SELECT menu_items.id
   FROM public.menu_items
  WHERE (menu_items.menu_id IN ( SELECT restaurant_menus.id
           FROM public.restaurant_menus
          WHERE (restaurant_menus.user_id = auth.uid()))))));
CREATE POLICY "Public can view modifiers of published menus" ON public.menu_item_modifiers AS PERMISSIVE FOR SELECT TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.status = 'published'::public.menu_status))));
CREATE POLICY "Users can create modifiers" ON public.menu_item_modifiers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY "Users can delete their own modifiers" ON public.menu_item_modifiers AS PERMISSIVE FOR DELETE TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY "Users can update their own modifiers" ON public.menu_item_modifiers AS PERMISSIVE FOR UPDATE TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY "Users can view their own modifiers" ON public.menu_item_modifiers AS PERMISSIVE FOR SELECT TO public
  USING ((menu_id IN ( SELECT restaurant_menus.id
   FROM public.restaurant_menus
  WHERE (restaurant_menus.user_id = auth.uid()))));
CREATE POLICY "Public can view items of published menus" ON public.menu_items AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_menus
  WHERE ((restaurant_menus.id = menu_items.menu_id) AND (restaurant_menus.status = 'published'::public.menu_status)))));
CREATE POLICY "Users can manage their menu items" ON public.menu_items AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_menus
  WHERE ((restaurant_menus.id = menu_items.menu_id) AND (restaurant_menus.user_id = auth.uid())))));
CREATE POLICY team_read ON public.menu_items AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_menus m
  WHERE ((m.id = menu_items.menu_id) AND (m.user_id IN ( SELECT public.team_owner_ids(ARRAY['menus'::text, 'pos'::text, 'orders'::text, 'recipes'::text, 'kitchen_display'::text], 'read'::text) AS team_owner_ids))))));
CREATE POLICY "Public can view modifier options of published menus" ON public.menu_modifier_options AS PERMISSIVE FOR SELECT TO public
  USING ((modifier_id IN ( SELECT menu_item_modifiers.id
   FROM public.menu_item_modifiers
  WHERE (menu_item_modifiers.menu_id IN ( SELECT restaurant_menus.id
           FROM public.restaurant_menus
          WHERE (restaurant_menus.status = 'published'::public.menu_status))))));
CREATE POLICY "Users can manage modifier options" ON public.menu_modifier_options AS PERMISSIVE FOR ALL TO public
  USING ((modifier_id IN ( SELECT menu_item_modifiers.id
   FROM public.menu_item_modifiers
  WHERE (menu_item_modifiers.menu_id IN ( SELECT restaurant_menus.id
           FROM public.restaurant_menus
          WHERE (restaurant_menus.user_id = auth.uid()))))));
CREATE POLICY "Users can view modifier options" ON public.menu_modifier_options AS PERMISSIVE FOR SELECT TO public
  USING ((modifier_id IN ( SELECT menu_item_modifiers.id
   FROM public.menu_item_modifiers
  WHERE (menu_item_modifiers.menu_id IN ( SELECT restaurant_menus.id
           FROM public.restaurant_menus
          WHERE (restaurant_menus.user_id = auth.uid()))))));
CREATE POLICY "Anyone can view active templates" ON public.menu_templates AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));
CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own notifications" ON public.notifications_log AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own notifications" ON public.notifications_log AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own runs" ON public.opening_analysis_runs AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own runs" ON public.opening_analysis_runs AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own runs" ON public.opening_analysis_runs AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create checklist items for their projects" ON public.opening_checklist_items AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_checklist_items.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Users can delete checklist items of their projects" ON public.opening_checklist_items AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_checklist_items.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Users can update checklist of their projects" ON public.opening_checklist_items AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_checklist_items.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Users can view checklist of their projects" ON public.opening_checklist_items AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_checklist_items.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Users can create analyses for their projects" ON public.opening_phase_analyses AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_phase_analyses.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Users can delete analyses of their projects" ON public.opening_phase_analyses AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_phase_analyses.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Users can update analyses of their projects" ON public.opening_phase_analyses AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_phase_analyses.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Users can view analyses of their projects" ON public.opening_phase_analyses AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.business_opening_projects
  WHERE ((business_opening_projects.id = opening_phase_analyses.project_id) AND (business_opening_projects.user_id = auth.uid())))));
CREATE POLICY "Owners can view their order status history" ON public.order_status_history AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_orders ro
  WHERE ((ro.id = order_status_history.order_id) AND (ro.user_id = auth.uid())))));
CREATE POLICY "System can insert order status history" ON public.order_status_history AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurant_orders ro
  WHERE ((ro.id = order_status_history.order_id) AND (ro.user_id = auth.uid())))));
CREATE POLICY "Users can view order history" ON public.order_status_history AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_orders
  WHERE ((restaurant_orders.id = order_status_history.order_id) AND (restaurant_orders.user_id = auth.uid())))));
CREATE POLICY team_read ON public.order_status_history AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_orders o
  WHERE ((o.id = order_status_history.order_id) AND (o.user_id IN ( SELECT public.team_owner_ids(ARRAY['orders'::text, 'pos'::text, 'kitchen_display'::text], 'read'::text) AS team_owner_ids))))));
CREATE POLICY team_write ON public.order_status_history AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurant_orders o
  WHERE ((o.id = order_status_history.order_id) AND (o.user_id IN ( SELECT public.team_owner_ids(ARRAY['orders'::text, 'pos'::text, 'kitchen_display'::text], 'write'::text) AS team_owner_ids))))));
CREATE POLICY "Users can delete their own credentials" ON public.payment_gateway_credentials AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own credentials" ON public.payment_gateway_credentials AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own credentials" ON public.payment_gateway_credentials AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own credentials" ON public.payment_gateway_credentials AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users read their payment webhooks" ON public.payment_webhook_events AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "pos_audit insert by owner or service" ON public.pos_audit_log AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((auth.uid() = user_id) OR (auth.uid() = actor_user_id)));
CREATE POLICY "pos_audit owner select" ON public.pos_audit_log AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create movements in their sessions" ON public.pos_cash_movements AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.pos_sessions
  WHERE ((pos_sessions.id = pos_cash_movements.session_id) AND (pos_sessions.user_id = auth.uid())))));
CREATE POLICY "Users can view movements from their sessions" ON public.pos_cash_movements AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.pos_sessions
  WHERE ((pos_sessions.id = pos_cash_movements.session_id) AND (pos_sessions.user_id = auth.uid())))));
CREATE POLICY "Users can create their own discounts" ON public.pos_discounts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own discounts" ON public.pos_discounts AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own discounts" ON public.pos_discounts AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own discounts" ON public.pos_discounts AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.pos_discounts AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos,pos_reports}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.pos_discounts AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{settings}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{settings}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "pos_fraud insert" ON public.pos_fraud_signals AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "pos_fraud owner read" ON public.pos_fraud_signals AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = user_id));
CREATE POLICY "pos_fraud owner update" ON public.pos_fraud_signals AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own payment methods" ON public.pos_payment_methods AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own payment methods" ON public.pos_payment_methods AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own payment methods" ON public.pos_payment_methods AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own payment methods" ON public.pos_payment_methods AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.pos_payment_methods AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos,pos_reports}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.pos_payment_methods AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{settings}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{settings}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "pos_closures owner" ON public.pos_session_closures AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY team_read ON public.pos_session_closures AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos,pos_reports,pos_audit}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.pos_session_closures AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{pos}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create their own sessions" ON public.pos_sessions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own sessions" ON public.pos_sessions AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own sessions" ON public.pos_sessions AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.pos_sessions AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos,pos_reports,pos_audit,finances}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.pos_sessions AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{pos}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "pos_sup_auth owner insert" ON public.pos_supervisor_authorizations AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "pos_sup_auth owner read" ON public.pos_supervisor_authorizations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = user_id));
CREATE POLICY "pos_sup_auth owner update" ON public.pos_supervisor_authorizations AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create transactions in their sessions" ON public.pos_transactions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.pos_sessions
  WHERE ((pos_sessions.id = pos_transactions.session_id) AND (pos_sessions.user_id = auth.uid())))));
CREATE POLICY "Users can view transactions from their sessions" ON public.pos_transactions AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.pos_sessions
  WHERE ((pos_sessions.id = pos_transactions.session_id) AND (pos_sessions.user_id = auth.uid())))));
CREATE POLICY team_read ON public.pos_transactions AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.pos_sessions s
  WHERE ((s.id = pos_transactions.session_id) AND (s.user_id IN ( SELECT public.team_owner_ids(ARRAY['pos'::text, 'pos_reports'::text, 'pos_audit'::text, 'finances'::text], 'read'::text) AS team_owner_ids))))));
CREATE POLICY team_write ON public.pos_transactions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.pos_sessions s
  WHERE ((s.id = pos_transactions.session_id) AND (s.user_id IN ( SELECT public.team_owner_ids(ARRAY['pos'::text], 'write'::text) AS team_owner_ids))))));
CREATE POLICY "pos_activity insert" ON public.pos_user_activity AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "pos_activity owner read" ON public.pos_user_activity AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own pre-opening tasks" ON public.pre_opening_tasks AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own pre-opening tasks" ON public.pre_opening_tasks AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own pre-opening tasks" ON public.pre_opening_tasks AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own pre-opening tasks" ON public.pre_opening_tasks AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Platform admins can read all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can view portfolio" ON public.provider_portfolio AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Provider owners can delete portfolio" ON public.provider_portfolio AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() IN ( SELECT sp.owner_id
   FROM public.service_providers sp
  WHERE (sp.id = provider_portfolio.provider_id))));
CREATE POLICY "Provider owners can manage portfolio" ON public.provider_portfolio AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() IN ( SELECT sp.owner_id
   FROM public.service_providers sp
  WHERE (sp.id = provider_portfolio.provider_id))));
CREATE POLICY "Provider owners can update portfolio" ON public.provider_portfolio AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() IN ( SELECT sp.owner_id
   FROM public.service_providers sp
  WHERE (sp.id = provider_portfolio.provider_id))));
CREATE POLICY "Anyone can view reviews" ON public.provider_reviews AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.provider_reviews AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owners can update their reviews" ON public.provider_reviews AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Platform admins can delete reviews" ON public.provider_reviews AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can read all provider reviews" ON public.provider_reviews AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can update reviews" ON public.provider_reviews AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can create PO items" ON public.purchase_order_items AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.purchase_orders po
  WHERE ((po.id = purchase_order_items.purchase_order_id) AND (po.user_id = auth.uid())))));
CREATE POLICY "Users can delete own PO items" ON public.purchase_order_items AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.purchase_orders po
  WHERE ((po.id = purchase_order_items.purchase_order_id) AND (po.user_id = auth.uid())))));
CREATE POLICY "Users can update own PO items" ON public.purchase_order_items AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.purchase_orders po
  WHERE ((po.id = purchase_order_items.purchase_order_id) AND (po.user_id = auth.uid())))));
CREATE POLICY "Users can view own PO items" ON public.purchase_order_items AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.purchase_orders po
  WHERE ((po.id = purchase_order_items.purchase_order_id) AND (po.user_id = auth.uid())))));
CREATE POLICY team_read ON public.purchase_order_items AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.purchase_orders po
  WHERE ((po.id = purchase_order_items.purchase_order_id) AND (po.user_id IN ( SELECT public.team_owner_ids(ARRAY['inventory'::text, 'suppliers'::text], 'read'::text) AS team_owner_ids))))));
CREATE POLICY "Users can create purchase orders" ON public.purchase_orders AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own purchase orders" ON public.purchase_orders AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own purchase orders" ON public.purchase_orders AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own purchase orders" ON public.purchase_orders AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.purchase_orders AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory,suppliers}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.purchase_orders AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Access gallery through quotation" ON public.quotation_gallery AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM (public.event_quotations eq
     JOIN public.consultant_profiles cp ON ((cp.id = eq.consultant_id)))
  WHERE ((eq.id = quotation_gallery.quotation_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Public can view gallery of public quotations" ON public.quotation_gallery AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.event_quotations eq
  WHERE ((eq.id = quotation_gallery.quotation_id) AND (eq.public_slug IS NOT NULL) AND (eq.status <> 'draft'::text)))));
CREATE POLICY "Access menu items through quotation" ON public.quotation_menu_items AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM (public.event_quotations eq
     JOIN public.consultant_profiles cp ON ((cp.id = eq.consultant_id)))
  WHERE ((eq.id = quotation_menu_items.quotation_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Public can view menu items of public quotations" ON public.quotation_menu_items AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.event_quotations eq
  WHERE ((eq.id = quotation_menu_items.quotation_id) AND (eq.public_slug IS NOT NULL) AND (eq.status <> 'draft'::text)))));
CREATE POLICY "Access services through quotation" ON public.quotation_services AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM (public.event_quotations eq
     JOIN public.consultant_profiles cp ON ((cp.id = eq.consultant_id)))
  WHERE ((eq.id = quotation_services.quotation_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Public can view services of public quotations" ON public.quotation_services AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.event_quotations eq
  WHERE ((eq.id = quotation_services.quotation_id) AND (eq.public_slug IS NOT NULL) AND (eq.status <> 'draft'::text)))));
CREATE POLICY rms_owner_all ON public.rappi_menu_sync AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY rs_owner_all ON public.rappi_settlements AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY rss_owner_all ON public.rappi_store_status AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY rwe_owner_select ON public.rappi_webhook_events AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.aggregator_integrations ai
  WHERE ((ai.id = rappi_webhook_events.integration_id) AND (ai.user_id = auth.uid())))));
CREATE POLICY "Users can manage ingredients of their recipes" ON public.recipe_ingredients AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes
  WHERE ((recipes.id = recipe_ingredients.recipe_id) AND (recipes.user_id = auth.uid())))));
CREATE POLICY team_read ON public.recipe_ingredients AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.user_id IN ( SELECT public.team_owner_ids(ARRAY['recipes'::text, 'menus'::text, 'inventory'::text], 'read'::text) AS team_owner_ids))))));
CREATE POLICY "Authenticated can view recipe-menu links" ON public.recipe_menu_items AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Recipe owner can manage links" ON public.recipe_menu_items AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_menu_items.recipe_id) AND (r.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_menu_items.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can create nutrition for their recipes" ON public.recipe_nutrition AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_nutrition.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can delete their own recipe nutrition" ON public.recipe_nutrition AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_nutrition.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can update their own recipe nutrition" ON public.recipe_nutrition AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_nutrition.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can view their own recipe nutrition" ON public.recipe_nutrition AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_nutrition.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can create steps for their recipes" ON public.recipe_steps AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can delete their own recipe steps" ON public.recipe_steps AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can update their own recipe steps" ON public.recipe_steps AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can view their own recipe steps" ON public.recipe_steps AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can create sub-recipes for their recipes" ON public.recipe_sub_recipes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_sub_recipes.parent_recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can delete their own sub-recipes" ON public.recipe_sub_recipes AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_sub_recipes.parent_recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can update their own sub-recipes" ON public.recipe_sub_recipes AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_sub_recipes.parent_recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Users can view their own sub-recipes" ON public.recipe_sub_recipes AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_sub_recipes.parent_recipe_id) AND (r.user_id = auth.uid())))));
CREATE POLICY team_read ON public.recipe_sub_recipes AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_sub_recipes.parent_recipe_id) AND (r.user_id IN ( SELECT public.team_owner_ids(ARRAY['recipes'::text, 'menus'::text, 'inventory'::text], 'read'::text) AS team_owner_ids))))));
CREATE POLICY "Users can manage versions of their recipes" ON public.recipe_versions AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.recipes
  WHERE ((recipes.id = recipe_versions.recipe_id) AND (recipes.user_id = auth.uid())))));
CREATE POLICY "Users can manage their recipes" ON public.recipes AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.recipes AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{recipes,menus,inventory}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.recipes AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{recipes}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{recipes}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create their own brands" ON public.restaurant_brands AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own brands" ON public.restaurant_brands AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own brands" ON public.restaurant_brands AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own brands" ON public.restaurant_brands AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Platform admins can read all businesses" ON public.restaurant_businesses AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can create their own businesses" ON public.restaurant_businesses AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY "Users can delete their own businesses" ON public.restaurant_businesses AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = owner_id));
CREATE POLICY "Users can update their own businesses" ON public.restaurant_businesses AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = owner_id));
CREATE POLICY "Users can view their own businesses" ON public.restaurant_businesses AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = owner_id));
CREATE POLICY restaurant_businesses_consultant_select ON public.restaurant_businesses AS PERMISSIVE FOR SELECT TO authenticated
  USING (((owner_id = ( SELECT auth.uid() AS uid)) OR public.is_consultant_of(( SELECT auth.uid() AS uid), owner_id)));
CREATE POLICY team_member_read ON public.restaurant_businesses AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.restaurant_team_members m
  WHERE ((m.business_id = restaurant_businesses.id) AND (m.user_id = auth.uid()) AND (m.status = 'active'::public.team_member_status)))));
CREATE POLICY "Owners can manage their chains" ON public.restaurant_chains AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = owner_id));
CREATE POLICY "Owner or admin can create roles" ON public.restaurant_custom_roles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((public.is_business_owner(auth.uid(), business_id) OR public.is_team_admin(auth.uid(), business_id)));
CREATE POLICY "Owner or admin can delete custom roles" ON public.restaurant_custom_roles AS PERMISSIVE FOR DELETE TO authenticated
  USING (((is_system = false) AND (public.is_business_owner(auth.uid(), business_id) OR public.is_team_admin(auth.uid(), business_id))));
CREATE POLICY "Owner or admin can update non-system roles" ON public.restaurant_custom_roles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((public.is_business_owner(auth.uid(), business_id) OR public.is_team_admin(auth.uid(), business_id)))
  WITH CHECK ((public.is_business_owner(auth.uid(), business_id) OR public.is_team_admin(auth.uid(), business_id)));
CREATE POLICY "Team can view roles of their business" ON public.restaurant_custom_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.restaurant_team_members rtm
  WHERE ((rtm.business_id = restaurant_custom_roles.business_id) AND (rtm.user_id = auth.uid()) AND (rtm.status = 'active'::public.team_member_status))))));
CREATE POLICY owner_all ON public.restaurant_expenses AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY team_read ON public.restaurant_expenses AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.restaurant_expenses AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['finances'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Public can view published menus" ON public.restaurant_menus AS PERMISSIVE FOR SELECT TO public
  USING ((status = 'published'::public.menu_status));
CREATE POLICY "Users can create their own menus" ON public.restaurant_menus AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own menus" ON public.restaurant_menus AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own menus" ON public.restaurant_menus AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own menus" ON public.restaurant_menus AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.restaurant_menus AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{menus,pos,orders,recipes,kitchen_display}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.restaurant_menus AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{menus}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{menus}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can manage their orders" ON public.restaurant_orders AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.restaurant_orders AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{orders,pos,pos_reports,dashboard,finances,kitchen_display}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.restaurant_orders AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{orders,pos}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{orders,pos}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create their own tables" ON public.restaurant_tables AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own tables" ON public.restaurant_tables AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own tables" ON public.restaurant_tables AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own tables" ON public.restaurant_tables AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.restaurant_tables AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos,reservations,orders}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.restaurant_tables AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{pos}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Admins can manage non-admin members" ON public.restaurant_team_members AS PERMISSIVE FOR ALL TO public
  USING ((public.is_team_admin(auth.uid(), business_id) AND (role <> ALL (ARRAY['owner'::public.team_member_role, 'admin'::public.team_member_role]))))
  WITH CHECK ((public.is_team_admin(auth.uid(), business_id) AND (role <> ALL (ARRAY['owner'::public.team_member_role, 'admin'::public.team_member_role]))));
CREATE POLICY "Members can view own record" ON public.restaurant_team_members AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = auth.uid()));
CREATE POLICY "Owners can manage all team members" ON public.restaurant_team_members AS PERMISSIVE FOR ALL TO public
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));
CREATE POLICY "Team leads can view team members" ON public.restaurant_team_members AS PERMISSIVE FOR SELECT TO public
  USING (public.is_team_lead(auth.uid(), business_id));
CREATE POLICY "Anyone can view published websites" ON public.restaurant_websites AS PERMISSIVE FOR SELECT TO public
  USING ((is_published = true));
CREATE POLICY "Users can create their own website" ON public.restaurant_websites AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own website" ON public.restaurant_websites AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own website" ON public.restaurant_websites AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own website" ON public.restaurant_websites AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Consultants can manage zones" ON public.restaurant_zones AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.consultant_profiles cp
  WHERE ((cp.id = restaurant_zones.consultant_id) AND (cp.user_id = auth.uid())))));
CREATE POLICY "Anyone can view reviews" ON public.reviews AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own reviews" ON public.reviews AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own reviews" ON public.reviews AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their sales goals" ON public.sales_goals AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.sales_goals AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos_reports,dashboard,finances}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.sales_goals AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{pos_reports}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{pos_reports}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can manage their projections" ON public.sales_projections AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their sentiment reports" ON public.sentiment_reports AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Providers can update their bookings" ON public.service_bookings AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.service_providers
  WHERE ((service_providers.id = service_bookings.provider_id) AND (service_providers.owner_id = auth.uid())))));
CREATE POLICY "Providers can view their bookings" ON public.service_bookings AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.service_providers
  WHERE ((service_providers.id = service_bookings.provider_id) AND (service_providers.owner_id = auth.uid())))));
CREATE POLICY "Users can create service bookings" ON public.service_bookings AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own service bookings" ON public.service_bookings AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can create proposals" ON public.service_proposals AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Platform admins can read all proposals" ON public.service_proposals AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Proposal owners and request owners can view" ON public.service_proposals AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid() = user_id) OR (auth.uid() IN ( SELECT sr.user_id
   FROM public.service_requests sr
  WHERE (sr.id = service_proposals.request_id)))));
CREATE POLICY "Proposal owners can update" ON public.service_proposals AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can view active providers" ON public.service_providers AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));
CREATE POLICY "Authenticated users can create providers" ON public.service_providers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY "Owners can manage their own providers" ON public.service_providers AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = owner_id));
CREATE POLICY "Platform admins can read all providers" ON public.service_providers AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can update providers" ON public.service_providers AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Service providers are publicly readable" ON public.service_providers AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "Users can delete own providers" ON public.service_providers AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = owner_id));
CREATE POLICY "Users can update own providers" ON public.service_providers AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = owner_id));
CREATE POLICY "Anyone can view open requests" ON public.service_requests AS PERMISSIVE FOR SELECT TO public
  USING (((status = 'open'::text) OR (auth.uid() = user_id)));
CREATE POLICY "Authenticated users can create requests" ON public.service_requests AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owners can delete their requests" ON public.service_requests AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Owners can update their requests" ON public.service_requests AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Platform admins can read all service requests" ON public.service_requests AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can update service requests" ON public.service_requests AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can manage their own shift swap requests" ON public.shift_swap_requests AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own shift templates" ON public.shift_templates AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.shift_templates AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.shift_templates AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can manage their social accounts" ON public.social_accounts AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their social mentions" ON public.social_mentions AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own staff availability" ON public.staff_availability AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.staff_availability AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.staff_availability AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Team members can view own benefit assignments" ON public.staff_benefit_assignments AS PERMISSIVE FOR SELECT TO public
  USING ((staff_member_id IN ( SELECT staff_members.id
   FROM public.staff_members
  WHERE (staff_members.linked_user_id = auth.uid()))));
CREATE POLICY "Users manage own staff benefit assignments" ON public.staff_benefit_assignments AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Team members can view assigned benefits" ON public.staff_benefits AS PERMISSIVE FOR SELECT TO public
  USING ((id IN ( SELECT staff_benefit_assignments.benefit_id
   FROM public.staff_benefit_assignments
  WHERE (staff_benefit_assignments.staff_member_id IN ( SELECT staff_members.id
           FROM public.staff_members
          WHERE (staff_members.linked_user_id = auth.uid()))))));
CREATE POLICY "Users manage own staff benefits" ON public.staff_benefits AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own staff certifications" ON public.staff_certifications AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY staff_members_modify ON public.staff_members AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY staff_members_select ON public.staff_members AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_consultant_of(( SELECT auth.uid() AS uid), user_id)));
CREATE POLICY team_read ON public.staff_members AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent,dashboard,finances,pos}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.staff_members AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create their own staff shifts" ON public.staff_shifts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own staff shifts" ON public.staff_shifts AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own staff shifts" ON public.staff_shifts AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own staff shifts" ON public.staff_shifts AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.staff_shifts AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent,dashboard,finances}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.staff_shifts AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{talent}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Team members can update own training progress" ON public.staff_training_progress AS PERMISSIVE FOR UPDATE TO public
  USING ((staff_member_id IN ( SELECT staff_members.id
   FROM public.staff_members
  WHERE (staff_members.linked_user_id = auth.uid()))));
CREATE POLICY "Team members can view own training progress" ON public.staff_training_progress AS PERMISSIVE FOR SELECT TO public
  USING ((staff_member_id IN ( SELECT staff_members.id
   FROM public.staff_members
  WHERE (staff_members.linked_user_id = auth.uid()))));
CREATE POLICY "Users manage own staff training progress" ON public.staff_training_progress AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY team_read ON public.staffing_rules AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.staffing_rules AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create storage locations" ON public.storage_locations AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own storage locations" ON public.storage_locations AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own storage locations" ON public.storage_locations AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own storage locations" ON public.storage_locations AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own supplier analyses" ON public.supplier_analysis AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own supplier analyses" ON public.supplier_analysis AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own supplier analyses" ON public.supplier_analysis AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own supplier analyses" ON public.supplier_analysis AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users manage their own invoices" ON public.supplier_invoices AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY team_read ON public.supplier_invoices AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{invoices,finances,inventory}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.supplier_invoices AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{invoices}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{invoices}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can create their own suppliers" ON public.suppliers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own suppliers" ON public.suppliers AS PERMISSIVE FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own suppliers" ON public.suppliers AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own suppliers" ON public.suppliers AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.suppliers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory,suppliers,invoices}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.suppliers AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{inventory}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Users can manage their templates" ON public.support_templates AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their tickets" ON public.support_tickets AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their sustainability goals" ON public.sustainability_goals AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their sustainability reports" ON public.sustainability_reports AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Restaurant owners can manage their reservations" ON public.table_reservations AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.table_reservations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{reservations,pos,dashboard}'::text[], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.table_reservations AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids('{reservations}'::text[], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids('{reservations}'::text[], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Owners and admins read team permission history" ON public.team_permissions_history AS PERMISSIVE FOR SELECT TO public
  USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_business_owner(auth.uid(), business_id)));
CREATE POLICY "Users can manage messages of their tickets" ON public.ticket_messages AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = ticket_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));
CREATE POLICY "Users can manage their own time off requests" ON public.time_off_requests AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY team_read ON public.tip_allocations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text, 'finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.tip_allocations AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY team_read ON public.tip_periods AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text, 'finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.tip_periods AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY team_read ON public.tip_policies AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text, 'finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.tip_policies AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY team_read ON public.tip_role_weights AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text, 'finances'::text], 'read'::text) AS team_owner_ids)));
CREATE POLICY team_write ON public.tip_role_weights AS PERMISSIVE FOR ALL TO authenticated
  USING ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)))
  WITH CHECK ((user_id IN ( SELECT public.team_owner_ids(ARRAY['talent'::text], 'write'::text) AS team_owner_ids)));
CREATE POLICY "Anyone can view published courses" ON public.training_courses AS PERMISSIVE FOR SELECT TO public
  USING ((is_published = true));
CREATE POLICY "Instructors can manage their own courses" ON public.training_courses AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = instructor_id));
CREATE POLICY "Platform admins can read all courses" ON public.training_courses AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Team members can view assigned training programs" ON public.training_programs AS PERMISSIVE FOR SELECT TO public
  USING ((id IN ( SELECT staff_training_progress.training_program_id
   FROM public.staff_training_progress
  WHERE (staff_training_progress.staff_member_id IN ( SELECT staff_members.id
           FROM public.staff_members
          WHERE (staff_members.linked_user_id = auth.uid()))))));
CREATE POLICY "Users manage own training programs" ON public.training_programs AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Anyone authenticated can read conversions" ON public.unit_conversions AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id IS NULL) OR (user_id = auth.uid())));
CREATE POLICY "Users can delete their own conversions" ON public.unit_conversions AS PERMISSIVE FOR DELETE TO authenticated
  USING ((user_id = auth.uid()));
CREATE POLICY "Users can insert their own conversions" ON public.unit_conversions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update their own conversions" ON public.unit_conversions AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Admins can manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can delete roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can insert roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Platform admins can read all roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can create bookings" ON public.venue_bookings AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own bookings" ON public.venue_bookings AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Venue owners can update their bookings" ON public.venue_bookings AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM public.venues
  WHERE ((venues.id = venue_bookings.venue_id) AND (venues.owner_id = auth.uid())))));
CREATE POLICY "Venue owners can view their bookings" ON public.venue_bookings AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM public.venues
  WHERE ((venues.id = venue_bookings.venue_id) AND (venues.owner_id = auth.uid())))));
CREATE POLICY "Anyone can view active venues" ON public.venues AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));
CREATE POLICY "Owners can manage their own venues" ON public.venues AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = owner_id));
CREATE POLICY "Users can manage their virtual brands" ON public.virtual_brands AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can view active templates" ON public.website_templates AS PERMISSIVE FOR SELECT TO public
  USING ((is_active = true));

-- Permisos
REVOKE ALL ON TABLE public._demo_customers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public._demo_menu_weights FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.aggregator_integrations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.aggregator_orders FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.ai_usage_daily FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.allergens FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.applicant_profiles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.audit_log FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.benefit_requests FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.brand_assets FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.brand_menus FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.business_opening_projects FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.candidate_experience FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.candidate_profiles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.carbon_footprint_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.chain_locations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.chain_master_menus FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.compliance_checklists FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.compliance_records FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.consultant_clients FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.consultant_impersonation_log FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.consultant_profiles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.consultant_reports FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.consulting_invoices FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.copilot_alerts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.copilot_conversations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.copilot_messages FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.course_certificates FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.course_enrollments FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.course_lessons FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.course_reviews FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.customer_feedback FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.daily_briefings FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.daily_sales FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.debug_events FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.delivery_zones FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.demand_events FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.event_categories FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.event_quotations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.events FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.feedback_campaigns FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.finance_accounts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.finance_settings FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.finance_settlements FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.food_waste_logs FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.growth_preregistrations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.industry_benchmarks FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_below_par FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_count_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_counts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_deductions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_expiring_soon FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_item_suppliers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_movements FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_price_history FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_stock_by_location FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_suppliers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_transfers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.inventory_waste FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.job_applications FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.job_saved FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.jobs FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.kitchen_production_queue FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.knowledge_chunks FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.knowledge_sources FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.learning_track_courses FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.learning_tracks FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.lesson_progress FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_achievements FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_campaigns FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_customer_achievements FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_customers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_points_transactions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_rewards FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_rewards_catalog FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.loyalty_tiers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.marketing_content FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.maturity_action_tracking FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.maturity_diagnoses FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.measurement_units FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_allergens FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_categories FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_item_cooccurrence FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_item_modifier_links FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_item_modifiers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_items_with_costs FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_modifier_options FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_templates FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.notification_preferences FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.notifications_log FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.opening_analysis_runs FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.opening_checklist_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.opening_phase_analyses FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.order_status_history FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.payment_gateway_credentials FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.payment_webhook_events FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_audit_log FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_cash_movements FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_discounts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_fraud_signals FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_payment_methods FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_pin_attempts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.pos_pin_attempts_id_seq FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_session_closures FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_sessions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_supervisor_authorizations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_transactions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pos_user_activity FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.pre_opening_tasks FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.provider_portfolio FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.provider_reviews FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.purchase_order_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.purchase_orders FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.push_subscriptions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.quotation_gallery FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.quotation_menu_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.quotation_services FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.rappi_menu_sync FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.rappi_settlements FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.rappi_store_status FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.rappi_webhook_events FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.recipe_ingredients FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.recipe_menu_items FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.recipe_nutrition FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.recipe_steps FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.recipe_sub_recipes FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.recipe_versions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.recipes FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_brands FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_businesses FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_chains FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_custom_roles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_expenses FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_menus FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_orders FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.restaurant_orders_order_number_seq FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_tables FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_team_members FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_websites FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.restaurant_zones FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.reviews FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sales_goals FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sales_projections FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sentiment_reports FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.service_bookings FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.service_proposals FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.service_providers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.service_requests FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.shift_swap_requests FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.shift_templates FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.social_accounts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.social_mentions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staff_availability FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staff_benefit_assignments FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staff_benefits FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staff_certifications FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staff_members FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staff_shifts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staff_training_progress FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staffing_rules FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.storage_locations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.supplier_analysis FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.supplier_invoices FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.suppliers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.support_templates FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.support_tickets FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.support_tickets_ticket_number_seq FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sustainability_goals FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sustainability_reports FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.table_reservations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.team_permissions_history FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.ticket_messages FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.time_off_requests FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.tip_allocations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.tip_periods FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.tip_policies FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.tip_role_weights FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.training_courses FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.training_programs FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.unified_orders_view FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.unit_conversions FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.venue_bookings FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.venues FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.virtual_brands FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.website_templates FROM PUBLIC, anon, authenticated, service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public._demo_customers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public._demo_customers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public._demo_customers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public._demo_menu_weights TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public._demo_menu_weights TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public._demo_menu_weights TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.aggregator_integrations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.aggregator_integrations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.aggregator_integrations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.aggregator_orders TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.aggregator_orders TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.aggregator_orders TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.ai_usage_daily TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.ai_usage_daily TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.ai_usage_daily TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.allergens TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.allergens TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.allergens TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.applicant_profiles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.applicant_profiles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.applicant_profiles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.audit_log TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.audit_log TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.audit_log TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.benefit_requests TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.benefit_requests TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.benefit_requests TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.brand_assets TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.brand_assets TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.brand_assets TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.brand_menus TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.brand_menus TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.brand_menus TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.business_opening_projects TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.business_opening_projects TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.business_opening_projects TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.candidate_experience TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.candidate_experience TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.candidate_experience TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.candidate_profiles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.candidate_profiles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.candidate_profiles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.carbon_footprint_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.carbon_footprint_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.carbon_footprint_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.chain_locations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.chain_locations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.chain_locations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.chain_master_menus TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.chain_master_menus TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.chain_master_menus TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.compliance_checklists TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.compliance_checklists TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.compliance_checklists TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.compliance_records TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.compliance_records TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.compliance_records TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_clients TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_clients TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_clients TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_impersonation_log TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_impersonation_log TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_impersonation_log TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_profiles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_profiles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_profiles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_reports TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_reports TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consultant_reports TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consulting_invoices TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consulting_invoices TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.consulting_invoices TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_alerts TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_alerts TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_alerts TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_conversations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_conversations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_conversations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_messages TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_messages TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.copilot_messages TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_certificates TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_certificates TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_certificates TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_enrollments TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_enrollments TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_enrollments TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_lessons TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_lessons TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_lessons TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_reviews TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_reviews TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.course_reviews TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_feedback TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_feedback TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_feedback TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.daily_briefings TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.daily_briefings TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.daily_briefings TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.daily_sales TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.daily_sales TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.daily_sales TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.debug_events TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.debug_events TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.debug_events TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_zones TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_zones TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_zones TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.demand_events TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.demand_events TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.demand_events TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.event_categories TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.event_categories TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.event_categories TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.event_quotations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.event_quotations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.event_quotations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.events TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.events TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.events TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.feedback_campaigns TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.feedback_campaigns TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.feedback_campaigns TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_accounts TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_accounts TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_accounts TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_settings TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_settings TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_settings TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_settlements TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_settlements TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.finance_settlements TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.food_waste_logs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.food_waste_logs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.food_waste_logs TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.growth_preregistrations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.growth_preregistrations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.growth_preregistrations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.industry_benchmarks TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.industry_benchmarks TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.industry_benchmarks TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_below_par TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_below_par TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_below_par TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_count_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_count_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_count_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_counts TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_counts TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_counts TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_deductions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_deductions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_deductions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_expiring_soon TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_expiring_soon TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_expiring_soon TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_item_suppliers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_item_suppliers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_item_suppliers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_movements TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_movements TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_movements TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_price_history TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_price_history TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_price_history TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_stock_by_location TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_stock_by_location TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_stock_by_location TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_suppliers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_suppliers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_suppliers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_transfers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_transfers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_transfers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_waste TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_waste TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.inventory_waste TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.job_applications TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.job_applications TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.job_applications TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.job_saved TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.job_saved TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.job_saved TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.jobs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.jobs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.jobs TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.kitchen_production_queue TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.kitchen_production_queue TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.kitchen_production_queue TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.knowledge_chunks TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.knowledge_chunks TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.knowledge_chunks TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.knowledge_sources TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.knowledge_sources TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.knowledge_sources TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.learning_track_courses TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.learning_track_courses TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.learning_track_courses TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.learning_tracks TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.learning_tracks TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.learning_tracks TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.lesson_progress TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.lesson_progress TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.lesson_progress TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_achievements TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_achievements TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_achievements TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_campaigns TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_campaigns TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_campaigns TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_customer_achievements TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_customer_achievements TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_customer_achievements TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_customers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_customers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_customers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_points_transactions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_points_transactions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_points_transactions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards_catalog TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards_catalog TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards_catalog TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_tiers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_tiers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_tiers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.marketing_content TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.marketing_content TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.marketing_content TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.maturity_action_tracking TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.maturity_action_tracking TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.maturity_action_tracking TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.maturity_diagnoses TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.maturity_diagnoses TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.maturity_diagnoses TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.measurement_units TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.measurement_units TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.measurement_units TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_allergens TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_allergens TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_allergens TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_categories TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_categories TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_categories TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_cooccurrence TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_cooccurrence TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_cooccurrence TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_modifier_links TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_modifier_links TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_modifier_links TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_modifiers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_modifiers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_item_modifiers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items_with_costs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items_with_costs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items_with_costs TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_modifier_options TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_modifier_options TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_modifier_options TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_templates TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_templates TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_templates TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notification_preferences TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notification_preferences TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notification_preferences TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notifications_log TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notifications_log TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notifications_log TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_analysis_runs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_analysis_runs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_analysis_runs TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_checklist_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_checklist_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_checklist_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_phase_analyses TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_phase_analyses TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.opening_phase_analyses TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_status_history TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_status_history TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_status_history TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.payment_gateway_credentials TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.payment_gateway_credentials TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.payment_gateway_credentials TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.payment_webhook_events TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.payment_webhook_events TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.payment_webhook_events TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_audit_log TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_audit_log TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_audit_log TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_cash_movements TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_cash_movements TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_cash_movements TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_discounts TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_discounts TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_discounts TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_fraud_signals TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_fraud_signals TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_fraud_signals TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_payment_methods TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_payment_methods TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_payment_methods TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_pin_attempts TO service_role;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.pos_pin_attempts_id_seq TO anon;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.pos_pin_attempts_id_seq TO authenticated;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.pos_pin_attempts_id_seq TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_session_closures TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_session_closures TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_session_closures TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_sessions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_sessions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_sessions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_supervisor_authorizations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_supervisor_authorizations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_supervisor_authorizations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_transactions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_transactions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_transactions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_user_activity TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_user_activity TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pos_user_activity TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pre_opening_tasks TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pre_opening_tasks TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pre_opening_tasks TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.provider_portfolio TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.provider_portfolio TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.provider_portfolio TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.provider_reviews TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.provider_reviews TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.provider_reviews TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.purchase_order_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.purchase_order_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.purchase_order_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.purchase_orders TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.purchase_orders TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.purchase_orders TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.push_subscriptions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.push_subscriptions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.push_subscriptions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_gallery TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_gallery TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_gallery TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_menu_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_menu_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_menu_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_services TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_services TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.quotation_services TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_menu_sync TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_menu_sync TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_menu_sync TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_settlements TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_settlements TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_settlements TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_store_status TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_store_status TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_store_status TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_webhook_events TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_webhook_events TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.rappi_webhook_events TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_ingredients TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_ingredients TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_ingredients TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_menu_items TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_menu_items TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_menu_items TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_nutrition TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_nutrition TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_nutrition TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_steps TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_steps TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_steps TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_sub_recipes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_sub_recipes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_sub_recipes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_versions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_versions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipe_versions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.recipes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_brands TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_brands TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_brands TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_businesses TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_businesses TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_businesses TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_chains TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_chains TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_chains TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_custom_roles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_custom_roles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_custom_roles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_expenses TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_expenses TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_expenses TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_menus TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_menus TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_menus TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_orders TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_orders TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_orders TO service_role;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.restaurant_orders_order_number_seq TO anon;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.restaurant_orders_order_number_seq TO authenticated;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.restaurant_orders_order_number_seq TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_tables TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_tables TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_tables TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_team_members TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_team_members TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_team_members TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_websites TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_websites TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_websites TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_zones TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_zones TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.restaurant_zones TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.reviews TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.reviews TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.reviews TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sales_goals TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sales_goals TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sales_goals TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sales_projections TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sales_projections TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sales_projections TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sentiment_reports TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sentiment_reports TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sentiment_reports TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_bookings TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_bookings TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_bookings TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_proposals TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_proposals TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_proposals TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_providers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_providers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_providers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_requests TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_requests TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.service_requests TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.shift_swap_requests TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.shift_swap_requests TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.shift_swap_requests TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.shift_templates TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.shift_templates TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.shift_templates TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.social_accounts TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.social_accounts TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.social_accounts TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.social_mentions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.social_mentions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.social_mentions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_availability TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_availability TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_availability TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_benefit_assignments TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_benefit_assignments TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_benefit_assignments TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_benefits TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_benefits TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_benefits TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_certifications TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_certifications TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_certifications TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_members TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_members TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_members TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_shifts TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_shifts TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_shifts TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_training_progress TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_training_progress TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staff_training_progress TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staffing_rules TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staffing_rules TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.staffing_rules TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.storage_locations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.storage_locations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.storage_locations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.supplier_analysis TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.supplier_analysis TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.supplier_analysis TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.supplier_invoices TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.supplier_invoices TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.supplier_invoices TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.suppliers TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.suppliers TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.suppliers TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_templates TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_templates TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_templates TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_tickets TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_tickets TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_tickets TO service_role;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.support_tickets_ticket_number_seq TO anon;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.support_tickets_ticket_number_seq TO authenticated;
GRANT SELECT, UPDATE, USAGE ON SEQUENCE public.support_tickets_ticket_number_seq TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustainability_goals TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustainability_goals TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustainability_goals TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustainability_reports TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustainability_reports TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.sustainability_reports TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.table_reservations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.table_reservations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.table_reservations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.team_permissions_history TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.team_permissions_history TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.team_permissions_history TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.ticket_messages TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.ticket_messages TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.ticket_messages TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.time_off_requests TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.time_off_requests TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.time_off_requests TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_allocations TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_allocations TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_allocations TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_periods TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_periods TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_periods TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_policies TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_policies TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_policies TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_role_weights TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_role_weights TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tip_role_weights TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.training_courses TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.training_courses TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.training_courses TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.training_programs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.training_programs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.training_programs TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.unified_orders_view TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.unified_orders_view TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.unified_orders_view TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.unit_conversions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.unit_conversions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.unit_conversions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.user_roles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.user_roles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.user_roles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.venue_bookings TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.venue_bookings TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.venue_bookings TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.venues TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.venues TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.venues TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.virtual_brands TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.virtual_brands TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.virtual_brands TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.website_templates TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.website_templates TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.website_templates TO service_role;
REVOKE ALL ON FUNCTION public._demo_expected_orders(p_day date, p_hr integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._demo_expected_orders(p_day date, p_hr integer) TO service_role;
REVOKE ALL ON FUNCTION public._demo_generate_orders(p_from timestamp with time zone, p_to timestamp with time zone) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._demo_generate_orders(p_from timestamp with time zone, p_to timestamp with time zone) TO service_role;
REVOKE ALL ON FUNCTION public._demo_refresh_daily_close(p_from date, p_to date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._demo_refresh_daily_close(p_from date, p_to date) TO service_role;
REVOKE ALL ON FUNCTION public._demo_seed_finance() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._demo_seed_finance() TO service_role;
REVOKE ALL ON FUNCTION public._demo_seed_marketing() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._demo_seed_marketing() TO service_role;
REVOKE ALL ON FUNCTION public._demo_upsert_auth_user(_id uuid, _email text, _name text, _type text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._demo_upsert_auth_user(_id uuid, _email text, _name text, _type text) TO service_role;
REVOKE ALL ON FUNCTION public._mask_email(p text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._mask_email(p text) TO authenticated;
GRANT EXECUTE ON FUNCTION public._mask_email(p text) TO anon;
GRANT EXECUTE ON FUNCTION public._mask_email(p text) TO service_role;
GRANT EXECUTE ON FUNCTION public._mask_email(p text) TO PUBLIC;
REVOKE ALL ON FUNCTION public._mask_phone(p text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._mask_phone(p text) TO authenticated;
GRANT EXECUTE ON FUNCTION public._mask_phone(p text) TO anon;
GRANT EXECUTE ON FUNCTION public._mask_phone(p text) TO service_role;
GRANT EXECUTE ON FUNCTION public._mask_phone(p text) TO PUBLIC;
REVOKE ALL ON FUNCTION public._pos_request_ip() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._pos_request_ip() TO authenticated;
GRANT EXECUTE ON FUNCTION public._pos_request_ip() TO service_role;
REVOKE ALL ON FUNCTION public.ai_usage_bump(p_user uuid, p_fn text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_usage_bump(p_user uuid, p_fn text) TO service_role;
REVOKE ALL ON FUNCTION public.assign_team_owner_user_id() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_team_owner_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_team_owner_user_id() TO anon;
GRANT EXECUTE ON FUNCTION public.assign_team_owner_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_team_owner_user_id() TO PUBLIC;
REVOKE ALL ON FUNCTION public.award_loyalty_points(p_customer_id uuid, p_points integer, p_source text, p_description text, p_source_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points(p_customer_id uuid, p_points integer, p_source text, p_description text, p_source_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points(p_customer_id uuid, p_points integer, p_source text, p_description text, p_source_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.calculate_menu_item_scores(p_user_id uuid, p_days integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_menu_item_scores(p_user_id uuid, p_days integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_menu_item_scores(p_user_id uuid, p_days integer) TO service_role;
REVOKE ALL ON FUNCTION public.calculate_profile_completeness() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_profile_completeness() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_profile_completeness() TO anon;
GRANT EXECUTE ON FUNCTION public.calculate_profile_completeness() TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_profile_completeness() TO PUBLIC;
REVOKE ALL ON FUNCTION public.check_course_completion_certificate() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_course_completion_certificate() TO service_role;
REVOKE ALL ON FUNCTION public.claim_consultant_client(p_invitation_token uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_consultant_client(p_invitation_token uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_consultant_client(p_invitation_token uuid) TO service_role;
REVOKE ALL ON FUNCTION public.claim_team_invitation(p_token uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_team_invitation(p_token uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_team_invitation(p_token uuid) TO service_role;
REVOKE ALL ON FUNCTION public.close_tip_period(p_period_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.close_tip_period(p_period_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_tip_period(p_period_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.compute_tip_period(p_period_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compute_tip_period(p_period_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_tip_period(p_period_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.convert_unit(p_amount numeric, p_from_unit_id uuid, p_to_unit_id uuid, p_ingredient_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.convert_unit(p_amount numeric, p_from_unit_id uuid, p_to_unit_id uuid, p_ingredient_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_unit(p_amount numeric, p_from_unit_id uuid, p_to_unit_id uuid, p_ingredient_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_items jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_items jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_items jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.demo_owner_id() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.demo_owner_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.demo_owner_id() TO anon;
GRANT EXECUTE ON FUNCTION public.demo_owner_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.demo_owner_id() TO PUBLIC;
REVOKE ALL ON FUNCTION public.demo_tick() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.demo_tick() TO service_role;
REVOKE ALL ON FUNCTION public.ensure_user_id_for_rls() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_id_for_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_id_for_rls() TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_id_for_rls() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_id_for_rls() TO PUBLIC;
REVOKE ALL ON FUNCTION public.finance_cash_flow_projection(p_owner uuid, p_weeks integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finance_cash_flow_projection(p_owner uuid, p_weeks integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finance_cash_flow_projection(p_owner uuid, p_weeks integer) TO service_role;
REVOKE ALL ON FUNCTION public.finance_materialize_recurring(p_month date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finance_materialize_recurring(p_month date) TO service_role;
REVOKE ALL ON FUNCTION public.finance_pay_group(p_method text, p_channel text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finance_pay_group(p_method text, p_channel text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finance_pay_group(p_method text, p_channel text) TO anon;
GRANT EXECUTE ON FUNCTION public.finance_pay_group(p_method text, p_channel text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finance_pay_group(p_method text, p_channel text) TO PUBLIC;
REVOKE ALL ON FUNCTION public.finance_reconciliation(p_owner uuid, p_from date, p_to date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finance_reconciliation(p_owner uuid, p_from date, p_to date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finance_reconciliation(p_owner uuid, p_from date, p_to date) TO service_role;
REVOKE ALL ON FUNCTION public.generate_loyalty_code() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_code() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_loyalty_code() TO PUBLIC;
REVOKE ALL ON FUNCTION public.generate_menu_slug(menu_name text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_menu_slug(menu_name text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_menu_slug(menu_name text) TO service_role;
REVOKE ALL ON FUNCTION public.generate_po_number() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_po_number() TO service_role;
REVOKE ALL ON FUNCTION public.generate_quotation_slug() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_quotation_slug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_quotation_slug() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_quotation_slug() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_quotation_slug() TO PUBLIC;
REVOKE ALL ON FUNCTION public.generate_redemption_code() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_redemption_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_redemption_code() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_redemption_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_redemption_code() TO PUBLIC;
REVOKE ALL ON FUNCTION public.generate_reservation_confirmation_code() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_reservation_confirmation_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_reservation_confirmation_code() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_reservation_confirmation_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_reservation_confirmation_code() TO PUBLIC;
REVOKE ALL ON FUNCTION public.generate_schedule_proposal(p_owner uuid, p_week_start date, p_apply boolean) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_schedule_proposal(p_owner uuid, p_week_start date, p_apply boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_schedule_proposal(p_owner uuid, p_week_start date, p_apply boolean) TO service_role;
REVOKE ALL ON FUNCTION public.get_aggregated_daily_sales(p_user_id uuid, p_date date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_aggregated_daily_sales(p_user_id uuid, p_date date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_aggregated_daily_sales(p_user_id uuid, p_date date) TO service_role;
REVOKE ALL ON FUNCTION public.get_customer_profile(p_email text, p_user_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_customer_profile(p_email text, p_user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_profile(p_email text, p_user_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role) TO anon;
GRANT EXECUTE ON FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role) TO PUBLIC;
REVOKE ALL ON FUNCTION public.get_platform_stats() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO service_role;
REVOKE ALL ON FUNCTION public.get_user_business_id(_user_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_business_id(_user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_business_id(_user_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.has_module_access(_user_id uuid, _business_id uuid, _module text, _level text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_module_access(_user_id uuid, _business_id uuid, _module text, _level text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_module_access(_user_id uuid, _business_id uuid, _module text, _level text) TO service_role;
REVOKE ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;
REVOKE ALL ON FUNCTION public.has_team_role(_user_id uuid, _business_id uuid, _role public.team_member_role) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_team_role(_user_id uuid, _business_id uuid, _role public.team_member_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_team_role(_user_id uuid, _business_id uuid, _role public.team_member_role) TO service_role;
REVOKE ALL ON FUNCTION public.increment_campaign_responses(campaign_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_campaign_responses(campaign_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_campaign_responses(campaign_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.increment_job_applications() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_job_applications() TO service_role;
REVOKE ALL ON FUNCTION public.increment_job_views(job_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_job_views(job_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_job_views(job_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_consultant_of(_consultant_user uuid, _client_user uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_consultant_of(_consultant_user uuid, _client_user uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_consultant_of(_consultant_user uuid, _client_user uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_demo_user(_uid uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_demo_user(_uid uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_demo_user(_uid uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_demo_user(_uid uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_demo_user(_uid uuid) TO PUBLIC;
REVOKE ALL ON FUNCTION public.is_team_admin(_user_id uuid, _business_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_admin(_user_id uuid, _business_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_admin(_user_id uuid, _business_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_team_lead(_user_id uuid, _business_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_lead(_user_id uuid, _business_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_lead(_user_id uuid, _business_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.log_consultant_impersonation_end(p_log_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_consultant_impersonation_end(p_log_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_consultant_impersonation_end(p_log_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.log_consultant_impersonation_start(p_client_user_id uuid, p_client_business_id uuid, p_user_agent text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_consultant_impersonation_start(p_client_user_id uuid, p_client_business_id uuid, p_user_agent text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_consultant_impersonation_start(p_client_user_id uuid, p_client_business_id uuid, p_user_agent text) TO service_role;
REVOKE ALL ON FUNCTION public.log_order_status_change() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_order_status_change() TO service_role;
REVOKE ALL ON FUNCTION public.log_team_member_change() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_team_member_change() TO service_role;
REVOKE ALL ON FUNCTION public.marketing_menu_opportunities(p_owner uuid, p_days integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.marketing_menu_opportunities(p_owner uuid, p_days integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_menu_opportunities(p_owner uuid, p_days integer) TO service_role;
REVOKE ALL ON FUNCTION public.match_knowledge(query_embedding public.vector, match_user_id uuid, match_count integer, min_similarity double precision) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_knowledge(query_embedding public.vector, match_user_id uuid, match_count integer, min_similarity double precision) TO service_role;
REVOKE ALL ON FUNCTION public.menu_out_of_stock_ids(p_owner uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.menu_out_of_stock_ids(p_owner uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.menu_out_of_stock_ids(p_owner uuid) TO service_role;
REVOKE ALL ON FUNCTION public.pos_audit_immutable() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_audit_immutable() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_audit_immutable() TO anon;
GRANT EXECUTE ON FUNCTION public.pos_audit_immutable() TO service_role;
GRANT EXECUTE ON FUNCTION public.pos_audit_immutable() TO PUBLIC;
REVOKE ALL ON FUNCTION public.pos_audit_order_change() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_audit_order_change() TO service_role;
REVOKE ALL ON FUNCTION public.pos_audit_session() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_audit_session() TO service_role;
REVOKE ALL ON FUNCTION public.pos_audit_transaction() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_audit_transaction() TO service_role;
REVOKE ALL ON FUNCTION public.pos_close_session(p_session_id uuid, p_actual_cash numeric, p_notes text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_close_session(p_session_id uuid, p_actual_cash numeric, p_notes text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_close_session(p_session_id uuid, p_actual_cash numeric, p_notes text) TO service_role;
REVOKE ALL ON FUNCTION public.pos_log_audit(p_user_id uuid, p_entity text, p_action text, p_entity_id uuid, p_actor_staff_id uuid, p_actor_name text, p_actor_role text, p_supervisor_staff_id uuid, p_supervisor_name text, p_authorization_id uuid, p_session_id uuid, p_terminal_id text, p_reason text, p_amount numeric, p_before jsonb, p_after jsonb, p_metadata jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_log_audit(p_user_id uuid, p_entity text, p_action text, p_entity_id uuid, p_actor_staff_id uuid, p_actor_name text, p_actor_role text, p_supervisor_staff_id uuid, p_supervisor_name text, p_authorization_id uuid, p_session_id uuid, p_terminal_id text, p_reason text, p_amount numeric, p_before jsonb, p_after jsonb, p_metadata jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_log_audit(p_user_id uuid, p_entity text, p_action text, p_entity_id uuid, p_actor_staff_id uuid, p_actor_name text, p_actor_role text, p_supervisor_staff_id uuid, p_supervisor_name text, p_authorization_id uuid, p_session_id uuid, p_terminal_id text, p_reason text, p_amount numeric, p_before jsonb, p_after jsonb, p_metadata jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.pos_pin_guard(p_owner uuid, p_kind text, p_ip text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_pin_guard(p_owner uuid, p_kind text, p_ip text) TO service_role;
REVOKE ALL ON FUNCTION public.pos_pin_record(p_owner uuid, p_kind text, p_ip text, p_ok boolean) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_pin_record(p_owner uuid, p_kind text, p_ip text, p_ok boolean) TO service_role;
REVOKE ALL ON FUNCTION public.pos_verify_supervisor_pin(p_user_id uuid, p_pin text, p_reason_code text, p_reason_text text, p_amount numeric, p_entity text, p_entity_id uuid, p_terminal_id text, p_requester_staff_id uuid, p_requester_name text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pos_verify_supervisor_pin(p_user_id uuid, p_pin text, p_reason_code text, p_reason_text text, p_amount numeric, p_entity text, p_entity_id uuid, p_terminal_id text, p_requester_staff_id uuid, p_requester_name text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_verify_supervisor_pin(p_user_id uuid, p_pin text, p_reason_code text, p_reason_text text, p_amount numeric, p_entity text, p_entity_id uuid, p_terminal_id text, p_requester_staff_id uuid, p_requester_name text) TO service_role;
REVOKE ALL ON FUNCTION public.process_order_inventory_deduction(p_order_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_order_inventory_deduction(p_order_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.public_create_reservation(p_slug text, p_customer_name text, p_customer_phone text, p_party_size integer, p_reservation_date date, p_reservation_time time without time zone, p_customer_email text, p_special_requests text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_create_reservation(p_slug text, p_customer_name text, p_customer_phone text, p_party_size integer, p_reservation_date date, p_reservation_time time without time zone, p_customer_email text, p_special_requests text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_create_reservation(p_slug text, p_customer_name text, p_customer_phone text, p_party_size integer, p_reservation_date date, p_reservation_time time without time zone, p_customer_email text, p_special_requests text) TO anon;
GRANT EXECUTE ON FUNCTION public.public_create_reservation(p_slug text, p_customer_name text, p_customer_phone text, p_party_size integer, p_reservation_date date, p_reservation_time time without time zone, p_customer_email text, p_special_requests text) TO service_role;
REVOKE ALL ON FUNCTION public.public_feedback_after_submit(p_feedback_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_feedback_after_submit(p_feedback_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_feedback_after_submit(p_feedback_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_feedback_after_submit(p_feedback_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.public_feedback_after_submit(p_feedback_id uuid) TO PUBLIC;
REVOKE ALL ON FUNCTION public.public_loyalty_find(p_value text, p_type text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_loyalty_find(p_value text, p_type text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_loyalty_find(p_value text, p_type text) TO anon;
GRANT EXECUTE ON FUNCTION public.public_loyalty_find(p_value text, p_type text) TO service_role;
GRANT EXECUTE ON FUNCTION public.public_loyalty_find(p_value text, p_type text) TO PUBLIC;
REVOKE ALL ON FUNCTION public.public_loyalty_profile(p_code text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_loyalty_profile(p_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_loyalty_profile(p_code text) TO anon;
GRANT EXECUTE ON FUNCTION public.public_loyalty_profile(p_code text) TO service_role;
GRANT EXECUTE ON FUNCTION public.public_loyalty_profile(p_code text) TO PUBLIC;
REVOKE ALL ON FUNCTION public.public_loyalty_redeem(p_code text, p_catalog_item_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_loyalty_redeem(p_code text, p_catalog_item_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_loyalty_redeem(p_code text, p_catalog_item_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_loyalty_redeem(p_code text, p_catalog_item_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.public_loyalty_redeem(p_code text, p_catalog_item_id uuid) TO PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_recipe_cost(p_recipe_id uuid, p_depth integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_recipe_cost(p_recipe_id uuid, p_depth integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_recipe_cost(p_recipe_id uuid, p_depth integer) TO service_role;
REVOKE ALL ON FUNCTION public.recompute_loyalty_customer_for(_user_id uuid, _email text, _phone text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recompute_loyalty_customer_for(_user_id uuid, _email text, _phone text) TO service_role;
REVOKE ALL ON FUNCTION public.record_inventory_movement() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_inventory_movement() TO service_role;
REVOKE ALL ON FUNCTION public.record_price_change() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_price_change() TO service_role;
REVOKE ALL ON FUNCTION public.redeem_loyalty_reward(p_customer_id uuid, p_catalog_item_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(p_customer_id uuid, p_catalog_item_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(p_customer_id uuid, p_catalog_item_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.reverse_order_inventory_deduction(p_order_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reverse_order_inventory_deduction(p_order_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.seed_demo_restaurant() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seed_demo_restaurant() TO service_role;
REVOKE ALL ON FUNCTION public.seed_platform_admin(p_email text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seed_platform_admin(p_email text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_platform_admin(p_email text) TO service_role;
REVOKE ALL ON FUNCTION public.seed_system_roles_for_business(_business_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seed_system_roles_for_business(_business_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.set_staff_pin(_staff_id uuid, _pin text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_staff_pin(_staff_id uuid, _pin text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_staff_pin(_staff_id uuid, _pin text) TO service_role;
REVOKE ALL ON FUNCTION public.shift_net_hours(_start time without time zone, _end time without time zone, _break integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.shift_net_hours(_start time without time zone, _end time without time zone, _break integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shift_net_hours(_start time without time zone, _end time without time zone, _break integer) TO anon;
GRANT EXECUTE ON FUNCTION public.shift_net_hours(_start time without time zone, _end time without time zone, _break integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.shift_net_hours(_start time without time zone, _end time without time zone, _break integer) TO PUBLIC;
REVOKE ALL ON FUNCTION public.sync_menu_item_to_recipe() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_menu_item_to_recipe() TO service_role;
REVOKE ALL ON FUNCTION public.sync_recipe_to_menu_item() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_recipe_to_menu_item() TO service_role;
REVOKE ALL ON FUNCTION public.sync_restaurant_name_to_loyalty_customer() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_restaurant_name_to_loyalty_customer() TO service_role;
REVOKE ALL ON FUNCTION public.team_can(_owner uuid, _modules text[], _level text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.team_can(_owner uuid, _modules text[], _level text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_can(_owner uuid, _modules text[], _level text) TO service_role;
REVOKE ALL ON FUNCTION public.team_member_owner_id(_uid uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.team_member_owner_id(_uid uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_member_owner_id(_uid uuid) TO service_role;
REVOKE ALL ON FUNCTION public.team_owner_ids(_modules text[], _level text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.team_owner_ids(_modules text[], _level text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_owner_ids(_modules text[], _level text) TO service_role;
REVOKE ALL ON FUNCTION public.tg_seed_roles_for_new_business() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_seed_roles_for_new_business() TO service_role;
REVOKE ALL ON FUNCTION public.tg_tip_allocations_locked() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_tip_allocations_locked() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tg_tip_allocations_locked() TO anon;
GRANT EXECUTE ON FUNCTION public.tg_tip_allocations_locked() TO service_role;
GRANT EXECUTE ON FUNCTION public.tg_tip_allocations_locked() TO PUBLIC;
REVOKE ALL ON FUNCTION public.trg_order_inventory_deduction() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trg_order_inventory_deduction() TO service_role;
REVOKE ALL ON FUNCTION public.trg_sync_loyalty_from_orders() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trg_sync_loyalty_from_orders() TO service_role;
REVOKE ALL ON FUNCTION public.trigger_update_menu_scores_on_order() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trigger_update_menu_scores_on_order() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_update_menu_scores_on_order() TO anon;
GRANT EXECUTE ON FUNCTION public.trigger_update_menu_scores_on_order() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_update_menu_scores_on_order() TO PUBLIC;
REVOKE ALL ON FUNCTION public.update_course_avg_rating() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_course_avg_rating() TO service_role;
REVOKE ALL ON FUNCTION public.update_course_lesson_stats() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_course_lesson_stats() TO service_role;
REVOKE ALL ON FUNCTION public.update_customer_tier() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_customer_tier() TO service_role;
REVOKE ALL ON FUNCTION public.update_loyalty_updated_at() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_loyalty_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_loyalty_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.update_loyalty_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_loyalty_updated_at() TO PUBLIC;
REVOKE ALL ON FUNCTION public.update_provider_review_stats() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_provider_review_stats() TO service_role;
REVOKE ALL ON FUNCTION public.update_request_proposals_count() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_request_proposals_count() TO service_role;
REVOKE ALL ON FUNCTION public.update_track_course_count() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_track_course_count() TO service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO PUBLIC;
REVOKE ALL ON FUNCTION public.validate_pos_discount(p_discount_id uuid, p_auth_code text, p_order_total numeric) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_pos_discount(p_discount_id uuid, p_auth_code text, p_order_total numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_pos_discount(p_discount_id uuid, p_auth_code text, p_order_total numeric) TO service_role;
REVOKE ALL ON FUNCTION public.verify_staff_pin(_restaurant_user_id uuid, _pin text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(_restaurant_user_id uuid, _pin text) TO service_role;

-- Fuera de public: auth, storage y realtime
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('brand-assets', 'brand-assets', true, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('invoices', 'invoices', false, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('pos-closures', 'pos-closures', false, NULL, NULL) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users can delete their own brand assets" ON storage.objects AS PERMISSIVE FOR DELETE TO public
  USING (((bucket_id = 'brand-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can delete their own invoice files" ON storage.objects AS PERMISSIVE FOR DELETE TO public
  USING (((bucket_id = 'invoices'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can read their own invoice files" ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING (((bucket_id = 'invoices'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can update their own brand assets" ON storage.objects AS PERMISSIVE FOR UPDATE TO public
  USING (((bucket_id = 'brand-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can update their own invoice files" ON storage.objects AS PERMISSIVE FOR UPDATE TO public
  USING (((bucket_id = 'invoices'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can upload their own brand assets" ON storage.objects AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((bucket_id = 'brand-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can upload their own invoice files" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'invoices'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can view their own brand assets" ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING (((bucket_id = 'brand-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
ALTER PUBLICATION supabase_realtime ADD TABLE public.aggregator_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.copilot_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_item_modifier_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_item_modifiers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_modifier_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opening_phase_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_websites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_reservations;
