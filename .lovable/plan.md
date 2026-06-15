# Ciclo Dedicado — Recetas M:N + Conversión de Unidades (BL-03 / BL-06)

## Contexto actual

- `recipes.menu_item_id` es nullable string: relación 1:0..1 entre receta e ítem de menú.
- `recipe_ingredients` guarda `unit` (string) y `unit_id` (referencia opcional a `measurement_units`).
- `measurement_units` ya tiene `base_unit_id` + `conversion_factor` (árbol de unidades), pero no hay tabla de conversiones arbitrarias (ej. taza → gramos para harina).
- Sub-recetas existen vía `recipe_sub_recipes`.
- El costeo recalcula `total_cost`/`cost_per_portion` en `useRecipes.ts`.

## Hallazgos que este ciclo cierra

### BL-03 — Recetas M:N con ítems de menú
Una misma receta (ej. salsa madre) debe poder vincularse a múltiples ítems de menú. Un ítem de menú debe poder tener múltiples recetas (ej. versión base + versión vegana).

### BL-06 — Conversión de unidades robusta
El costo de un ingrediente en receta debe calcularse en la unidad de compra del inventario, usando conversiones explícitas cuando las unidades no compartan base directa.

---

## Entregables

### 1. Modelo de datos

#### 1.1 Tabla pivote `recipe_menu_items`
```text
recipe_id  → references recipes
menu_item_id → references menu_items
is_primary   boolean default false
variant_name text nullable (ej. "Vegana", "XL")
sort_order   int default 0
```
- GRANT a authenticated + service_role.
- RLS: user_id = auth.uid() (recetas e ítems de menú ya tienen user_id vía sus tablas).
- Índice único parcial: solo un `is_primary = true` por `menu_item_id`.

#### 1.2 Tabla `unit_conversions`
```text
from_unit_id  → references measurement_units
to_unit_id    → references measurement_units
conversion_factor decimal > 0
ingredient_id → references inventory_items nullable
```
- Si `ingredient_id` es null: conversión genérica (ej. 1 taza = 240 ml).
- Si `ingredient_id` tiene valor: conversión específica por densidad/peso (ej. 1 taza harina = 120 g).
- GRANT + RLS igual que arriba.

### 2. Migración de datos

- Crear `recipe_menu_items` y migrar todas las filas donde `recipes.menu_item_id IS NOT NULL` → pivote con `is_primary = true`.
- Mantener `recipes.menu_item_id` temporalmente (backwards compatibility), deprecar en el siguiente ciclo.
- Poblar `unit_conversions` con equivalencias básicas (volumen y peso) + seed por país.

### 3. Backend

#### 3.1 Función SQL `convert_unit(amount, from_unit_id, to_unit_id, ingredient_id)`
- SECURITY DEFINER.
- Resuelve conversión directa, por base común, o por tabla `unit_conversions` (genérica → específica).
- Devuelve `converted_amount` o null si no hay cadena de conversión.

#### 3.2 Función SQL `recalculate_recipe_cost(recipe_id)`
- Para cada ingrediente: convierte `quantity` en `unit_id` → unidad de compra del `inventory_item`.
- Aplica `yield_percentage`.
- Suma sub-recetas vía `recipe_sub_recipes` (roll-up recursivo con límite de profundidad).
- Actualiza `recipes.total_cost` y `recipes.cost_per_portion`.

### 4. Frontend

#### 4.1 UI de asociación receta ↔ menú
- En `RecipeDetailDialog` (tab "Costeo" o nuevo tab "Menú"): selector multi-select de ítems de menú.
- Badge "Principal" editable; drag-and-drop de orden.
- En `Menus` / `MenuItemEditor`: selector de recetas asociadas con opción de marcar principal.

#### 4.2 UI de conversión de unidades
- En `RecipeIngredientManager`: al elegir unidad, si no hay conversión directa al inventario, mostrar campo emergente para definirla (guarda en `unit_conversions` con `ingredient_id`).
- Tooltip que muestra el cálculo: "2 tazas harina = 240 g = $1.200".

#### 4.3 Hook `useRecipes` refactorizado
- Carga `recipe_menu_items` junto a recetas.
- Elimina dependencia directa de `recipes.menu_item_id` (usa pivote).
- `recalculateCost` delega a RPC `recalculate_recipe_cost` en lugar de calcular en cliente.

### 5. Integraciones afectadas

| Módulo | Impacto | Acción |
|--------|---------|--------|
| POS / `useMenuAvailability` | Lee recetas por `menu_item_id` | Usar `recipe_menu_items` con `is_primary` |
| Inventario / deducción | Consume recetas para descontar stock | Usar receta principal del ítem |
| Finanzas / Food Cost | Costo por platillo | Usar `cost_per_portion` de receta principal |
| Público / menú | Mostrar receta/nutrición | Usar receta principal o todas con variantes |

---

## Orden de ejecución

1. **Migraciones**: `recipe_menu_items`, `unit_conversions`, seed data.
2. **Backend**: funciones `convert_unit` + `recalculate_recipe_cost`.
3. **Datos**: migrar `menu_item_id` → pivote; validar integridad.
4. **Frontend**: refactor `useRecipes` + UI asociación + UI conversión.
5. **Integración**: actualizar POS, inventario y finanzas para leer desde pivote.
6. **Deprecación**: eliminar `recipes.menu_item_id` (ciclo siguiente, post-validación).

---

## Criterios de aceptación

- CA-03-01: Crear receta "Salsa Madre", asociarla a 3 ítems de menú diferentes; cada ítem muestra la receta en su detalle.
- CA-03-02: Un ítem de menú tiene receta base + variante; al ver el menú público aparece selector de variante.
- CA-06-01: Agregar 200 g de harina a receta; inventario registra harina en kg (1 kg = $5.000); costo calculado = $1.000.
- CA-06-02: Agregar 1 taza de harina (sin conversión previa); UI pide equivalencia; definir 1 taza = 120 g; costo calculado = $600.
- CA-06-03: Cambiar precio de compra de harina en inventario; costo de recetas que la usan se actualiza automáticamente (vía `recalculate_recipe_cost`).

## Riesgos y mitigaciones

- **Riesgo**: Recálculo masivo de costos al migrar. **Mitigación**: ejecutar `recalculate_recipe_cost` en batch por usuario, con progress tracking.
- **Riesgo**: Ciclos en sub-recetas. **Mitigación**: `recalculate_recipe_cost` limita recursión a 5 niveles; detecta ciclos y lanza error.
- **Riesgo**: Unidades sin cadena de conversión. **Mitigación**: UI muestra advertencia y solicita equivalencia; no bloquea guardado pero marca costo como estimado.