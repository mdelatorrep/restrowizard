import { z } from 'zod';

export const OpenSessionSchema = z.object({
  cashier_name: z.string().trim().min(1, 'Nombre del cajero requerido').max(80),
  opening_cash: z.coerce.number().min(0, 'No puede ser negativo').max(1_000_000, 'Monto demasiado alto'),
});

export const CloseSessionSchema = z.object({
  actual_cash: z.coerce.number().min(0, 'No puede ser negativo').max(10_000_000),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
});

export type OpenSessionInput = z.infer<typeof OpenSessionSchema>;
export type CloseSessionInput = z.infer<typeof CloseSessionSchema>;
