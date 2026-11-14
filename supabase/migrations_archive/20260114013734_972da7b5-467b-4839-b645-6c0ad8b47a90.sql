-- Create supplier_analysis table for storing AI analysis results
CREATE TABLE public.supplier_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  current_cost NUMERIC,
  current_supplier TEXT,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'México',
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  alternatives JSONB DEFAULT '[]'::jsonb,
  market_insights TEXT,
  recommendations TEXT[],
  potential_savings NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.supplier_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own supplier analyses"
  ON public.supplier_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own supplier analyses"
  ON public.supplier_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier analyses"
  ON public.supplier_analysis
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplier analyses"
  ON public.supplier_analysis
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_analysis_updated_at
  BEFORE UPDATE ON public.supplier_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_supplier_analysis_user_id ON public.supplier_analysis(user_id);
CREATE INDEX idx_supplier_analysis_item_id ON public.supplier_analysis(inventory_item_id);