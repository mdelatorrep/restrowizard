import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido');

export const BrandSchema = z.object({
  brand_name: z.string().trim().min(2, 'Nombre muy corto').max(120),
  tagline: z.string().trim().max(200).optional().or(z.literal('')),
  primary_color: hex,
  secondary_color: hex,
  accent_color: hex,
  font_primary: z.string().trim().min(1, 'Tipografía requerida').max(80),
  font_secondary: z.string().trim().min(1, 'Tipografía requerida').max(80),
  brand_voice: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type BrandValues = z.infer<typeof BrandSchema>;
