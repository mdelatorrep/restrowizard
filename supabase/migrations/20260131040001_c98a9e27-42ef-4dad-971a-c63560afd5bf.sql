-- Create suppliers table for restaurant supply chain management
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  category TEXT NOT NULL DEFAULT 'Otros',
  payment_terms TEXT,
  lead_time_days INTEGER,
  rating NUMERIC(2,1),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own suppliers"
ON public.suppliers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
ON public.suppliers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
ON public.suppliers FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX idx_suppliers_category ON public.suppliers(category);

-- Add trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();