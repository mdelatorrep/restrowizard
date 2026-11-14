-- Reserva pública desde el sitio web del restaurante, sin edge function.
--
-- La página /p/:slug/reservas llamaba a la edge website-public-reservation,
-- que nunca se desplegó (Lovable publica el frontend pero no las edge
-- functions): cada reserva desde la web devolvía 404. Como la política de
-- INSERT anónimo ya se había retirado, no había ningún camino para reservar.
--
-- Mismas validaciones que la edge (B-15): sitio publicado y con reservas
-- activas, tamaño de grupo, fecha no pasada y dentro de la ventana, límite de
-- 3 solicitudes por teléfono en 10 min. Se agrega un tope de 30 solicitudes
-- por restaurante por hora contra inundación. Los errores salen como mensajes
-- en español que la página muestra tal cual.

CREATE OR REPLACE FUNCTION public.public_create_reservation(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_party_size integer,
  p_reservation_date date,
  p_reservation_time time,
  p_customer_email text DEFAULT NULL,
  p_special_requests text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_site record;
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_phone text := left(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9+]', '', 'g'), 20);
  v_name text := left(btrim(coalesce(p_customer_name, '')), 100);
  v_recent integer;
  v_code text;
BEGIN
  SELECT w.user_id, w.show_reservations, w.reservation_max_party_size, w.reservation_advance_days
    INTO v_site
    FROM restaurant_websites w
   WHERE w.slug = p_slug AND w.is_published
   LIMIT 1;
  IF v_site IS NULL THEN
    RAISE EXCEPTION 'Restaurante no encontrado' USING ERRCODE = 'P0001';
  END IF;
  IF NOT coalesce(v_site.show_reservations, false) THEN
    RAISE EXCEPTION 'Este restaurante no recibe reservas en línea' USING ERRCODE = 'P0001';
  END IF;
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'Escribe tu nombre' USING ERRCODE = 'P0001';
  END IF;
  IF length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 7 THEN
    RAISE EXCEPTION 'Teléfono inválido' USING ERRCODE = 'P0001';
  END IF;
  IF p_party_size IS NULL OR p_party_size < 1 OR p_party_size > coalesce(v_site.reservation_max_party_size, 30) THEN
    RAISE EXCEPTION 'El máximo por reserva es % personas', coalesce(v_site.reservation_max_party_size, 30) USING ERRCODE = 'P0001';
  END IF;
  IF p_reservation_date IS NULL OR p_reservation_date < v_today THEN
    RAISE EXCEPTION 'La fecha ya pasó' USING ERRCODE = 'P0001';
  END IF;
  IF p_reservation_date > v_today + coalesce(v_site.reservation_advance_days, 60) THEN
    RAISE EXCEPTION 'Solo se puede reservar con % días de anticipación', coalesce(v_site.reservation_advance_days, 60) USING ERRCODE = 'P0001';
  END IF;
  IF p_reservation_date = v_today AND p_reservation_time < (now() AT TIME ZONE 'America/Bogota')::time THEN
    RAISE EXCEPTION 'Esa hora ya pasó' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_recent FROM table_reservations
   WHERE user_id = v_site.user_id AND customer_phone = v_phone AND created_at > now() - interval '10 minutes';
  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Demasiadas solicitudes. Intenta en unos minutos.' USING ERRCODE = 'P0001';
  END IF;
  SELECT count(*) INTO v_recent FROM table_reservations
   WHERE user_id = v_site.user_id AND source = 'website' AND created_at > now() - interval '1 hour';
  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'El restaurante recibió muchas solicitudes. Intenta más tarde o llama.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO table_reservations (user_id, customer_name, customer_email, customer_phone, party_size,
                                  reservation_date, reservation_time, special_requests, source, status)
  VALUES (v_site.user_id, v_name, nullif(left(btrim(coalesce(p_customer_email, '')), 255), ''), v_phone,
          p_party_size, p_reservation_date, p_reservation_time,
          nullif(left(btrim(coalesce(p_special_requests, '')), 500), ''), 'website', 'pending')
  RETURNING confirmation_code INTO v_code;

  RETURN jsonb_build_object('ok', true, 'confirmation_code', v_code);
END $$;

REVOKE ALL ON FUNCTION public.public_create_reservation(text, text, text, integer, date, time, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_create_reservation(text, text, text, integer, date, time, text, text) TO anon, authenticated;
