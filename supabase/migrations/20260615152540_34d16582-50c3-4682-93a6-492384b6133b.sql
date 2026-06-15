
-- View: menu_item_cooccurrence
CREATE OR REPLACE VIEW public.menu_item_cooccurrence AS
WITH order_items AS (
  SELECT
    ro.user_id,
    ro.id AS order_id,
    (item->>'menu_item_id')::uuid AS menu_item_id,
    item->>'name' AS name
  FROM public.restaurant_orders ro,
       jsonb_array_elements(ro.items::jsonb) AS item
  WHERE ro.created_at >= now() - interval '60 days'
    AND ro.status NOT IN ('cancelled', 'pending')
    AND (item->>'menu_item_id') IS NOT NULL
)
SELECT
  a.user_id,
  a.menu_item_id AS item_a,
  b.menu_item_id AS item_b,
  a.name AS name_a,
  b.name AS name_b,
  COUNT(*)::int AS pair_count
FROM order_items a
JOIN order_items b
  ON a.order_id = b.order_id
 AND a.user_id = b.user_id
 AND a.menu_item_id < b.menu_item_id
GROUP BY a.user_id, a.menu_item_id, b.menu_item_id, a.name, b.name
HAVING COUNT(*) >= 2;

GRANT SELECT ON public.menu_item_cooccurrence TO authenticated, service_role;

-- Realtime for delivery + reservations
DO $$
BEGIN
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.aggregator_orders';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.table_reservations';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.aggregator_orders REPLICA IDENTITY FULL;
ALTER TABLE public.table_reservations REPLICA IDENTITY FULL;

-- POS Session Closures
CREATE TABLE IF NOT EXISTS public.pos_session_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  cashier_name TEXT,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  expected_cash NUMERIC,
  actual_cash NUMERIC,
  cash_difference NUMERIC,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  payment_breakdown JSONB DEFAULT '{}'::jsonb,
  top_items JSONB DEFAULT '[]'::jsonb,
  audit_summary JSONB DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pos_session_closures TO authenticated;
GRANT ALL ON public.pos_session_closures TO service_role;
ALTER TABLE public.pos_session_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_closures owner" ON public.pos_session_closures
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pos_closures_user ON public.pos_session_closures (user_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_closures_session ON public.pos_session_closures (session_id);

-- POS User Activity
CREATE TABLE IF NOT EXISTS public.pos_user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  staff_id UUID,
  staff_name TEXT,
  terminal_id TEXT,
  activity_type TEXT NOT NULL DEFAULT 'ping',
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pos_user_activity TO authenticated;
GRANT ALL ON public.pos_user_activity TO service_role;
ALTER TABLE public.pos_user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_activity owner read" ON public.pos_user_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pos_activity insert" ON public.pos_user_activity
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_pos_activity_user_time ON public.pos_user_activity (user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_activity_session ON public.pos_user_activity (session_id, recorded_at DESC);
