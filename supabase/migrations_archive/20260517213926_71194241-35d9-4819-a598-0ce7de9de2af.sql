
-- Extend aggregator_integrations
ALTER TABLE public.aggregator_integrations
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS client_secret_encrypted text,
  ADD COLUMN IF NOT EXISTS access_token_encrypted text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS store_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS sync_status jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS environment text DEFAULT 'sandbox';

-- Extend aggregator_orders
ALTER TABLE public.aggregator_orders
  ADD COLUMN IF NOT EXISTS raw_payload jsonb,
  ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS pickup_code text,
  ADD COLUMN IF NOT EXISTS courier_info jsonb,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS aggregator_orders_platform_external_uniq
  ON public.aggregator_orders (platform, external_order_id)
  WHERE external_order_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_aggregator_orders_updated_at ON public.aggregator_orders;
CREATE TRIGGER update_aggregator_orders_updated_at
  BEFORE UPDATE ON public.aggregator_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- rappi_menu_sync
CREATE TABLE IF NOT EXISTS public.rappi_menu_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL REFERENCES public.aggregator_integrations(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE,
  external_item_id text,
  store_id text,
  status text NOT NULL DEFAULT 'pending',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, menu_item_id, store_id)
);

ALTER TABLE public.rappi_menu_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rms_owner_all" ON public.rappi_menu_sync FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_rappi_menu_sync_updated_at BEFORE UPDATE ON public.rappi_menu_sync FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- rappi_store_status
CREATE TABLE IF NOT EXISTS public.rappi_store_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL REFERENCES public.aggregator_integrations(id) ON DELETE CASCADE,
  store_id text NOT NULL,
  status text NOT NULL,
  reason text,
  pause_until timestamptz,
  changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rappi_store_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rss_owner_all" ON public.rappi_store_status FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS rappi_store_status_store_idx ON public.rappi_store_status (integration_id, store_id, changed_at DESC);

-- rappi_webhook_events
CREATE TABLE IF NOT EXISTS public.rappi_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.aggregator_integrations(id) ON DELETE SET NULL,
  event_id text,
  event_type text,
  payload jsonb NOT NULL,
  signature text,
  processed boolean NOT NULL DEFAULT false,
  process_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);
ALTER TABLE public.rappi_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rwe_owner_select" ON public.rappi_webhook_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.aggregator_integrations ai WHERE ai.id = integration_id AND ai.user_id = auth.uid())
);

-- rappi_settlements
CREATE TABLE IF NOT EXISTS public.rappi_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL REFERENCES public.aggregator_integrations(id) ON DELETE CASCADE,
  store_id text,
  settlement_date date NOT NULL,
  gross_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'COP',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, store_id, settlement_date)
);
ALTER TABLE public.rappi_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rs_owner_all" ON public.rappi_settlements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.aggregator_orders;
