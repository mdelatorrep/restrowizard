-- Motores operativos: calendario de demanda, propinas y generador de horarios.
-- Todo vive en SQL (RPC) para que funcione sin desplegar edge functions.

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Guardia de "sembrado": los triggers pesados por fila se saltan cuando
--    app.demo_seeding = 'on' (solo lo activa seed_demo_restaurant, dentro de su
--    propia transacción). Se inyecta al inicio del cuerpo de cada función sin
--    reescribir su lógica.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  fn text;
  def text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'trg_order_inventory_deduction', 'trigger_update_menu_scores_on_order',
    'trg_sync_loyalty_from_orders', 'pos_audit_order_change',
    'log_order_status_change', 'pos_audit_transaction', 'pos_audit_session'
  ] LOOP
    SELECT pg_get_functiondef(p.oid) INTO def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = fn AND p.pronargs = 0;
    IF def IS NULL OR def LIKE '%app.demo_seeding%' THEN CONTINUE; END IF;
    def := regexp_replace(def, E'\\nBEGIN\\n',
      E'\nBEGIN\n  IF current_setting(''app.demo_seeding'', true) = ''on'' THEN RETURN NEW; END IF;\n');
    EXECUTE def;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Calendario de demanda: partidos, festivos, eventos privados, promociones.
--    Alimenta el generador de horarios y el marketing.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demand_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_date date NOT NULL,
  start_time time,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'deporte'
    CHECK (category IN ('deporte','festivo','evento_privado','promocion','otro')),
  expected_lift numeric NOT NULL DEFAULT 1.3 CHECK (expected_lift > 0 AND expected_lift <= 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demand_events_user_date_idx ON public.demand_events (user_id, event_date);
ALTER TABLE public.demand_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_read ON public.demand_events;
CREATE POLICY team_read ON public.demand_events FOR SELECT TO authenticated
  USING (public.team_can(user_id, ARRAY['talent','dashboard','reservations','pos','marketing']));
DROP POLICY IF EXISTS team_write ON public.demand_events;
CREATE POLICY team_write ON public.demand_events FOR ALL TO authenticated
  USING (public.team_can(user_id, ARRAY['talent','reservations'], 'write'))
  WITH CHECK (public.team_can(user_id, ARRAY['talent','reservations'], 'write'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Propinas
--    Modelo (calcado de la liquidación quincenal de un sports bar real):
--    · Cada mesero conserva un % de la propina de SUS mesas.
--    · El resto + las propinas sin mesero forman el fondo común.
--    · El fondo se reparte por puntos = peso del cargo × días (u horas)
--      trabajados × factor del gerente.
--    · Los ajustes manuales llevan motivo y deben sumar cero para cerrar.
--    · Invariante: Σ total pagado = Σ propinas recaudadas, al peso.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tip_policies (
  user_id uuid PRIMARY KEY,
  table_share_pct numeric NOT NULL DEFAULT 70 CHECK (table_share_pct >= 0 AND table_share_pct <= 100),
  pool_basis text NOT NULL DEFAULT 'days' CHECK (pool_basis IN ('days','hours')),
  rounding integer NOT NULL DEFAULT 100 CHECK (rounding IN (1, 10, 50, 100, 500, 1000)),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tip_role_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position text NOT NULL,
  tip_group text NOT NULL DEFAULT 'sala'
    CHECK (tip_group IN ('sala','barra','cocina','apoyo','gerencia','excluido')),
  weight numeric NOT NULL DEFAULT 1 CHECK (weight >= 0 AND weight <= 10),
  earns_table_tips boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, position)
);

CREATE TABLE IF NOT EXISTS public.tip_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','closed')),
  total_tips numeric NOT NULL DEFAULT 0,
  table_kept numeric NOT NULL DEFAULT 0,
  shared_pool numeric NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  computed_at timestamptz,
  closed_at timestamptz,
  closed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  UNIQUE (user_id, start_date, end_date)
);

CREATE TABLE IF NOT EXISTS public.tip_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.tip_periods(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  staff_name text NOT NULL,
  position text,
  tip_group text,
  days_worked integer NOT NULL DEFAULT 0,
  hours_worked numeric NOT NULL DEFAULT 0,
  table_tips_generated numeric NOT NULL DEFAULT 0,
  table_tips_kept numeric NOT NULL DEFAULT 0,
  role_weight numeric NOT NULL DEFAULT 0,
  shared_points numeric NOT NULL DEFAULT 0,
  manager_factor numeric NOT NULL DEFAULT 1 CHECK (manager_factor >= 0 AND manager_factor <= 2),
  factor_reason text,
  shared_amount numeric NOT NULL DEFAULT 0,
  adjustment numeric NOT NULL DEFAULT 0,
  adjustment_reason text,
  total_amount numeric NOT NULL DEFAULT 0,
  UNIQUE (period_id, staff_member_id),
  CHECK (adjustment = 0 OR coalesce(btrim(adjustment_reason), '') <> ''),
  CHECK (manager_factor = 1 OR coalesce(btrim(factor_reason), '') <> '')
);
CREATE INDEX IF NOT EXISTS tip_allocations_period_idx ON public.tip_allocations (period_id);

ALTER TABLE public.tip_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_role_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_allocations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tip_policies','tip_role_weights','tip_periods','tip_allocations'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS team_read ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS team_write ON public.%I', t);
    EXECUTE format('CREATE POLICY team_read ON public.%I FOR SELECT TO authenticated USING (public.team_can(user_id, ARRAY[''talent'',''finances'']))', t);
    EXECUTE format('CREATE POLICY team_write ON public.%I FOR ALL TO authenticated USING (public.team_can(user_id, ARRAY[''talent''], ''write'')) WITH CHECK (public.team_can(user_id, ARRAY[''talent''], ''write''))', t);
  END LOOP;
