-- Marca y sitio web del restaurante demo (ficticio).
--
-- Sin marca ni sitio, la demo mostraba "Crea tu identidad de marca" y
-- "Crea tu sitio web", el marketing no tenía voz ni link de reservas, y la
-- reserva pública (/p/clutch-sports-bar/reservas) no se podía mostrar.
-- Domicilios web queda apagado a propósito: la edge website-public-order
-- publicada es la versión vieja (precio manipulable, B-03).

CREATE OR REPLACE FUNCTION public._demo_seed_marketing()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c_owner uuid := demo_owner_id();
  v_template uuid;
BEGIN
  DELETE FROM marketing_content WHERE user_id = c_owner;
  DELETE FROM restaurant_websites WHERE user_id = c_owner;
  DELETE FROM restaurant_brands WHERE user_id = c_owner;

  INSERT INTO restaurant_brands (user_id, brand_name, tagline, primary_color, secondary_color, accent_color,
                                 font_primary, font_secondary, brand_voice, brand_values, social_links,
                                 mission, story, target_audience, differentiators)
  VALUES (c_owner, 'Clutch Sports Bar & Grill', 'Donde se vive cada jugada',
          '#0B1F3A', '#E4572E', '#F2C14E', 'Inter', 'Inter',
          'Cercano, futbolero y directo. Hablamos como el amigo que sabe de deporte: sin exageraciones, sin descuentos de liquidación y sin mayúsculas gritonas.',
          '["Ambiente de estadio", "Cocina americana hecha en casa", "Servicio rápido en hora pico", "Mesas para el parche"]'::jsonb,
          '{"instagram": "@clutchsportsbar.demo"}'::jsonb,
          'Que ver un partido con amigos sea el mejor plan de la semana.',
          'Nacimos en Laureles para los que viven la NFL, la Champions y la Premier en grupo y con buena comida.',
          'Profesionales de 25 a 40 años de Laureles y El Poblado que ven deporte en grupo',
          '["Pantallas en todas las mesas", "Alitas y costillas ahumadas en casa", "Brunch de fin de semana"]'::jsonb);

  SELECT id INTO v_template FROM website_templates WHERE layout_type = 'bold' AND is_active LIMIT 1;

  INSERT INTO restaurant_websites (user_id, slug, template_id, is_published, site_title, meta_description,
                                   show_menu, show_delivery, show_reservations, show_contact, show_about, show_loyalty,
                                   hero_title, hero_subtitle, hero_cta_text, hero_cta_link,
                                   about_title, about_description, reservation_max_party_size, reservation_advance_days,
                                   reservation_slot_duration, business_hours, instagram_handle, footer_text, show_powered_by)
  VALUES (c_owner, 'clutch-sports-bar', v_template, true, 'Clutch Sports Bar & Grill · Laureles, Medellín',
          'Sports bar en Laureles: NFL, Champions y Premier en pantallas gigantes, alitas, costillas y brunch de fin de semana.',
          true, false, true, true, true, false,
          'Cada jugada se vive mejor aquí', '32 mesas, pantallas gigantes y la cocina abierta hasta la 1 a. m.',
          'Reservar mesa', '#reservas',
          'El plan del partido', 'Alitas, costillas ahumadas y cubetas bien frías frente a la pantalla. Reserva para el partido grande: los domingos de NFL se llena.',
          12, 30, 120,
          '{"monday":{"open":"13:00","close":"00:00"},"tuesday":{"open":"13:00","close":"00:00"},"wednesday":{"open":"13:00","close":"02:00"},"thursday":{"open":"13:00","close":"02:00"},"friday":{"open":"13:00","close":"02:00"},"saturday":{"open":"10:00","close":"02:00"},"sunday":{"open":"10:00","close":"00:00"}}'::jsonb,
          'clutchsportsbar.demo', 'Restaurante ficticio de demostración de RestroWizard.', true);
END $$;

REVOKE ALL ON FUNCTION public._demo_seed_marketing() FROM PUBLIC, anon, authenticated;
