import { z } from 'zod';

export const ReceiveOrderItemSchema = z.object({
  id: z.string().min(1),
  quantity_received: z.coerce.number().min(0, 'Cantidad debe ser >= 0'),
  lot_number: z.string().max(80, 'Máx. 80 caracteres').optional(),
  expiration_date: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Fecha inválida'),
});

export const ReceiveOrderSchema = z.object({
  items: z.array(ReceiveOrderItemSchema).min(1, 'Debes recibir al menos un item'),
});

export type ReceiveOrderValues = z.infer<typeof ReceiveOrderSchema>;
