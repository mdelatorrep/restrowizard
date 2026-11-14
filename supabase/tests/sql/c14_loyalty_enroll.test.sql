-- C-14: un comensal sin cuenta se inscribe desde el sitio; un teléfono ya
-- inscrito no revela el código; sin autorización de datos no se inscribe.
BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE r jsonb;
BEGIN
  r := public.public_loyalty_enroll('clutch-sports-bar', 'Ana Prueba', '300 555 0101', 'ana@example.com', true);
  IF r->>'status' <> 'created' OR length(r->>'code') < 6 THEN RAISE EXCEPTION 'inscripción nueva falló: %', r; END IF;

  r := public.public_loyalty_enroll('clutch-sports-bar', 'Otra Persona', '3005550101', NULL, true);
  IF r->>'status' <> 'exists' OR r ? 'code' THEN RAISE EXCEPTION 'teléfono repetido reveló datos: %', r; END IF;

  r := public.public_loyalty_enroll('clutch-sports-bar', 'Sin Permiso', '3005550102', NULL, false);
  IF r->>'status' <> 'error' THEN RAISE EXCEPTION 'inscribió sin autorización: %', r; END IF;

  r := public.public_loyalty_enroll('no-existe', 'Ana', '3005550103', NULL, true);
  IF r->>'status' <> 'error' THEN RAISE EXCEPTION 'inscribió en un slug inexistente: %', r; END IF;
END $$;
RESET ROLE;
DO $$
DECLARE r jsonb;
BEGIN
  SET LOCAL ROLE anon;
  r := public.public_loyalty_profile((SELECT loyalty_code FROM public.loyalty_customers WHERE customer_phone = '3005550101' LIMIT 1));
  IF jsonb_array_length(r->'catalog') < 3 THEN RAISE EXCEPTION 'el portal no muestra el catálogo demo: %', r->'catalog'; END IF;
END $$;
ROLLBACK;
\echo 'ok c14_loyalty_enroll'
