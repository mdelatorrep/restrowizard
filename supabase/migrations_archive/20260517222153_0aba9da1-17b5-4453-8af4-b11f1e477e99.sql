-- =====================================================================
-- 1) Unified orders view (in-house + aggregators)
-- =====================================================================
CREATE OR REPLACE VIEW public.unified_orders_view AS
SELECT
  ro.id,
  ro.user_id,
  NULL::uuid                AS brand_id,
  'inhouse'::text           AS channel,
  COALESCE(ro.source, 'pos') AS source,
  ro.order_type,
  ro.status,
  ro.payment_status,
  ro.customer_name,
  ro.customer_phone,
  ro.customer_email,
  ro.items,
  ro.subtotal,
  ro.discount_amount        AS discount,
  ro.tax_amount             AS tax,
  ro.delivery_fee,
  ro.tip_amount,
  0::numeric                AS commission,
  ro.total                  AS gross_total,
  ro.total                  AS net_total,
  ro.created_at,
  ro.completed_at,
  ro.updated_at,
  NULL::text                AS external_order_id,
  ro.table_id,
  ro.session_id,
  ro.waiter_id
FROM public.restaurant_orders ro
UNION ALL
SELECT
  ao.id,
  ao.user_id,
  ao.brand_id,
  'aggregator'::text        AS channel,
  ao.platform::text         AS source,
  'delivery'::text          AS order_type,
  ao.order_status           AS status,
  NULL::text                AS payment_status,
  ao.customer_name,
  ao.customer_phone,
  NULL::text                AS customer_email,
  ao.items,
  ao.subtotal,
  0::numeric                AS discount,
  0::numeric                AS tax,
  0::numeric                AS delivery_fee,
  0::numeric                AS tip_amount,
  ao.commission,
  ao.subtotal               AS gross_total,
  ao.net_total,
  ao.created_at,
  ao.completed_at,
  ao.updated_at,
  ao.external_order_id,
  NULL::uuid                AS table_id,
  NULL::uuid                AS session_id,
  NULL::uuid                AS waiter_id
FROM public.aggregator_orders ao;

COMMENT ON VIEW public.unified_orders_view IS
  'Vista unificada de pedidos in-house (POS/sala/delivery propio) y agregadores (Rappi/UberEats/DiDi).';

-- The view inherits RLS from its underlying tables (both already have user_id-scoped policies).

-- =====================================================================
-- 2) Auto-log lifecycle changes on restaurant_orders
-- =====================================================================
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_log_order_status_change ON public.restaurant_orders;
CREATE TRIGGER trg_log_order_status_change
AFTER INSERT OR UPDATE OF status ON public.restaurant_orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- =====================================================================
-- 3) Consultant impersonation logging RPCs
-- =====================================================================
CREATE OR REPLACE FUNCTION public.log_consultant_impersonation_start(
  p_client_user_id uuid,
  p_client_business_id uuid,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.log_consultant_impersonation_end(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.consultant_impersonation_log
  SET ended_at = now()
  WHERE id = p_log_id
    AND consultant_id = auth.uid()
    AND ended_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_consultant_impersonation_start(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_consultant_impersonation_end(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.log_consultant_impersonation_start(uuid, uuid, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.log_consultant_impersonation_end(uuid) TO authenticated;

-- =====================================================================
-- 4) RLS on order_status_history (scope to order owner)
-- =====================================================================
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their order status history" ON public.order_status_history;
CREATE POLICY "Owners can view their order status history"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_orders ro
    WHERE ro.id = order_status_history.order_id
      AND ro.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert order status history" ON public.order_status_history;
CREATE POLICY "System can insert order status history"
ON public.order_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_orders ro
    WHERE ro.id = order_status_history.order_id
      AND ro.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created
  ON public.order_status_history (order_id, created_at DESC);