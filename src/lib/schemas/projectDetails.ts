import { z } from 'zod';

export const ProjectDetailsSchema = z.object({
  target_opening_date: z.string().optional(),
  estimated_budget: z
    .number({ invalid_type_error: 'Presupuesto inválido' })
    .min(0, 'El presupuesto no puede ser negativo')
    .optional(),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
});

export type ProjectDetailsInput = z.infer<typeof ProjectDetailsSchema>;
