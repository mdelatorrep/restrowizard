-- Datos de la demo (Clutch Sports Bar & Grill). Separado de las migraciones (B-04).
-- Crea los tres usuarios demo y el restaurante con 30 días de operación, más
-- domicilio, fidelización y catálogo de premios (seed_demo_extras).
SELECT public.seed_demo_restaurant();
SELECT public.seed_demo_extras();
