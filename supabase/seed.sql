-- Datos de la demo (Clutch Sports Bar & Grill). Separado de las migraciones (B-04).
-- Crea los tres usuarios demo y el restaurante con 30 días de operación.
-- Lo usa `supabase db reset` en local y el trabajo programado demo-restaurant-reset.
SELECT public.seed_demo_restaurant();
