
ALTER TABLE public.restaurant_orders
  ADD COLUMN IF NOT EXISTS merged_into_order_id uuid REFERENCES public.restaurant_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transferred_from_table_id uuid REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transferred_by uuid,
  ADD COLUMN IF NOT EXISTS tip_breakdown jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_merged_into ON public.restaurant_orders(merged_into_order_id);

-- Realtime on menu tables for live catalog updates in POS
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.menu_item_modifiers REPLICA IDENTITY FULL;
ALTER TABLE public.menu_modifier_options REPLICA IDENTITY FULL;
ALTER TABLE public.menu_item_modifier_links REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_item_modifiers; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_modifier_options; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_item_modifier_links; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
