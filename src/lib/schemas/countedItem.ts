import { z } from 'zod';

export const CountedItemSchema = z.object({
  counted_quantity: z.coerce.number().min(0, 'La cantidad debe ser ≥ 0').max(1_000_000, 'Valor irreal'),
  notes: z.string().max(500, 'Máx. 500 caracteres').optional().default(''),
});

export type CountedItemValues = z.infer<typeof CountedItemSchema>;
