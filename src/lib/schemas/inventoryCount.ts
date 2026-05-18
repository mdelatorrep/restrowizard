import { z } from 'zod';

export const InventoryCountSchema = z.object({
  count_name: z.string().trim().max(160, 'Máx. 160 caracteres').optional().default(''),
  count_type: z.enum(['full', 'cycle', 'spot'], {
    errorMap: () => ({ message: 'Tipo de conteo inválido' }),
  }),
  storage_location_id: z.string().optional().default(''),
  counted_by: z.string().trim().max(120, 'Máx. 120 caracteres').optional().default(''),
  notes: z.string().max(1000, 'Máx. 1000 caracteres').optional().default(''),
});

export type InventoryCountValues = z.infer<typeof InventoryCountSchema>;
