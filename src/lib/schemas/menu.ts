import { z } from 'zod';

export const CreateMenuSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  cuisine_type: z.string().trim().min(1, 'Selecciona un tipo de cocina').max(80),
  template_id: z.string().uuid().optional(),
});

export type CreateMenuInput = z.infer<typeof CreateMenuSchema>;
