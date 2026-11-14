-- ============================================================================
-- B-42 — Otorgamiento de puntos atómico (award_loyalty_points)
--
-- Antes, `useLoyaltyData.awardPoints` hacía read-modify-write desde el cliente:
--   1. leía `current_points` del ESTADO LOCAL del navegador (customers.find(...)),
--   2. calculaba newBalance = saldo + puntos,
--   3. escribía ese ABSOLUTO con .update({ current_points: newBalance }).
--
-- Dos problemas:
--   (a) Lost update: dos cajas otorgando a la vez pisan el saldo la una a la
--       otra. Verificado: 100 +50 +30 daba 130 en vez de 180.
--   (b) El saldo base salía de una caché que podía estar vieja, así que el
--       balance escrito podía no tener relación con el real.
--
-- Los puntos son un pasivo del negocio: se canjean por comida. Esta RPC hace el
-- incremento server-side con FOR UPDATE, igual que `redeem_loyalty_reward` (B-22).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.award_loyalty_points(p_customer_id uuid, p_points integer, p_source text, p_description text DEFAULT NULL, p_source_id uuid DEFAULT NULL)
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

  SELECT user_id, current_points + p_points
    INTO v_owner, v_new_balance
  FROM public.loyalty_customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Cliente no encontrado');
  END IF;

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
$function$;
