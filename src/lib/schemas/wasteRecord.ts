import { z } from 'zod';

export const WasteRecordSchema = z.object({
  inventory_item_id: z.string().min(1, 'Producto requerido'),
  quantity: z.coerce.number().min(0.0001, 'Cantidad debe ser > 0'),
  waste_reason: z.enum(['spoilage', 'expired', 'damaged', 'preparation', 'over_production', 'other'], {
    errorMap: () => ({ message: 'Razón inválida' }),
  }),
  is_preventable: z.boolean().default(false),
  lot_number: z.string().max(80).optional().default(''),
  storage_location_id: z.string().optional().default(''),
  notes: z.string().max(1000, 'Máx. 1000 caracteres').optional().default(''),
  reported_by: z.string().max(120).optional().default(''),
});

export type WasteRecordValues = z.infer<typeof WasteRecordSchema>;
