ALTER TABLE public.restaurant_brands REPLICA IDENTITY FULL;
ALTER TABLE public.restaurant_websites REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'restaurant_brands'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_brands;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'restaurant_websites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_websites;
  END IF;
END $$;