-- B-07: la llave privada de cada pasarela de pago se guarda cifrada en Vault.
-- En la tabla queda solo una máscara (••••1234) y el id del secreto; ningún
-- SELECT del cliente devuelve la llave. pos-payment-processor la descifra en
-- el servidor con payment_gateway_private_key().

ALTER TABLE public.payment_gateway_credentials
  ADD COLUMN IF NOT EXISTS private_key_secret_id uuid;

CREATE OR REPLACE FUNCTION public.tg_payment_gateway_vault_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_plain text := NEW.private_key;
BEGIN
  -- Solo actúa si llega una llave nueva en claro (no la máscara).
  IF v_plain IS NULL OR v_plain = '' OR v_plain LIKE '••••%' THEN
    IF TG_OP = 'UPDATE' AND (v_plain IS NULL OR v_plain = '') AND OLD.private_key_secret_id IS NOT NULL THEN
      NEW.private_key := OLD.private_key;  -- conservar la máscara
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.private_key_secret_id IS NOT NULL THEN
    PERFORM vault.update_secret(OLD.private_key_secret_id, v_plain);
    NEW.private_key_secret_id := OLD.private_key_secret_id;
  ELSE
    NEW.private_key_secret_id := vault.create_secret(
      v_plain, 'pgw_' || NEW.id::text, 'Llave privada de pasarela ' || NEW.gateway);
  END IF;
  NEW.private_key := '••••' || right(v_plain, 4);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.tg_payment_gateway_vault_key() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS aa_payment_gateway_vault_key ON public.payment_gateway_credentials;
CREATE TRIGGER aa_payment_gateway_vault_key
  BEFORE INSERT OR UPDATE ON public.payment_gateway_credentials
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_gateway_vault_key();

-- Llaves existentes en claro (hoy 0 filas): pasarlas a Vault.
UPDATE public.payment_gateway_credentials
   SET private_key = private_key
 WHERE private_key IS NOT NULL AND private_key <> '' AND private_key NOT LIKE '••••%';

-- Descifra la llave; solo el servidor (service_role) puede llamarla.
CREATE OR REPLACE FUNCTION public.payment_gateway_private_key(p_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT s.decrypted_secret
    FROM public.payment_gateway_credentials c
    JOIN vault.decrypted_secrets s ON s.id = c.private_key_secret_id
   WHERE c.id = p_id;
$$;
REVOKE ALL ON FUNCTION public.payment_gateway_private_key(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.payment_gateway_private_key(uuid) TO service_role;
