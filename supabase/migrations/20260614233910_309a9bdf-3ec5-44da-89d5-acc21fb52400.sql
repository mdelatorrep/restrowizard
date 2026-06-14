-- BL-11: tax configuration per restaurant + BL-07: oversell flag
ALTER TABLE public.restaurant_businesses
  ADD COLUMN IF NOT EXISTS tax_config jsonb NOT NULL DEFAULT '{"type":"exento","rate":0,"included_in_price":false,"label":"Exento"}'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_oversell boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.restaurant_businesses.tax_config IS 'POS tax configuration: { type: iva|impoconsumo|exento, rate (0-1), included_in_price, label }';
COMMENT ON COLUMN public.restaurant_businesses.allow_oversell IS 'If true, POS warns but allows selling dishes with out-of-stock ingredients; if false, blocks.';