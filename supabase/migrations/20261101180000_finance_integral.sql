-- Finanzas integrales: gastos, cuentas de dinero, liquidaciones y configuración.
--
-- Hasta hoy el P&L conocía las ventas, el costo de alimentos (recetas) y la
-- nómina (turnos), pero los demás gastos eran un número plano por día en
-- daily_sales.other_costs y nada decía cuándo se paga cada cosa ni cuánta plata
-- hay. Eso es justo lo que le faltó a Bubble Lab (gastos sin registrar, una
-- rampa sin fondear) y lo que GOAT lleva en Excel.
--
--   restaurant_expenses   gasto con fecha de devengo, vencimiento y pago. Los
--                         fijos (arriendo, servicios) se prorratean en el mes
--                         para el P&L; la caja los ve el día en que se pagan.
--                         recurrence = 'monthly' es una plantilla que se repite.
--   finance_accounts      saldos de bancos y caja (punto de partida del flujo).
--   finance_settlements   lo que de verdad depositaron datáfono, Rappi, Nequi:
--                         la conciliación lo compara con lo que dice el POS.
--   finance_settings      comisiones, retenciones y plazos de liquidación.
--   supplier_invoices     + paid_at / payment_method / account_id.

CREATE TABLE IF NOT EXISTS public.finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
  account_type text NOT NULL DEFAULT 'bank' CHECK (account_type IN ('bank', 'cash', 'wallet')),
  balance numeric(16,2) NOT NULL DEFAULT 0,
  balance_as_of date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Bogota')::date),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_accounts_user_idx ON public.finance_accounts (user_id);

CREATE TABLE IF NOT EXISTS public.restaurant_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  expense_date date NOT NULL,
  category text NOT NULL CHECK (category IN (
    'arriendo', 'servicios_publicos', 'nomina_prestaciones', 'mercadeo', 'mantenimiento',
    'software_licencias', 'comisiones', 'impuestos', 'bancarios', 'seguros', 'domicilios',
    'aseo_desechables', 'otros')),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 160),
  vendor text,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  is_fixed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date date,
  paid_at date,
  payment_method text,
  account_id uuid REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
  recurrence text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'monthly')),
  recurrence_parent uuid REFERENCES public.restaurant_expenses(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_expenses_paid_has_date CHECK (status <> 'paid' OR paid_at IS NOT NULL),
  CONSTRAINT restaurant_expenses_occurrence_not_template CHECK (recurrence_parent IS NULL OR recurrence = 'none')
);
CREATE INDEX IF NOT EXISTS restaurant_expenses_user_date_idx ON public.restaurant_expenses (user_id, expense_date);
CREATE INDEX IF NOT EXISTS restaurant_expenses_user_status_idx ON public.restaurant_expenses (user_id, status, due_date);
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_expenses_one_occurrence_per_month
  ON public.restaurant_expenses (recurrence_parent, date_trunc('month', expense_date::timestamp))
  WHERE recurrence_parent IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.finance_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  channel text NOT NULL CHECK (channel IN ('card', 'rappi', 'digital')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_reported numeric(14,2),
  fees_reported numeric(14,2) NOT NULL DEFAULT 0,
  withholdings_reported numeric(14,2) NOT NULL DEFAULT 0,
  net_deposited numeric(14,2) NOT NULL CHECK (net_deposited >= 0),
  deposit_date date,
  account_id uuid REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_settlements_period CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS finance_settlements_user_idx ON public.finance_settlements (user_id, channel, period_start);

CREATE TABLE IF NOT EXISTS public.finance_settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  card_fee_pct numeric(5,2) NOT NULL DEFAULT 3.00 CHECK (card_fee_pct BETWEEN 0 AND 20),
  card_withholding_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (card_withholding_pct BETWEEN 0 AND 20),
  card_settlement_days integer NOT NULL DEFAULT 1 CHECK (card_settlement_days BETWEEN 0 AND 30),
  digital_fee_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (digital_fee_pct BETWEEN 0 AND 20),
  rappi_commission_pct numeric(5,2) NOT NULL DEFAULT 25 CHECK (rappi_commission_pct BETWEEN 0 AND 60),
  rappi_settlement_days integer NOT NULL DEFAULT 14 CHECK (rappi_settlement_days BETWEEN 1 AND 45),
  supplier_payment_days integer NOT NULL DEFAULT 20 CHECK (supplier_payment_days BETWEEN 0 AND 90),
  min_cash_buffer numeric(14,2) NOT NULL DEFAULT 0 CHECK (min_cash_buffer >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_invoices
  ADD COLUMN IF NOT EXISTS paid_at date,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.finance_accounts(id) ON DELETE SET NULL;

-- RLS: el dueño administra; el equipo según su permiso del módulo Finanzas.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_accounts', 'restaurant_expenses', 'finance_settlements', 'finance_settings'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS owner_all ON public.%I', t);
    EXECUTE format('CREATE POLICY owner_all ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
    EXECUTE format('DROP POLICY IF EXISTS team_read ON public.%I', t);
    EXECUTE format($p$CREATE POLICY team_read ON public.%I FOR SELECT TO authenticated
      USING (user_id IN (SELECT public.team_owner_ids(ARRAY['finances'], 'read')))$p$, t);
    EXECUTE format('DROP POLICY IF EXISTS team_write ON public.%I', t);
    EXECUTE format($p$CREATE POLICY team_write ON public.%I FOR ALL TO authenticated
      USING (user_id IN (SELECT public.team_owner_ids(ARRAY['finances'], 'write')))
      WITH CHECK (user_id IN (SELECT public.team_owner_ids(ARRAY['finances'], 'write')))$p$, t);
    -- Un gerente que registra un gasto lo deja a nombre del negocio.
    EXECUTE format('DROP TRIGGER IF EXISTS aa_team_owner_user_id ON public.%I', t);
    EXECUTE format('CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id()', t);
  END LOOP;
END $$;

-- La factura de proveedor también puede llegar de un miembro del equipo.
DROP TRIGGER IF EXISTS aa_team_owner_user_id ON public.supplier_invoices;
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();

-- Plantillas mensuales → una ocurrencia por mes (pendiente, mismo día del mes).
-- La plantilla es la ocurrencia de su propio mes. Corre a diario por pg_cron.
CREATE OR REPLACE FUNCTION public.finance_materialize_recurring(p_month date DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
END $$;
REVOKE ALL ON FUNCTION public.finance_materialize_recurring(date) FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'finance-materialize-recurring';
SELECT cron.schedule('finance-materialize-recurring', '20 10 * * *', $$SELECT public.finance_materialize_recurring()$$);
