-- ============================================================================
-- B-01/B-02 — Cuadre de caja POS + fix de trigger de auditoría roto
-- (Aplicado y verificado en producción vía query_database el 2026-07-14.)
--
-- 1) FIX CRÍTICO: pos_audit_transaction() referenciaba NEW.user_id, columna que
--    NO existe en pos_transactions -> TODA inserción de transacción POS fallaba
--    desde ~2026-06-15 (POS in-app sin registrar pagos por un mes). Ahora deriva
--    el user_id del negocio desde la sesión (o la orden).
-- 2) pos_close_session(): cierre server-authoritative. Efectivo esperado =
--    apertura + ventas en EFECTIVO (por session_id) - devoluciones en efectivo
--    + cash_in - cash_out + depósitos - retiros. Antes el frontend sumaba TODAS
--    las ventas (incluida tarjeta/Nequi) como efectivo -> faltantes fantasma.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.pos_audit_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
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
$function$;

CREATE OR REPLACE FUNCTION public.pos_close_session(
  p_session_id uuid,
  p_actual_cash numeric,
  p_notes text DEFAULT NULL
)
RETURNS public.pos_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_session public.pos_sessions;
  v_cash_sales numeric := 0; v_cash_refunds numeric := 0;
  v_cash_in numeric := 0; v_cash_out numeric := 0;
  v_mov_in numeric := 0; v_mov_out numeric := 0;
  v_total_sales numeric := 0; v_sales_count integer := 0; v_total_tips numeric := 0;
  v_expected numeric;
BEGIN
  SELECT * INTO v_session FROM public.pos_sessions
   WHERE id = p_session_id AND user_id = v_uid AND status = 'open' FOR UPDATE;
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
  FROM public.pos_cash_movements WHERE session_id = p_session_id;

  v_expected := COALESCE(v_session.opening_cash,0) + v_cash_sales - v_cash_refunds
              + v_cash_in - v_cash_out + v_mov_in - v_mov_out;

  UPDATE public.pos_sessions
  SET status='closed', closed_at=now(), closing_cash=p_actual_cash, actual_cash=p_actual_cash,
      expected_cash=v_expected, difference=p_actual_cash - v_expected,
      total_sales=v_total_sales, sales_count=v_sales_count, total_tips=v_total_tips,
      notes=COALESCE(p_notes, notes), updated_at=now()
  WHERE id = p_session_id RETURNING * INTO v_session;

  RETURN v_session;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.pos_close_session(uuid,numeric,text) TO authenticated;
