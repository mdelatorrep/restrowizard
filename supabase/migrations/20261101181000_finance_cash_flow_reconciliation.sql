-- Flujo de caja proyectado (13 semanas) y conciliación de medios de pago.
--
-- Ambas funciones validan acceso con team_owner_ids(['finances']): el dueño o
-- un miembro con permiso de Finanzas sobre ese negocio.

-- Grupo de liquidación de una venta: cómo y cuándo llega la plata.
CREATE OR REPLACE FUNCTION public.finance_pay_group(p_method text, p_channel text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_channel = 'rappi' OR p_method ILIKE '%rappi%' THEN 'rappi'
    WHEN p_method ILIKE ANY (ARRAY['%tarjeta%', '%card%', '%crédito%', '%credito%', '%débito%', '%debito%', '%datáfono%', '%datafono%']) THEN 'card'
    WHEN p_method ILIKE ANY (ARRAY['%nequi%', '%daviplata%', '%qr%', '%transfer%', '%pse%', '%bancolombia%', '%digital%']) THEN 'digital'
    ELSE 'cash'
  END
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Flujo de caja: saldo de hoy + lo que entra − lo que sale, semana a semana.
--
-- Entradas
--   · contado (efectivo/otros) y billeteras: el mismo día (billetera − comisión)
--   · datáfono: venta + propina − comisión − retenciones, a T + card_settlement_days
--   · Rappi: venta − comisión, a T + rappi_settlement_days
--   · incluye la plata "en tránsito": ventas ya hechas que el datáfono o Rappi
--     todavía no depositan.
--   La venta futura = promedio del mismo día de la semana en las últimas 8
--   semanas × el mayor impacto de un evento ese día (calendario deportivo).
-- Salidas
--   · facturas de proveedor sin pagar (vencidas → hoy)
--   · gastos pendientes y ocurrencias futuras de gastos mensuales
--   · nómina por quincena (15 y último día): turnos programados o, si no hay,
--     el promedio del mismo día de la semana de las últimas 4 semanas
--   · propinas cobradas por datáfono, que se pagan al equipo en la quincena
--   · compras futuras de insumos = venta neta proyectada × % costo de
--     alimentos de los últimos 30 días, pagadas a supplier_payment_days
--   · impoconsumo bimestral, pagado el 15 del mes siguiente al bimestre
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finance_cash_flow_projection(p_owner uuid, p_weeks integer DEFAULT 13)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Tasa de impuesto al consumo (fracción guardada en tax_config.rate; 8 si viniera en puntos).
  SELECT CASE WHEN (tax_config->>'rate')::numeric > 1 THEN (tax_config->>'rate')::numeric / 100
              ELSE coalesce((tax_config->>'rate')::numeric, 0) END
    INTO v_tax_rate
    FROM restaurant_businesses WHERE owner_id = p_owner ORDER BY created_at LIMIT 1;
  v_tax_rate := coalesce(v_tax_rate, 0);

  -- Ventas históricas por día operativo y grupo de liquidación.
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

  -- % de costo de alimentos de los últimos 30 días (sobre venta neta de impuesto).
  SELECT CASE WHEN s.net > 0 THEN f.cost / s.net ELSE 0 END INTO v_food_pct
  FROM (SELECT sum(sale - tax) AS net FROM _cf_hist WHERE bday BETWEEN v_today - 30 AND v_today - 1) s,
       (SELECT coalesce(sum(d.quantity_deducted * coalesce(i.unit_cost, 0)), 0) AS cost
          FROM inventory_deductions d JOIN inventory_items i ON i.id = d.inventory_item_id
         WHERE d.user_id = p_owner
           AND d.deducted_at >= ((v_today - 30)::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota'
           AND d.deducted_at <  (v_today::timestamp + interval '6 hours') AT TIME ZONE 'America/Bogota') f;
  v_food_pct := LEAST(coalesce(v_food_pct, 0), 0.8);

  -- Días a proyectar con su venta esperada por grupo.
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

  -- Libro de movimientos proyectados: (fecha, tipo, etiqueta, monto ±).
  DROP TABLE IF EXISTS _cf;
  CREATE TEMP TABLE _cf (day date, kind text, label text, amount numeric) ON COMMIT DROP;

  -- Entradas por ventas proyectadas.
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

  -- Plata en tránsito: ventas ya hechas que aún no se depositan.
  INSERT INTO _cf
  SELECT bday + v_card_days, 'in_card', 'Depósitos datáfono', (sale + tip) * (1 - (v_card_fee + v_card_wh) / 100)
  FROM _cf_hist WHERE grp = 'card' AND bday >= v_today - v_card_days AND bday < v_today AND bday + v_card_days >= v_today;
  INSERT INTO _cf
  SELECT bday + v_rappi_days, 'in_rappi', 'Liquidaciones Rappi', sale * (1 - v_rappi_fee / 100)
  FROM _cf_hist WHERE grp = 'rappi' AND bday >= v_today - v_rappi_days AND bday < v_today AND bday + v_rappi_days >= v_today;

  -- Facturas de proveedor por pagar.
  INSERT INTO _cf
  SELECT GREATEST(coalesce(si.due_date, si.invoice_date + v_supplier_days, v_today), v_today),
         'out_suppliers', 'Proveedores: ' || coalesce(si.supplier_name, 'sin nombre'), -si.total_amount
  FROM supplier_invoices si
  WHERE si.user_id = p_owner AND coalesce(si.status, 'pending') NOT IN ('paid', 'rejected', 'cancelled')
    AND coalesce(si.total_amount, 0) > 0;

  -- Gastos pendientes registrados.
  INSERT INTO _cf
  SELECT GREATEST(coalesce(e.due_date, e.expense_date), v_today), 'out_expenses', e.description, -e.amount
  FROM restaurant_expenses e
  WHERE e.user_id = p_owner AND e.status = 'pending' AND coalesce(e.due_date, e.expense_date) <= v_end;

  -- Gastos mensuales que todavía no tienen su ocurrencia del mes.
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

  -- Nómina y propinas por quincena.
  DROP TABLE IF EXISTS _cf_labor;
  CREATE TEMP TABLE _cf_labor ON COMMIT DROP AS
  WITH sched AS (
    SELECT s.shift_date AS day,
           sum(shift_net_hours(s.start_time, s.end_time, coalesce(s.break_minutes, 0))
               * coalesce(s.hourly_rate_override, sm.hourly_rate, 0)) AS cost
    FROM staff_shifts s JOIN staff_members sm ON sm.id = s.staff_member_id
    WHERE s.user_id = p_owner AND coalesce(s.status, 'scheduled') NOT IN ('cancelled', 'no_show')
      -- desde 4 semanas atrás (base del promedio) aunque el mes haya empezado hoy
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

  -- Compras futuras de insumos (las ya facturadas están en Proveedores).
  INSERT INTO _cf
  SELECT day + v_supplier_days, 'out_purchases', 'Compras de insumos proyectadas',
         -sum(sale - tax) * v_food_pct
  FROM _cf_days
  WHERE day + v_supplier_days <= v_end
  GROUP BY day HAVING sum(sale - tax) * v_food_pct > 0;

  -- Impoconsumo bimestral (ene-feb, mar-abr, …) que se paga el 15 del mes siguiente.
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

  -- Agregado semanal con saldo acumulado.
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
END $$;

REVOKE ALL ON FUNCTION public.finance_cash_flow_projection(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_cash_flow_projection(uuid, integer) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Conciliación: lo que el POS dice que se cobró por cada medio vs lo que de
-- verdad depositaron (finance_settlements) y el cuadre de efectivo de cada caja.
-- Esperado neto = bruto − comisión − retenciones según finance_settings.
-- Cuadra si la diferencia es ≤ max($2.000, 0,5 % del esperado).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finance_reconciliation(p_owner uuid, p_from date, p_to date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
END $$;

REVOKE ALL ON FUNCTION public.finance_reconciliation(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_reconciliation(uuid, date, date) TO authenticated;
