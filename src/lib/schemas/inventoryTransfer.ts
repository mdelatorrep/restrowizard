import { z } from 'zod';

export const InventoryTransferSchema = z.object({
  selectedItemId: z.string().min(1, 'Selecciona un producto'),
  toLocationId: z.string().min(1, 'Selecciona ubicación destino'),
  quantity: z.coerce.number().min(1, 'Cantidad mínima 1'),
  notes: z.string().max(500).optional().default(''),
});

export type InventoryTransferValues = z.infer<typeof InventoryTransferSchema>;
