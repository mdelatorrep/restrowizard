import { z } from 'zod';

export const MenuItemSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().max(1000, 'Máximo 1000 caracteres').nullable().optional(),
  price: z.number({ invalid_type_error: 'Precio inválido' }).min(0, 'El precio no puede ser negativo'),
  category: z.string().trim().min(1, 'La categoría es requerida'),
  category_id: z.string().uuid().nullable().optional(),
  dietary_tags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  preparation_time_minutes: z.number().int().min(0).max(600).nullable().optional(),
  calories: z.number().int().min(0).max(10000).nullable().optional(),
  spicy_level: z.number().int().min(0).max(5).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  recipe_id: z.string().uuid().nullable().optional(),
});

export type MenuItemInput = z.infer<typeof MenuItemSchema>;
