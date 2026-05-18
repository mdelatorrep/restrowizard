
-- ============================================
-- Fase 3.1 — OCR de facturas
-- ============================================

CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid,
  supplier_id uuid REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL,
  supplier_name text,
  invoice_number text,
  invoice_date date,
  due_date date,
  currency text DEFAULT 'COP',
  subtotal numeric(14,2),
  tax_amount numeric(14,2),
  total_amount numeric(14,2),
  items jsonb DEFAULT '[]'::jsonb,
  raw_text text,
  image_url text,
  storage_path text,
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | rejected
  ai_confidence numeric(3,2),
  ai_model text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_user ON public.supplier_invoices(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON public.supplier_invoices(supplier_id);

ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own invoices"
  ON public.supplier_invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket privado para facturas
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read their own invoice files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own invoice files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own invoice files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own invoice files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Fase 3.4 — Realtime para copilot_alerts
-- ============================================

ALTER TABLE public.copilot_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.copilot_alerts;
