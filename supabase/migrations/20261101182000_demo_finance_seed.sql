-- Datos financieros del restaurante demo: gastos, saldos, supuestos y
-- liquidaciones. Lo llama seed_demo_restaurant() al final, después de generar
-- las ventas (las liquidaciones se calculan sobre esas ventas).
--
-- Los ~$88M mensuales de gastos reemplazan, en el P&L, la estimación plana de
-- $3M/día de daily_sales.other_costs (que se conserva para meses sin gastos):
-- el margen del demo no cambia (~11 %) pero cada peso tiene concepto, fecha,
-- vencimiento y estado.
--
-- Hallazgos sembrados para que la demo tenga qué mostrar:
--   · una semana de datáfono depositada con $412.300 de menos (contracargo)
--   · una quincena de Rappi con $186.400 de menos (pedido cancelado cobrado)
--   · la semana en curso del datáfono todavía sin liquidación registrada
--   · un mantenimiento pendiente y los fijos de noviembre por pagar

CREATE OR REPLACE FUNCTION public._demo_seed_finance()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
END $$;

REVOKE ALL ON FUNCTION public._demo_seed_finance() FROM PUBLIC, anon, authenticated;
