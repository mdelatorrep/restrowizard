-- ============================================================================
-- B-10 — Autorización de descuentos server-side (aplicado y verificado por MCP).
-- Antes: el código de autorización viajaba al cliente y se comparaba en el
-- navegador; usage_count se incrementaba desde el cliente. Ahora una RPC valida
-- pertenencia (dueño o miembro activo), código, mínimo y vigencia en el servidor,
-- calcula el monto (con tope) e incrementa el uso atómicamente.
-- El frontend deja de traer authorization_code al POS.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_pos_discount(
  p_discount_id uuid, p_auth_code text, p_order_total numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
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
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'Pedido mínimo: $' || COALESCE(v_d.min_order_value, 0)::text);
  END IF;
  IF v_d.valid_from IS NOT NULL AND v_d.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'Descuento aún no válido');
  END IF;
  IF v_d.valid_until IS NOT NULL AND v_d.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'amount', 0, 'message', 'Descuento expirado');
  END IF;
  v_amount := CASE WHEN v_d.discount_type = 'percent' THEN p_order_total * (v_d.value / 100.0) ELSE v_d.value END;
  IF v_d.max_discount_amount IS NOT NULL AND v_amount > v_d.max_discount_amount THEN
    v_amount := v_d.max_discount_amount;
  END IF;
  UPDATE public.pos_discounts SET usage_count = usage_count + 1, updated_at = now() WHERE id = p_discount_id;
  RETURN jsonb_build_object('valid', true, 'amount', v_amount);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.validate_pos_discount(uuid,text,numeric) TO authenticated;
