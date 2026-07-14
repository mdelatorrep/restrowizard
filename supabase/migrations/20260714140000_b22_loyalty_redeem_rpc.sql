-- ============================================================================
-- B-22 — Canje de fidelización atómico (aplicado y verificado por MCP).
-- Antes: redeemReward hacía 5 pasos en cliente (leer puntos/stock, insertar
-- canje, deducir puntos, insertar transacción, subir stock_used) -> race
-- conditions: dos canjes simultáneos dejaban saldo negativo o excedían stock.
-- Ahora una RPC bloquea (FOR UPDATE) cliente y recompensa, valida puntos/stock/
-- vigencia y aplica todo en una transacción.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(p_customer_id uuid, p_catalog_item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_cust public.loyalty_customers;
  v_item public.loyalty_rewards_catalog;
  v_code text; v_reward_id uuid; v_new_balance numeric;
BEGIN
  SELECT * INTO v_cust FROM public.loyalty_customers WHERE id = p_customer_id FOR UPDATE;
  IF v_cust.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Cliente no encontrado'); END IF;
  IF v_cust.user_id <> v_uid AND NOT EXISTS (
     SELECT 1 FROM public.restaurant_businesses b JOIN public.restaurant_team_members tm ON tm.business_id=b.id
     WHERE b.owner_id = v_cust.user_id AND tm.user_id = v_uid AND tm.status='active') THEN
    RETURN jsonb_build_object('ok', false, 'message', 'No autorizado');
  END IF;

  SELECT * INTO v_item FROM public.loyalty_rewards_catalog WHERE id = p_catalog_item_id AND user_id = v_cust.user_id FOR UPDATE;
  IF v_item.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa no encontrada'); END IF;
  IF COALESCE(v_item.is_active, true) = false THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa inactiva'); END IF;
  IF v_item.valid_from IS NOT NULL AND v_item.valid_from > now() THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa aún no válida'); END IF;
  IF v_item.valid_until IS NOT NULL AND v_item.valid_until < now() THEN RETURN jsonb_build_object('ok', false, 'message', 'Recompensa expirada'); END IF;
  IF COALESCE(v_cust.current_points,0) < v_item.points_required THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Puntos insuficientes'); END IF;
  IF v_item.stock_limit IS NOT NULL AND COALESCE(v_item.stock_used,0) >= v_item.stock_limit THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sin stock de la recompensa'); END IF;

  BEGIN v_code := public.generate_redemption_code();
  EXCEPTION WHEN OTHERS THEN v_code := 'RW' || upper(substr(md5(random()::text),1,8)); END;

  v_new_balance := v_cust.current_points - v_item.points_required;

  INSERT INTO public.loyalty_rewards (user_id, customer_id, catalog_item_id, points_spent, redemption_code, expires_at)
  VALUES (v_cust.user_id, p_customer_id, p_catalog_item_id, v_item.points_required, v_code, now() + interval '30 days')
  RETURNING id INTO v_reward_id;

  UPDATE public.loyalty_customers SET current_points = v_new_balance, updated_at = now() WHERE id = p_customer_id;

  INSERT INTO public.loyalty_points_transactions (user_id, customer_id, points, transaction_type, source, source_id, description, balance_after)
  VALUES (v_cust.user_id, p_customer_id, -v_item.points_required, 'redeem', 'reward_redemption', v_reward_id, 'Canje: ' || v_item.name, v_new_balance);

  IF v_item.stock_limit IS NOT NULL THEN
    UPDATE public.loyalty_rewards_catalog SET stock_used = COALESCE(stock_used,0) + 1, updated_at = now() WHERE id = p_catalog_item_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'redemption_code', v_code, 'reward_id', v_reward_id, 'new_balance', v_new_balance);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(uuid, uuid) TO authenticated;
