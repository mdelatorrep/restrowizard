
-- Limpiar el ítem corrupto detectado (Fresas frescasCrema batida con $90.007.000)
DELETE FROM public.inventory_items WHERE id = 'fabc5a7f-59fe-4274-ad56-41df4f519600';

-- Validaciones de datos: rangos razonables (no usar CHECK con now() para evitar inmutabilidad)
ALTER TABLE public.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_unit_cost_range,
  DROP CONSTRAINT IF EXISTS inventory_items_current_stock_nonneg,
  DROP CONSTRAINT IF EXISTS inventory_items_item_name_min;

ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_unit_cost_range CHECK (unit_cost IS NULL OR (unit_cost >= 0 AND unit_cost < 100000000)),
  ADD CONSTRAINT inventory_items_current_stock_nonneg CHECK (current_stock IS NULL OR current_stock >= 0),
  ADD CONSTRAINT inventory_items_item_name_min CHECK (char_length(trim(item_name)) >= 2);

-- Agregar columnas opcionales para LATAM en staff_members
ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS contract_type text;
