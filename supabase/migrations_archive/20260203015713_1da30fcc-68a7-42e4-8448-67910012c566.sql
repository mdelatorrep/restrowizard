-- =====================================================
-- ENTERPRISE INVENTORY MANAGEMENT SYSTEM
-- =====================================================

-- 1. Storage locations / warehouses
CREATE TABLE IF NOT EXISTS public.storage_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  location_type VARCHAR(50) DEFAULT 'dry_storage', -- dry_storage, refrigerator, freezer, bar, prep_area
  temperature_range VARCHAR(50), -- e.g., "2-4°C", "-18°C"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Extend inventory_items table with professional fields
ALTER TABLE public.inventory_items 
  ADD COLUMN IF NOT EXISTS storage_location_id UUID REFERENCES public.storage_locations(id),
  ADD COLUMN IF NOT EXISTS par_level NUMERIC(10,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_level NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS expiration_date DATE,
  ADD COLUMN IF NOT EXISTS lot_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sku VARCHAR(50),
  ADD COLUMN IF NOT EXISTS purchase_unit VARCHAR(50), -- e.g., "caja"
  ADD COLUMN IF NOT EXISTS purchase_quantity NUMERIC(10,3) DEFAULT 1, -- units per purchase_unit
  ADD COLUMN IF NOT EXISTS min_order_quantity NUMERIC(10,3) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_supplier_id UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Supplier management
CREATE TABLE IF NOT EXISTS public.inventory_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  payment_terms VARCHAR(100), -- e.g., "Net 30", "COD"
  minimum_order NUMERIC(10,2),
  delivery_days VARCHAR(100), -- e.g., "Lun, Mié, Vie"
  lead_time_days INTEGER DEFAULT 1,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3,2), -- 1.00 to 5.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Item-Supplier relationship with pricing history
CREATE TABLE IF NOT EXISTS public.inventory_item_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.inventory_suppliers(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(100),
  unit_cost NUMERIC(10,4) NOT NULL,
  purchase_unit VARCHAR(50),
  units_per_purchase NUMERIC(10,3) DEFAULT 1,
  is_preferred BOOLEAN DEFAULT false,
  min_order_quantity NUMERIC(10,3) DEFAULT 1,
  last_ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(inventory_item_id, supplier_id)
);

-- 5. Price history tracking
CREATE TABLE IF NOT EXISTS public.inventory_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL,
  old_price NUMERIC(10,4),
  new_price NUMERIC(10,4) NOT NULL,
  change_percentage NUMERIC(5,2),
  change_reason VARCHAR(200),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  recorded_by UUID
);

-- 6. Inventory movements/transactions
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL, -- receiving, adjustment, waste, transfer, usage, return, count
  quantity_change NUMERIC(10,3) NOT NULL, -- positive for in, negative for out
  quantity_before NUMERIC(10,3) NOT NULL,
  quantity_after NUMERIC(10,3) NOT NULL,
  unit_cost NUMERIC(10,4),
  total_cost NUMERIC(12,4),
  reference_type VARCHAR(50), -- purchase_order, count, recipe, transfer, waste
  reference_id UUID,
  from_location_id UUID REFERENCES public.storage_locations(id),
  to_location_id UUID REFERENCES public.storage_locations(id),
  lot_number VARCHAR(100),
  expiration_date DATE,
  notes TEXT,
  performed_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.inventory_suppliers(id),
  order_number VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'draft', -- draft, sent, partial, received, cancelled
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  received_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  created_by VARCHAR(100),
  received_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Purchase Order Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity_ordered NUMERIC(10,3) NOT NULL,
  quantity_received NUMERIC(10,3) DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  unit_cost NUMERIC(10,4) NOT NULL,
  total_cost NUMERIC(12,4) NOT NULL,
  lot_number VARCHAR(100),
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Physical Inventory Counts
CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  count_name VARCHAR(200) NOT NULL,
  count_type VARCHAR(50) DEFAULT 'full', -- full, cycle, spot
  status VARCHAR(30) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  storage_location_id UUID REFERENCES public.storage_locations(id),
  scheduled_date DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  counted_by VARCHAR(100),
  verified_by VARCHAR(100),
  total_items INTEGER DEFAULT 0,
  items_counted INTEGER DEFAULT 0,
  total_variance_value NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Count Items (detailed count entries)
CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  system_quantity NUMERIC(10,3) NOT NULL,
  counted_quantity NUMERIC(10,3),
  variance_quantity NUMERIC(10,3),
  variance_value NUMERIC(10,2),
  variance_percentage NUMERIC(5,2),
  unit_cost NUMERIC(10,4),
  notes TEXT,
  counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Waste/Spoilage tracking
