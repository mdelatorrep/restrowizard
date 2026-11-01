-- Cierre diario real del restaurante demo en daily_sales.
--
-- El seed solo escribía other_costs en daily_sales y dejaba total_revenue en 0.
-- La función de alertas del copiloto lee esa tabla y concluyó "ingresos cero
-- en 7 días, posible cese de operaciones" con $64M vendidos en la semana: lo
-- primero que veía un dueño al abrir la demo era una alerta falsa.
--
-- Llena por día operativo: venta sin propina, comensales, ticket promedio,
-- costo de alimentos (deducciones × costo unitario) y costo laboral (turnos).
-- Conserva other_costs y notes. Lo llaman seed_demo_restaurant() y demo_tick().

CREATE OR REPLACE FUNCTION public._demo_refresh_daily_close(p_from date, p_to date)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  -- other_costs = 0: los costos fijos viven en restaurant_expenses (_demo_seed_finance).
  SELECT c_owner, c.bday, c.revenue, c.covers, c.avg_ticket, c.food, c.labor, 0, 'Cierre del día.'
  FROM computed c
  WHERE c.bday NOT IN (SELECT sale_date FROM updated);
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END $$;

REVOKE ALL ON FUNCTION public._demo_refresh_daily_close(date, date) FROM PUBLIC, anon, authenticated;
