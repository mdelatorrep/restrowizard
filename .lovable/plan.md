# Ciclo 4 — Cerrar cadena de costos end-to-end

## 1. TK-01 #5 — Descuento de inventario al vender (PRIORIDAD 1)

El hook `useInventoryDeduction` ya está cableado en `POS.tsx` línea 195, pero el stock no baja. Causa raíz probable: la receta vinculada al `menu_item_id` no se encuentra porque (a) el filtro `.eq('user_id', user.id).single()` retorna error silencioso cuando la receta no tiene `user_id` del cajero (multi-tenant), o (b) los items del carrito llegan sin `menu_item_id`.

**Cambios en `src/hooks/useInventoryDeduction.ts`:**
- Cambiar `.single()` → `.maybeSingle()` en `getRecipeForMenuItem` y quitar el filtro `user_id` (la RLS de `recipes` ya restringe; en cuentas multi-business el `user.id` puede no coincidir con el `owner_id` del negocio).
- Loggear con `logger.warn` (no `console.log`) cuando un item no tiene receta o no tiene `menu_item_id`, e incluirlo en `errors` para visibilidad.
- Asegurar que `deductInventoryForItem` registra el costo: usar `inventory_items.unit_cost` actual para calcular `total_cost` y persistirlo en `inventory_deductions` (campo ya existe en schema según `get_aggregated_daily_sales`).

**Cambios en `src/pages/restaurant/POS.tsx`:**
- Tras `deductInventoryForOrder`, mostrar toast informativo si `deductedCount === 0` y hay items con `menu_item_id` (avisar que faltan recetas vinculadas, sin bloquear la venta).
- Verificar que `items` del carrito siempre traen `menu_item_id` (revisar `usePOSCart`).

**CA:** vender 1 platillo cuya receta usa 2 uds de un insumo con stock 10 → insumo queda en 8, `inventory_deductions` tiene fila con `quantity_deducted=2` y `order_id` correcto.

## 2. TK-01 #6 — Food Cost / Prime Cost en Finanzas (PRIORIDAD 1)

`useAggregatedFinances` lee `food_cost`/`labor_cost` SOLO de la tabla manual `daily_sales`. Por eso siempre da 0% cuando el restaurante opera por POS.

**Cambio en `src/hooks/useAggregatedFinances.ts`:**
- Reemplazar la lectura de `daily_sales` por una llamada por día a la función SQL `get_aggregated_daily_sales(p_user_id, p_date)` que YA existe y calcula food_cost desde `inventory_deductions × unit_cost` y labor_cost desde `staff_shifts`.
- O (más eficiente): añadir consultas en paralelo `inventory_deductions JOIN inventory_items` y `staff_shifts` agrupadas por fecha, mantener `daily_sales` como override manual (sumando si el usuario registró costos adicionales).
- Manejar platillos sin receta: ya se excluyen naturalmente (no generan deductions). Documentar en el tooltip del KPI "Food Cost" que solo cuenta platillos vinculados a receta.

**CA:** venta de platillo $18.000 con receta $10.000/porción → Finanzas muestra Food Cost ≈ 55.6%, Prime Cost coherente con Labor.

## 3. N-03 — Refresh del modal de ingredientes en Recetas

`RecipeDetailDialog` no refleja cambios en ingredientes hasta reabrir.

**Cambio en `src/hooks/useRecipes.ts` (mutaciones `updateIngredient`/`addIngredient`/`removeIngredient`):**
- Tras la mutación, actualizar el estado local del `recipe.ingredients` en el objeto seleccionado y recalcular `cost_per_portion` en memoria (además del refetch existente).
- En `RecipeDetailDialog`, derivar la receta mostrada del estado `recipes[]` actualizado en vez de copia local estática (`useMemo` por `recipe.id`).

**CA:** editar cantidad de ingrediente → la fila, "Costo Total Ingredientes" y header "$/porción" del modal se actualizan al instante.

## 4. TK-05 — Moneda residual (2 puntos)

Aplicar `formatCurrency(value, 'COP')`:
- "PRECIO PROM." en el editor de menú (probable `src/components/menus/MenuEditor.tsx` o `MenuStatsBar`): cambiar `$${price.toFixed(2)}` → `formatCurrency(price)`.
- "Costo Total Ingredientes" en el modal de receta (`RecipeIngredientManager.tsx` o `RecipeCostingPanel.tsx`): mismo cambio.

**CA:** sin `.00` ni importes sin separador de miles en Menús ni en el modal de receta.

## 5. Notas

- N-04 (Desperdicio↔Inventario) y N-05 (campos LATAM empleado) ya están implementados en ciclos previos según contexto; los re-verificaré visualmente y solo tocaré si hay regresión.
- No tocaré otros módulos.

## QA de regresión (end-to-end)

Crear insumo (stock 10, unit_cost $5.000) → receta con 2 uds del insumo → vincular a platillo precio $18.000 → vender 1 en POS efectivo → verificar:
1. Stock baja a 8 ✅
2. `inventory_deductions` registra fila con `total_cost = 10.000` ✅
3. Finanzas (hoy) muestra Food Cost ≈ 55.6%, Prime Cost ≠ 0% ✅
4. Editar ingrediente refresca modal sin reabrir ✅
5. Sin importes con `.00` en Menús/Recetas ✅
