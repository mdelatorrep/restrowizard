import { z } from 'zod';

export const InventoryItemSchema = z.object({
  item_name: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  category: z.string().max(80).optional().default(''),
  current_stock: z.coerce.number().min(0, 'Debe ser ≥ 0').default(0),
  unit: z.string().min(1).default('unidades'),
  unit_cost: z.coerce.number().min(0).default(0),
  reorder_point: z.coerce.number().min(0).default(10),
  par_level: z.coerce.number().min(0).default(0),
  max_level: z.coerce.number().min(0).default(0),
  supplier_name: z.string().max(160).optional().default(''),
  storage_location_id: z.string().optional().default(''),
  preferred_supplier_id: z.string().optional().default(''),
  barcode: z.string().max(80).optional().default(''),
  sku: z.string().max(80).optional().default(''),
  purchase_unit: z.string().max(60).optional().default(''),
  purchase_quantity: z.coerce.number().min(1).default(1),
  min_order_quantity: z.coerce.number().min(1).default(1),
  lead_time_days: z.coerce.number().min(1).default(1),
  is_perishable: z.boolean().default(false),
  shelf_life_days: z.coerce.number().min(0).default(0),
  expiration_date: z.string().optional().default(''),
  lot_number: z.string().max(80).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
}).refine(
  (v) => !v.max_level || v.max_level >= v.par_level,
  { message: 'Stock máximo debe ser ≥ par level', path: ['max_level'] }
);

export type InventoryItemValues = z.infer<typeof InventoryItemSchema>;
