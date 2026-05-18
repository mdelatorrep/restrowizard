import { z } from 'zod';

export const ShiftTemplateSchema = z.object({
  template_name: z.string().trim().min(2, 'Nombre demasiado corto').max(80),
  position: z.string().trim().max(60).optional().or(z.literal('')),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  break_minutes: z.coerce.number().int().min(0).max(480),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido'),
  description: z.string().trim().max(300).optional().or(z.literal('')),
});

export type ShiftTemplateInput = z.infer<typeof ShiftTemplateSchema>;
