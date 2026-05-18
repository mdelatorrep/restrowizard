import { z } from 'zod';

export const LinkRecipeSchema = z.object({
  recipeId: z.string().uuid({ message: 'Receta inválida' }),
  menuItemId: z.string().uuid({ message: 'Selecciona un producto del menú' }),
});

export const CreateMenuItemFromRecipeSchema = z.object({
  recipeId: z.string().uuid({ message: 'Receta inválida' }),
  menuId: z.string().uuid({ message: 'Selecciona un menú destino' }),
  markupPercentage: z
    .number({ invalid_type_error: 'Markup inválido' })
    .min(100, 'El markup debe ser al menos 100%')
    .max(2000, 'Markup demasiado alto'),
});

export type LinkRecipeInput = z.infer<typeof LinkRecipeSchema>;
export type CreateMenuItemFromRecipeInput = z.infer<typeof CreateMenuItemFromRecipeSchema>;
