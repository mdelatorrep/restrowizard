-- ============================================================================
-- B-33 — El rendimiento (merma) no puede ser 0% ni mayor a 100%
--
-- `recalculate_recipe_cost` divide por el yield:
--     quantity * cost_per_unit / GREATEST(COALESCE(yield_percentage,100), 1) * 100
--
-- Con yield = 0 el COALESCE no aplica (no es NULL) y GREATEST(0,1) da 1, así que
-- el costo se multiplica por 100. Un rendimiento de 0% además es imposible en la
-- vida real: significaría que del insumo no se aprovecha NADA.
--
-- Lo detectó un test de regresión al comparar la fórmula de TypeScript con la de
-- SQL: divergían justo en este borde (`Number(0) || 100` da 100 porque 0 es
-- falsy, mientras el SQL da 1). Se igualaron las dos fórmulas Y se prohíbe el
-- dato en la fuente, que es donde de verdad se arregla.
--
-- Verificado antes de aplicar: 0 filas con yield <= 0 y 0 con yield > 100.
-- ============================================================================

ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_yield_percentage_valid
  CHECK (yield_percentage IS NULL OR (yield_percentage > 0 AND yield_percentage <= 100));