END $$;

-- Un período cerrado no se toca: ni sus asignaciones.
CREATE OR REPLACE FUNCTION public.tg_tip_allocations_locked()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM tip_periods
   WHERE id = COALESCE(NEW.period_id, OLD.period_id);
  IF v_status = 'closed' AND current_setting('app.demo_seeding', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'La quincena está cerrada: no se puede modificar';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_tip_allocations_locked ON public.tip_allocations;
CREATE TRIGGER trg_tip_allocations_locked BEFORE INSERT OR UPDATE OR DELETE ON public.tip_allocations
  FOR EACH ROW EXECUTE FUNCTION public.tg_tip_allocations_locked();

-- Horas netas de un turno, con cruce de medianoche (espejo de src/lib/laborCost.ts).
CREATE OR REPLACE FUNCTION public.shift_net_hours(_start time, _end time, _break integer)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0,
    (EXTRACT(EPOCH FROM (_end - _start)) / 3600.0
      + CASE WHEN _end <= _start THEN 24 ELSE 0 END)
    - COALESCE(_break, 0) / 60.0)::numeric;
$$;

-- Calcula (o recalcula) la liquidación de un período. Conserva el factor del
-- gerente y los ajustes que ya se hubieran cargado.
CREATE OR REPLACE FUNCTION public.compute_tip_period(p_period_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Propinas del período por mesero (fecha local de Medellín)
  DROP TABLE IF EXISTS _tips;
  CREATE TEMP TABLE _tips ON COMMIT DROP AS
  SELECT o.waiter_id, SUM(COALESCE(o.tip_amount, 0)) AS tips, COUNT(*) AS n
  FROM restaurant_orders o
  WHERE o.user_id = v_period.user_id
    AND o.status IN ('completed','paid','delivered')
    -- día operativo: lo vendido antes de las 6 a.m. cuenta para la noche anterior
    AND ((o.created_at AT TIME ZONE 'America/Bogota') - interval '6 hours')::date
        BETWEEN v_period.start_date AND v_period.end_date
    AND COALESCE(o.tip_amount, 0) > 0
  GROUP BY o.waiter_id;

  SELECT COALESCE(SUM(tips), 0), COALESCE(SUM(n), 0)::int INTO v_total, v_orders FROM _tips;

  -- Trabajo del período (turnos no cancelados ni ausentes)
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

  -- Conservar decisiones del gerente antes de recalcular
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
    -- El residuo del redondeo va a quien más puntos tiene: el cuadre es exacto.
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
END $$;

-- Cierra el período solo si cuadra al peso y los ajustes netean a cero.
CREATE OR REPLACE FUNCTION public.close_tip_period(p_period_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Generador de horarios
--    Demanda = promedio de órdenes por (día de semana, hora) de las últimas 8
--    semanas × el mayor "lift" de los eventos del día (partidos, festivos).
--    Personal requerido por cargo = ceil(órdenes/hora ÷ productividad), acotado
--    por mínimo y máximo. Dos bloques por día (apertura y cierre, que se
--    solapan en el pico). Asignación justa: primero a quien menos horas lleva,
--    respetando disponibilidad, ausencias aprobadas, un turno por día, un día
--    de descanso y la jornada máxima semanal.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staffing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position text NOT NULL,
  orders_per_staff_hour numeric NOT NULL DEFAULT 4 CHECK (orders_per_staff_hour > 0),
  min_staff integer NOT NULL DEFAULT 1 CHECK (min_staff >= 0),
  max_staff integer NOT NULL DEFAULT 10 CHECK (max_staff >= min_staff),
  is_active boolean NOT NULL DEFAULT true,
  -- true = el cargo solo se programa en el bloque pico (cierre): jefes, host, barback
  peak_only boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, position)
);
ALTER TABLE public.staffing_rules ADD COLUMN IF NOT EXISTS peak_only boolean NOT NULL DEFAULT false;
ALTER TABLE public.staffing_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_read ON public.staffing_rules;
CREATE POLICY team_read ON public.staffing_rules FOR SELECT TO authenticated
  USING (public.team_can(user_id, ARRAY['talent']));
