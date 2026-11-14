-- Add payment gateway credentials table (per restaurant)
CREATE TABLE public.payment_gateway_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gateway TEXT NOT NULL CHECK (gateway IN ('wompi', 'bold', 'mercadopago', 'epayco')),
  public_key TEXT,
  private_key TEXT,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gateway)
);

-- Enable RLS
ALTER TABLE public.payment_gateway_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own credentials" 
ON public.payment_gateway_credentials FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials" 
ON public.payment_gateway_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" 
ON public.payment_gateway_credentials FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" 
ON public.payment_gateway_credentials FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_payment_gateway_credentials_updated_at
BEFORE UPDATE ON public.payment_gateway_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add kitchen_status to restaurant_orders for KDS
ALTER TABLE public.restaurant_orders 
ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'pending' CHECK (kitchen_status IN ('pending', 'preparing', 'ready', 'served')),
ADD COLUMN IF NOT EXISTS kitchen_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kitchen_ready_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kitchen_notes TEXT;

-- Enable realtime for orders (for KDS)
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_orders;

-- Create inventory_deductions table to track deductions
CREATE TABLE public.inventory_deductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.restaurant_orders(id),
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  recipe_id UUID REFERENCES public.recipes(id),
  quantity_deducted NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  deducted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_deductions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own deductions" 
ON public.inventory_deductions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deductions" 
ON public.inventory_deductions FOR INSERT WITH CHECK (auth.uid() = user_id);