CREATE TABLE IF NOT EXISTS public.inventory_waste (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  waste_date DATE DEFAULT CURRENT_DATE,
  quantity NUMERIC(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_cost NUMERIC(10,4),
  total_cost NUMERIC(12,4),
  waste_reason VARCHAR(100) NOT NULL, -- spoilage, expired, damaged, preparation, over_production, other
  is_preventable BOOLEAN DEFAULT false,
  lot_number VARCHAR(100),
  storage_location_id UUID REFERENCES public.storage_locations(id),
  notes TEXT,
  reported_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. Expiration alerts view
CREATE OR REPLACE VIEW public.inventory_expiring_soon AS
SELECT 
  i.id,
  i.user_id,
  i.item_name,
  i.current_stock,
  i.unit,
  i.expiration_date,
  i.lot_number,
  sl.location_name as storage_location,
  CASE 
    WHEN i.expiration_date <= CURRENT_DATE THEN 'expired'
    WHEN i.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'critical'
    WHEN i.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'warning'
    ELSE 'ok'
  END as expiration_status,
  i.expiration_date - CURRENT_DATE as days_until_expiry
FROM public.inventory_items i
LEFT JOIN public.storage_locations sl ON sl.id = i.storage_location_id
WHERE i.expiration_date IS NOT NULL
  AND i.current_stock > 0
ORDER BY i.expiration_date ASC;

-- 13. Low stock alerts view
CREATE OR REPLACE VIEW public.inventory_below_par AS
SELECT 
  i.id,
  i.user_id,
  i.item_name,
  i.current_stock,
  i.par_level,
  i.reorder_point,
  i.unit,
  i.unit_cost,
  (i.par_level - i.current_stock) as quantity_to_order,
  ((i.par_level - i.current_stock) * COALESCE(i.unit_cost, 0)) as estimated_order_cost,
  s.supplier_name as preferred_supplier,
  i.lead_time_days
FROM public.inventory_items i
LEFT JOIN public.inventory_suppliers s ON s.id = i.preferred_supplier_id
WHERE i.current_stock < i.par_level
  AND i.par_level > 0
ORDER BY (i.par_level - i.current_stock) DESC;

-- Enable RLS
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_item_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_waste ENABLE ROW LEVEL SECURITY;

-- RLS Policies for storage_locations
CREATE POLICY "Users can view own storage locations" ON public.storage_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create storage locations" ON public.storage_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own storage locations" ON public.storage_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own storage locations" ON public.storage_locations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory_suppliers
CREATE POLICY "Users can view own suppliers" ON public.inventory_suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create suppliers" ON public.inventory_suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.inventory_suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.inventory_suppliers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory_item_suppliers
CREATE POLICY "Users can view own item suppliers" ON public.inventory_item_suppliers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can create item suppliers" ON public.inventory_item_suppliers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can update own item suppliers" ON public.inventory_item_suppliers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can delete own item suppliers" ON public.inventory_item_suppliers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND i.user_id = auth.uid())
);

-- RLS Policies for inventory_price_history
CREATE POLICY "Users can view own price history" ON public.inventory_price_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can create price history" ON public.inventory_price_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND i.user_id = auth.uid())
);

-- RLS Policies for inventory_movements
CREATE POLICY "Users can view own movements" ON public.inventory_movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create movements" ON public.inventory_movements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view own purchase orders" ON public.purchase_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create purchase orders" ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchase orders" ON public.purchase_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchase orders" ON public.purchase_orders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for purchase_order_items
CREATE POLICY "Users can view own PO items" ON public.purchase_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.user_id = auth.uid())
);
CREATE POLICY "Users can create PO items" ON public.purchase_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.user_id = auth.uid())
);
CREATE POLICY "Users can update own PO items" ON public.purchase_order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.user_id = auth.uid())
);
CREATE POLICY "Users can delete own PO items" ON public.purchase_order_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.user_id = auth.uid())
);

-- RLS Policies for inventory_counts
CREATE POLICY "Users can view own counts" ON public.inventory_counts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create counts" ON public.inventory_counts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own counts" ON public.inventory_counts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own counts" ON public.inventory_counts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory_count_items
CREATE POLICY "Users can view own count items" ON public.inventory_count_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inventory_counts c WHERE c.id = count_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can create count items" ON public.inventory_count_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.inventory_counts c WHERE c.id = count_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can update own count items" ON public.inventory_count_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.inventory_counts c WHERE c.id = count_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can delete own count items" ON public.inventory_count_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.inventory_counts c WHERE c.id = count_id AND c.user_id = auth.uid())
);

-- RLS Policies for inventory_waste
CREATE POLICY "Users can view own waste" ON public.inventory_waste FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create waste" ON public.inventory_waste FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own waste" ON public.inventory_waste FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own waste" ON public.inventory_waste FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-generate PO number
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_po_number();

-- Function to record price changes
CREATE OR REPLACE FUNCTION public.record_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.unit_cost IS DISTINCT FROM NEW.unit_cost THEN
    INSERT INTO public.inventory_price_history (
      inventory_item_id, 
      old_price, 
      new_price, 
      change_percentage
    )
    VALUES (
      NEW.id,
      OLD.unit_cost,
      NEW.unit_cost,
      CASE WHEN OLD.unit_cost > 0 
        THEN ROUND(((NEW.unit_cost - OLD.unit_cost) / OLD.unit_cost * 100)::NUMERIC, 2)
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_price_change
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.record_price_change();

-- Function to record inventory movements when stock changes
CREATE OR REPLACE FUNCTION public.record_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stock IS DISTINCT FROM NEW.current_stock THEN
    INSERT INTO public.inventory_movements (
      user_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      unit_cost,
      total_cost
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      'adjustment',
      NEW.current_stock - OLD.current_stock,
      OLD.current_stock,
      NEW.current_stock,
      NEW.unit_cost,
      (NEW.current_stock - OLD.current_stock) * COALESCE(NEW.unit_cost, 0)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_inventory_movement
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.record_inventory_movement();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON public.inventory_items(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiration ON public.inventory_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_storage ON public.inventory_items(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON public.inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON public.inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_status ON public.inventory_counts(status);