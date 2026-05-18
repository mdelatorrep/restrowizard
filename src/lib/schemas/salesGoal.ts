import { z } from 'zod';

export const SalesGoalSchema = z.object({
  period_type: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  period_start: z.string().min(1, 'Fecha de inicio requerida'),
  period_end: z.string().min(1, 'Fecha de fin requerida'),
  revenue_goal: z.coerce.number().positive('La meta de ventas debe ser mayor a 0'),
  covers_goal: z.coerce.number().min(0).optional(),
  avg_ticket_goal: z.coerce.number().min(0).optional(),
}).refine(
  (v) => new Date(v.period_end) >= new Date(v.period_start),
  { message: 'La fecha de fin debe ser posterior a la de inicio', path: ['period_end'] }
);

export type SalesGoalInput = z.infer<typeof SalesGoalSchema>;
