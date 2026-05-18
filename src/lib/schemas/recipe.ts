import { z } from 'zod';

export const CreateRecipeSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto').max(160, 'Nombre demasiado largo'),
  category: z.string().min(1, 'Categoría requerida'),
  portions: z.coerce.number().int().min(1, 'Mínimo 1 porción').max(10000, 'Cantidad excesiva'),
  preparation_time_minutes: z.coerce.number().int().min(0, 'Inválido').max(10000, 'Tiempo excesivo'),
  difficulty: z.enum(['facil', 'media', 'dificil'], { errorMap: () => ({ message: 'Dificultad inválida' }) }),
  instructions: z.string().max(5000, 'Demasiado largo').optional().or(z.literal('')),
  tips: z.string().max(2000).optional().or(z.literal('')),
  is_secret: z.boolean().default(false),
  is_sub_recipe: z.boolean().default(false),
  yield_quantity: z.coerce.number().min(0).default(1),
  yield_unit: z.string().min(1, 'Unidad requerida'),
});

export type CreateRecipeValues = z.infer<typeof CreateRecipeSchema>;

export const RecipeIngredientSchema = z.object({
  ingredient_name: z.string().trim().min(1, 'Nombre del ingrediente requerido').max(160),
  quantity: z.coerce.number().min(0.0001, 'Cantidad debe ser > 0').max(1_000_000, 'Cantidad excesiva'),
  unit: z.string().min(1, 'Unidad requerida'),
  cost_per_unit: z.coerce.number().min(0, 'Costo inválido').max(10_000_000),
  yield_percentage: z.coerce.number().min(1, 'Mín. 1%').max(100, 'Máx. 100%').default(100),
});

export type RecipeIngredientValues = z.infer<typeof RecipeIngredientSchema>;

export const RecipeIngredientExtendedSchema = RecipeIngredientSchema.extend({
  gross_quantity: z.coerce.number().min(0).max(1_000_000).default(0),
  preparation_method: z.string().max(60).optional().or(z.literal('')),
  is_optional: z.boolean().default(false),
  calories_per_unit: z.coerce.number().min(0).max(100_000).default(0),
  protein_per_unit: z.coerce.number().min(0).max(10_000).default(0),
  carbs_per_unit: z.coerce.number().min(0).max(10_000).default(0),
  fat_per_unit: z.coerce.number().min(0).max(10_000).default(0),
  allergen_ids: z.array(z.string()).default([]),
}).refine(
  (v) => !v.gross_quantity || v.gross_quantity >= v.quantity,
  { message: 'Cantidad bruta debe ser ≥ cantidad neta', path: ['gross_quantity'] }
);

export type RecipeIngredientExtendedValues = z.infer<typeof RecipeIngredientExtendedSchema>;
