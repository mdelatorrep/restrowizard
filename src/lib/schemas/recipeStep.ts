import { z } from 'zod';

export const RecipeStepSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal('')),
  instruction: z.string().trim().min(3, 'Instrucción requerida').max(2000),
  duration_minutes: z.coerce.number().int().min(0).max(1440),
  temperature_celsius: z.coerce.number().int().min(0).max(500),
  technique: z.string().trim().max(60).optional().or(z.literal('')),
  equipment: z.string().trim().max(120).optional().or(z.literal('')),
  tips: z.string().trim().max(500).optional().or(z.literal('')),
  critical_point: z.boolean(),
  photo_url: z.string().trim().url('URL inválida').optional().or(z.literal('')),
});

export type RecipeStepInput = z.infer<typeof RecipeStepSchema>;
