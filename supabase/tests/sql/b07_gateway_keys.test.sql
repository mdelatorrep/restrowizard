-- B-07: la llave privada queda en Vault; la tabla solo guarda una máscara.
BEGIN;
DO $$
DECLARE v_id uuid; v_owner uuid := (SELECT owner_id FROM public.restaurant_businesses LIMIT 1); v_row record;
BEGIN
  INSERT INTO public.payment_gateway_credentials (user_id, gateway, public_key, private_key)
  VALUES (v_owner, 'wompi', 'pub_test_x', 'prv_test_ABCDEFGH1234') RETURNING id INTO v_id;
  SELECT * INTO v_row FROM public.payment_gateway_credentials WHERE id = v_id;
  IF v_row.private_key <> '••••1234' THEN RAISE EXCEPTION 'la tabla guarda la llave en claro: %', v_row.private_key; END IF;
  IF public.payment_gateway_private_key(v_id) <> 'prv_test_ABCDEFGH1234' THEN RAISE EXCEPTION 'no se descifra'; END IF;
  UPDATE public.payment_gateway_credentials SET is_active = true WHERE id = v_id;  -- sin llave nueva
  IF public.payment_gateway_private_key(v_id) <> 'prv_test_ABCDEFGH1234' THEN RAISE EXCEPTION 'perdió la llave al actualizar'; END IF;
  UPDATE public.payment_gateway_credentials SET private_key = 'prv_test_NEW99999' WHERE id = v_id;
  IF public.payment_gateway_private_key(v_id) <> 'prv_test_NEW99999' THEN RAISE EXCEPTION 'no rotó la llave'; END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  PERFORM public.payment_gateway_private_key(gen_random_uuid());
  RAISE EXCEPTION 'authenticated pudo descifrar';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
ROLLBACK;
\echo 'ok b07_gateway_keys'
