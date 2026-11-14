ALTER TABLE public.table_reservations
  ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 90;

CREATE INDEX IF NOT EXISTS idx_table_reservations_table_id
  ON public.table_reservations(table_id);

CREATE INDEX IF NOT EXISTS idx_table_reservations_date_time
  ON public.table_reservations(user_id, reservation_date, reservation_time);