DROP POLICY IF EXISTS team_write ON public.staffing_rules;
CREATE POLICY team_write ON public.staffing_rules FOR ALL TO authenticated
  USING (public.team_can(user_id, ARRAY['talent'], 'write'))
  WITH CHECK (public.team_can(user_id, ARRAY['talent'], 'write'));

CREATE OR REPLACE FUNCTION public.generate_schedule_proposal(
  p_owner uuid,
  p_week_start date,
  p_apply boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c_max_week_hours constant numeric := 42;   -- jornada máxima semanal vigente (Ley 2101)
  c_night_from constant integer := 19;       -- recargo nocturno desde las 7 p.m. (Ley 2466)
  c_night_pct constant numeric := 0.35;
  c_sunday_pct constant numeric := 0.90;     -- recargo dominical vigente en 2026 (Ley 2466)
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

  -- Curva de demanda: órdenes promedio por (isodow, hora local)
  DROP TABLE IF EXISTS _demand;
  CREATE TEMP TABLE _demand ON COMMIT DROP AS
  -- Día operativo: lo vendido antes de las 6 a.m. pertenece a la noche anterior
  -- (un bar que cierra a las 2 a.m.). Las horas van de 6 a 29.
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

  -- Horas ya asignadas en la semana (turnos publicados o manuales que no son del generador)
  DROP TABLE IF EXISTS _load;
  CREATE TEMP TABLE _load ON COMMIT DROP AS
  SELECT sm.id AS staff_id,
         COALESCE(SUM(public.shift_net_hours(s.start_time, s.end_time, s.break_minutes)), 0) AS hours,
         COUNT(DISTINCT s.shift_date)::int AS days
  FROM staff_members sm
  LEFT JOIN staff_shifts s ON s.staff_member_id = sm.id
       AND s.shift_date BETWEEN p_week_start AND p_week_start + 6
       AND COALESCE(s.status, 'scheduled') <> 'cancelled'
       -- los borradores del generador no cuentan: se reemplazan al aplicar
       AND (COALESCE(s.notes, '') <> c_marker OR COALESCE(s.is_published, false))
  WHERE sm.user_id = p_owner AND COALESCE(sm.is_active, true)
  GROUP BY sm.id;

  DROP TABLE IF EXISTS _taken;

  CREATE TEMP TABLE _taken (staff_id uuid, shift_date date) ON COMMIT DROP;
  INSERT INTO _taken
  SELECT s.staff_member_id, s.shift_date FROM staff_shifts s
  WHERE s.user_id = p_owner AND s.shift_date BETWEEN p_week_start AND p_week_start + 6
    AND COALESCE(s.status, 'scheduled') <> 'cancelled'
    -- los borradores del generador no cuentan: se reemplazan al aplicar
       AND (COALESCE(s.notes, '') <> c_marker OR COALESCE(s.is_published, false));

  DROP TABLE IF EXISTS _proposal;

  CREATE TEMP TABLE _proposal (
    staff_id uuid, staff_name text, position text, shift_date date,
    start_time time, end_time time, hours numeric, cost numeric, surcharge numeric, block text
  ) ON COMMIT DROP;

  -- Primero los días de más demanda: si falta gente, que falte un martes y no el domingo de partido.
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
    -- 1 hora antes para montaje
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
        -- Día corto (≤ 9 h): un solo bloque con la necesidad del pico.
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
                  AND a.day_of_week = (v_dow % 7)   -- 0 = domingo
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
              -- horas nocturnas del bloque (desde las 19:00)
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
END $$;

REVOKE ALL ON FUNCTION public.compute_tip_period(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.close_tip_period(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_schedule_proposal(uuid, date, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_tip_period(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_tip_period(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_schedule_proposal(uuid, date, boolean) TO authenticated;
