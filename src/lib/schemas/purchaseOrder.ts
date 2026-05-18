import { z } from 'zod';

export const PurchaseOrderItemSchema = z.object({
  inventory_item_id: z.string().min(1, 'Producto requerido'),
  quantity: z.coerce.number().min(0.01, 'Cantidad debe ser > 0'),
  unit_cost: z.coerce.number().min(0, 'Costo debe ser ≥ 0'),
});

export const PurchaseOrderSchema = z.object({
  supplier_id: z.string().optional().default(''),
  expected_delivery: z.string().optional().default(''),
  notes: z.string().max(1000, 'Máx. 1000 caracteres').optional().default(''),
  items: z.array(PurchaseOrderItemSchema).min(1, 'Agrega al menos un ítem'),
});

export type PurchaseOrderValues = z.infer<typeof PurchaseOrderSchema>;
export type PurchaseOrderItemValues = z.infer<typeof PurchaseOrderItemSchema>;
