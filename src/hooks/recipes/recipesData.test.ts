import { describe, it, expect, vi } from 'vitest';

// El módulo importa el cliente de Supabase al cargarse (se crea en el import).
// Solo se prueban las funciones puras, así que basta con neutralizarlo.
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));

import { ingredientLineCost, scaleRecipeCost, computeRecipeKPIs } from './recipesData';
import type { RecipeWithDetails } from './recipesData';

/**
 * B-33 — El costo escalado tiene que coincidir con `recalculate_recipe_cost`.
 *
 * El chef escala una receta para un evento y COTIZA AL CLIENTE con ese número.
 * Los valores de este archivo están verificados contra la BD de producción.
 */

describe('ingredientLineCost — B-33: la merma encarece el insumo', () => {
  it('sin merma, el costo es cantidad x precio', () => {
    expect(ingredientLineCost({ quantity: 2, cost_per_unit: 500, yield_percentage: 100 })).toBe(1000);
  });

  it('con merma del 80%, el insumo útil cuesta 25% más', () => {
    // De 1 kg de papa aprovechas 800 g -> el kg útil cuesta 500/0.8 = 625.
    // 2 kg -> 1.250, no 1.000. Ignorar la merma subestima el costo.
    expect(ingredientLineCost({ quantity: 2, cost_per_unit: 500, yield_percentage: 80 })).toBe(1250);
  });

  it('aplica el multiplicador de escalado', () => {
    expect(ingredientLineCost({ quantity: 2, cost_per_unit: 500, yield_percentage: 80 }, 2)).toBe(2500);
  });

  it('merma NULL se trata como 100% (bug latente de B-12: GREATEST(NULL,1)=1 -> x100)', () => {
    expect(ingredientLineCost({ quantity: 1, cost_per_unit: 100, yield_percentage: null as any })).toBe(100);
    expect(ingredientLineCost({ quantity: 1, cost_per_unit: 100, yield_percentage: undefined as any })).toBe(100);
  });

  it('replica el SQL ante un yield de 0 (dato imposible, ya frenado por CHECK)', () => {
    // El SQL hace GREATEST(COALESCE(yield,100),1): con 0 el COALESCE no aplica
    // y queda 1 -> costo x100. El TS DEBE dar lo mismo aunque el número sea
    // absurdo: si divergen, el escalado deja de cuadrar con la BD (B-33).
    // El dato en sí no puede entrar: recipe_ingredients_yield_percentage_valid.
    expect(ingredientLineCost({ quantity: 1, cost_per_unit: 100, yield_percentage: 0 })).toBe(10000);
  });
});

const receta = (over: Partial<RecipeWithDetails> = {}): RecipeWithDetails => ({
  id: 'r1',
  portions: 10,
  ingredients: [],
  steps: [],
  nutrition: null,
  sub_recipes: [],
  ...(over as any),
} as RecipeWithDetails);

describe('scaleRecipeCost — B-33: escalar debe cuadrar con la BD', () => {
  it('reproduce el caso verificado en producción: x2 = 2.900', () => {
    // Receta de 10 porciones:
    //   - Papa: 2 kg a $500 con merma 80%  -> 1.250
    //   - Sub-receta "Salsa": 2 porciones a $100 c/u -> 200
    //   total = 1.450 -> cost_per_portion = 145
    // Escalar a 20 porciones = 145 x 20 = 2.900 (lo que dice recalculate_recipe_cost).
    // El código viejo daba 2.000: ignoraba merma Y sub-recetas (-31%).
    const r = receta({
      ingredients: [
        { ingredient_name: 'Papa', quantity: 2, unit: 'kg', cost_per_unit: 500, yield_percentage: 80 },
      ] as any,
      sub_recipes: [
        { quantity: 2, unit: 'porcion', sub_recipe: { name: 'Salsa', cost_per_portion: 100 } },
      ] as any,
    });

    const scaled = scaleRecipeCost(r, 20);

    expect(scaled.multiplier).toBe(2);
    expect(scaled.totalCost).toBe(2900);
    expect(scaled.yield).toBe(20);
  });

  it('incluye las sub-recetas en las líneas (antes se perdían)', () => {
    const r = receta({
      ingredients: [{ ingredient_name: 'Papa', quantity: 1, unit: 'kg', cost_per_unit: 100, yield_percentage: 100 }] as any,
      sub_recipes: [{ quantity: 1, unit: 'porcion', sub_recipe: { name: 'Salsa', cost_per_portion: 50 } }] as any,
    });

    const scaled = scaleRecipeCost(r, 10); // x1

    expect(scaled.ingredients).toHaveLength(2);
    expect(scaled.ingredients.map(i => i.name)).toContain('Salsa');
    expect(scaled.totalCost).toBe(150);
  });

  it('una sub-receta sin costo calculado aporta 0, no NaN', () => {
    const r = receta({
      sub_recipes: [{ quantity: 2, unit: 'porcion', sub_recipe: { name: 'Sin costear' } }] as any,
    });
    expect(scaleRecipeCost(r, 10).totalCost).toBe(0);
  });

  it('escalar a la baja también funciona', () => {
    const r = receta({
      portions: 10,
      ingredients: [{ ingredient_name: 'X', quantity: 10, unit: 'u', cost_per_unit: 100, yield_percentage: 100 }] as any,
    });
    const scaled = scaleRecipeCost(r, 5);
    expect(scaled.multiplier).toBe(0.5);
    expect(scaled.totalCost).toBe(500);
  });

  it('cae a yield_quantity y luego a 1 si no hay porciones', () => {
    const r = receta({ portions: 0, yield_quantity: 4 } as any);
    expect(scaleRecipeCost(r, 8).multiplier).toBe(2);
  });
});

describe('computeRecipeKPIs', () => {
  it('sin recetas devuelve ceros, no NaN', () => {
    const k = computeRecipeKPIs([]);
    expect(k.totalRecipes).toBe(0);
    expect(k.avgCostPerPortion).toBe(0);
  });

  it('promedia costo por porción y cuenta categorías únicas', () => {
    const k = computeRecipeKPIs([
      receta({ cost_per_portion: 100, category: 'main', is_secret: true } as any),
      receta({ cost_per_portion: 200, category: 'main' } as any),
      receta({ cost_per_portion: 300, category: 'postre', is_sub_recipe: true } as any),
    ]);
    expect(k.totalRecipes).toBe(3);
    expect(k.avgCostPerPortion).toBe(200);
    expect(k.categoriesCount).toBe(2);
    expect(k.secretRecipes).toBe(1);
    expect(k.subRecipesCount).toBe(1);
  });
});
