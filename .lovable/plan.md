
# Plan de Integración Lógica de Módulos - RestroWizard

## Estado: ✅ IMPLEMENTADO

### Cambios Completados

#### Base de Datos (Migraciones)
- ✅ Tabla `staff_shifts` para gestión de turnos y cálculo de labor cost
- ✅ Columnas `popularity_score`, `profitability_score`, `bcg_category` en `menu_items`
- ✅ Columna `order_id` en `customer_feedback` para vincular feedback con órdenes
- ✅ Columna `loyalty_customer_id` en `table_reservations`
- ✅ Vista `menu_items_with_costs` que une productos con costos de recetas
- ✅ Función `get_aggregated_daily_sales()` para calcular finanzas desde órdenes
- ✅ Función `calculate_menu_item_scores()` para actualizar popularidad/rentabilidad
- ✅ Función `get_customer_profile()` para vista 360° del cliente
- ✅ Trigger `trigger_menu_scores_on_order` para actualizar scores automáticamente

#### Hooks Creados
- ✅ `useAggregatedFinances` - Finanzas calculadas desde órdenes reales
- ✅ `useMenuEngineeringData` - Matriz BCG con datos de ventas reales
- ✅ `useCustomerProfile` - Vista 360° del cliente
- ✅ `useStaffSchedule` - Gestión de turnos y labor cost
- ✅ `useRecipeMenuLink` - Vincular recetas con productos del menú

#### Componentes Creados
- ✅ `PublishRecipeToMenuDialog` - Dialog para publicar recetas en menú
- ✅ `BCGMatrixView` - Visualización de matriz BCG con datos reales
- ✅ `AggregatedFinancesDashboard` - Dashboard financiero en tiempo real

#### Páginas Actualizadas
- ✅ `Recipes.tsx` - Botón "Publicar en Menú" agregado
- ✅ `StaffSchedule.tsx` - Nueva página de gestión de turnos
- ✅ Rutas agregadas en `App.tsx`

---

## Resumen Ejecutivo

Este plan conecta todos los módulos de la plataforma para crear un flujo de datos coherente donde **recetas crean productos, productos afectan inventarios, habilitan menús, generan ventas, y estas afectan finanzas**. El objetivo es eliminar la entrada manual de datos y hacer que la información fluya automáticamente entre módulos.

---

## Arquitectura de Flujos de Datos

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO CENTRAL DE PRODUCTOS                          │
│                                                                              │
│  RECETAS → PRODUCTOS → MENÚ → POS/ÓRDENES → FINANZAS                        │
│     ↓           ↓         ↓         ↓            ↓                          │
│  Costos    Inventario  Precios   Ventas    Reportes                        │
│     ↓           ↓         ↓         ↓            ↓                          │
│  Márgenes   Alertas   Ingeniería Clientes  Proyecciones                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE CLIENTES                                   │
│                                                                              │
│  RESERVAS → MESAS → ÓRDENES → LOYALTY → FEEDBACK                            │
│      ↓         ↓        ↓         ↓          ↓                              │
│  Capacidad  Rotación  Historial Puntos   Satisfacción                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE OPERACIONES                                │
│                                                                              │
│  EMPLEADOS → TURNOS → ÓRDENES → COSTOS → PRODUCTIVIDAD                      │
│      ↓          ↓         ↓         ↓           ↓                           │
│  Capacidad   Labor    Eficiencia Finanzas   Performance                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Conexión Recetas ↔ Productos ↔ Menú

### 1.1 Crear Producto desde Receta
Cuando se crea/actualiza una receta, permitir generar automáticamente un ítem de menú vinculado.

**Cambios:**
- Modificar `useRecipes.ts` para incluir función `createMenuItemFromRecipe()`
- Agregar botón "Publicar en Menú" en la vista de receta
- Calcular precio sugerido: `cost_per_portion × markup_factor`
- Sincronizar actualizaciones de costo de receta al producto

### 1.2 Vincular Producto Existente a Receta
Permitir asociar un ítem de menú existente con su receta de preparación.

**Cambios:**
- Agregar selector de `menu_item_id` en formulario de receta
- Mostrar indicador visual de productos vinculados vs. huérfanos

### 1.3 Costo de Producto Dinámico
El costo del producto se calcula desde la receta en tiempo real.

**Cambios:**
- Crear vista SQL `menu_items_with_recipe_cost`
- Agregar campo calculado `recipe_cost` en hook de menú
- Mostrar alertas cuando margen cae por debajo de umbral

---

## Fase 2: Productos ↔ Inventario

### 2.1 Deducción Automática Mejorada
Ya existe `useInventoryDeduction` pero se debe hacer más robusto.

**Cambios:**
- Validar stock disponible ANTES de confirmar orden
- Mostrar alertas en tiempo real de stock insuficiente
- Registrar órdenes que no pudieron deducir inventario
- Dashboard de "Órdenes sin Receta" (productos sin vincular)

### 2.2 Proyección de Inventario
Predecir necesidades de inventario basado en ventas históricas.

**Cambios:**
- Crear función `calculateInventoryProjection(days: number)`
- Integrar con módulo de Ingeniería de Menú
- Generar órdenes de compra sugeridas

---

## Fase 3: Ventas ↔ Finanzas

### 3.1 Agregación Automática de Ventas Diarias
Eliminar entrada manual de `daily_sales`, calcular desde órdenes.

**Cambios:**
- Crear hook `useAggregatedDailySales`
- Calcular automáticamente:
  - `total_revenue`: suma de `restaurant_orders.total`
  - `covers_count`: suma de `restaurant_orders.guests_count` 
  - `food_cost`: suma de costos de recetas vendidas
  - `labor_cost`: calculado desde turnos de empleados
- Mantener opción de ajuste manual para gastos no capturados

### 3.2 Finanzas en Tiempo Real
Dashboard financiero que refleja ventas actuales.

**Cambios:**
- Modificar `useFinancesData.ts` para usar datos agregados
- Agregar modo "Tiempo Real" vs "Histórico"
- Integrar con sesiones POS para cuadre de caja

### 3.3 Cálculo de Food Cost Real
Calcular food cost desde ingredientes reales usados.

**Cambios:**
- Sumar `inventory_deductions` × `unit_cost`
- Comparar con food cost teórico (recetas)
- Identificar varianzas (desperdicio, robo, porciones)

---

## Fase 4: Ingeniería de Menú Basada en Datos Reales

### 4.1 Popularidad desde Ventas
Calcular `popularity_score` de productos desde órdenes reales.

**Cambios:**
- Crear función de cálculo periódico (trigger o cron)
- Fórmula: `cantidad_vendida / total_items_vendidos × 100`
- Considerar período configurable (7, 30, 90 días)

### 4.2 Rentabilidad Real
Calcular `profitability_score` desde márgenes reales.

**Cambios:**
- Fórmula: `(precio_venta - costo_receta) / precio_venta × 100`
- Actualizar cuando cambia precio o costo de ingredientes

### 4.3 Matriz BCG Dinámica
Clasificar productos automáticamente.

**Cambios:**
- **Estrella**: Alta popularidad + Alta rentabilidad
- **Vaca**: Baja popularidad + Alta rentabilidad  
- **Incógnita**: Alta popularidad + Baja rentabilidad
- **Perro**: Baja popularidad + Baja rentabilidad
- Generar recomendaciones automáticas de IA

---

## Fase 5: Clientes ↔ Órdenes ↔ Loyalty

### 5.1 Historial de Cliente Unificado
Consolidar información de cliente desde múltiples fuentes.

**Cambios:**
- Crear tabla `customer_profiles` que agrupa:
  - Datos de `loyalty_customers`
  - Datos de `table_reservations`
  - Historial de `restaurant_orders`
  - Feedback de `customer_feedback`
- Mostrar vista 360° del cliente en POS

### 5.2 Preferencias Automáticas
Detectar preferencias de cliente desde historial.

**Cambios:**
- Analizar órdenes para detectar:
  - Productos favoritos
  - Horarios preferidos
  - Ticket promedio
  - Frecuencia de visita
- Actualizar `preferred_items` automáticamente

### 5.3 Feedback Vinculado a Órdenes
Permitir asociar feedback con orden específica.

**Cambios:**
- Agregar `order_id` a `customer_feedback`
- Generar código QR único por orden
- Correlacionar ratings con productos consumidos

---

## Fase 6: Empleados ↔ Operaciones ↔ Finanzas

### 6.1 Turnos y Costos de Labor
Crear módulo de turnos que alimente costos.

**Cambios:**
- Crear tabla `staff_shifts`:
  ```sql
  staff_member_id, shift_date, start_time, end_time, 
  break_minutes, hourly_rate_override, status
  ```
- Calcular labor_cost diario desde turnos trabajados
- Integrar con proyección de finanzas

### 6.2 Productividad por Empleado
Medir ventas/cubiertos por empleado.

**Cambios:**
- Vincular `restaurant_orders.waiter_id` con `staff_members`
- Calcular KPIs por empleado:
  - Ventas totales atendidas
  - Ticket promedio
  - Número de mesas atendidas
  - Propinas recibidas

### 6.3 Performance Score Dinámico
Calcular `performance_score` desde métricas reales.

**Cambios:**
- Fórmula ponderada:
  - 40% Ventas vs objetivo
  - 30% Satisfacción de clientes
  - 20% Puntualidad
  - 10% Capacitación completada

---

## Fase 7: Reservaciones ↔ Mesas ↔ Capacidad

### 7.1 Ocupación en Tiempo Real
Integrar reservaciones con gestión de mesas.

**Cambios:**
- Mostrar disponibilidad basada en:
  - Reservaciones confirmadas
  - Mesas actualmente ocupadas
  - Tiempo estimado de rotación
- Bloquear horarios cuando capacidad esté llena

### 7.2 Predicción de Demanda
Proyectar ocupación futura.

**Cambios:**
- Analizar patrones históricos por:
  - Día de semana
  - Hora del día
  - Eventos especiales
- Sugerir promociones para horas de baja demanda

---

## Cambios Técnicos Requeridos

### Base de Datos (Migraciones)

```sql
-- 1. Vista de productos con costo de receta
CREATE VIEW menu_items_with_costs AS
SELECT 
  mi.*,
  r.cost_per_portion as recipe_cost,
  (mi.price - COALESCE(r.cost_per_portion, 0)) / NULLIF(mi.price, 0) * 100 as margin_percent
FROM menu_items mi
LEFT JOIN recipes r ON r.menu_item_id = mi.id;

-- 2. Tabla de turnos de empleados
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  hourly_rate_override NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agregar order_id a feedback
ALTER TABLE customer_feedback 
ADD COLUMN order_id UUID REFERENCES restaurant_orders(id);

-- 4. Agregar cliente unificado a reservaciones
ALTER TABLE table_reservations
ADD COLUMN loyalty_customer_id UUID REFERENCES loyalty_customers(id);

-- 5. Función para calcular ventas diarias agregadas
CREATE OR REPLACE FUNCTION get_aggregated_daily_sales(
  p_user_id UUID,
  p_date DATE
) RETURNS TABLE (
  total_revenue NUMERIC,
  order_count INTEGER,
  covers_count INTEGER,
  food_cost NUMERIC,
  avg_ticket NUMERIC
) AS $$
  SELECT 
    COALESCE(SUM(total), 0) as total_revenue,
    COUNT(*)::INTEGER as order_count,
    COALESCE(SUM(guests_count), 0)::INTEGER as covers_count,
    -- food_cost calculado desde deductions
    (SELECT COALESCE(SUM(id.quantity_deducted * ii.unit_cost), 0)
     FROM inventory_deductions id
     JOIN inventory_items ii ON ii.id = id.inventory_item_id
     WHERE id.user_id = p_user_id 
     AND DATE(id.deducted_at) = p_date) as food_cost,
    CASE WHEN COUNT(*) > 0 THEN SUM(total) / COUNT(*) ELSE 0 END as avg_ticket
  FROM restaurant_orders
  WHERE user_id = p_user_id
  AND DATE(created_at) = p_date
  AND status != 'cancelled';
$$ LANGUAGE sql;

-- 6. Trigger para actualizar popularity/profitability
CREATE OR REPLACE FUNCTION update_menu_item_scores() 
RETURNS TRIGGER AS $$
DECLARE
  v_total_sold INTEGER;
  v_item_sold INTEGER;
  v_recipe_cost NUMERIC;
  v_item_price NUMERIC;
BEGIN
  -- Solo procesar si la orden está completada
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Obtener ventas totales del período
    SELECT COUNT(*) INTO v_total_sold
    FROM restaurant_orders, jsonb_array_elements(items::jsonb) AS item
    WHERE user_id = NEW.user_id
    AND created_at >= NOW() - INTERVAL '30 days'
    AND status = 'completed';
    
    -- Actualizar cada producto vendido
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
      -- Actualizar popularity
      SELECT COUNT(*) INTO v_item_sold
      FROM restaurant_orders, jsonb_array_elements(items::jsonb) AS i
      WHERE user_id = NEW.user_id
      AND i->>'menu_item_id' = item->>'menu_item_id'
      AND created_at >= NOW() - INTERVAL '30 days'
      AND status = 'completed';
      
      -- Obtener costo y precio
      SELECT r.cost_per_portion, mi.price INTO v_recipe_cost, v_item_price
      FROM menu_items mi
      LEFT JOIN recipes r ON r.menu_item_id = mi.id
      WHERE mi.id = (item->>'menu_item_id')::UUID;
      
      -- Actualizar scores
      UPDATE menu_items SET
        popularity_score = (v_item_sold::NUMERIC / NULLIF(v_total_sold, 0)) * 100,
        profitability_score = ((v_item_price - COALESCE(v_recipe_cost, 0)) / NULLIF(v_item_price, 0)) * 100,
        updated_at = NOW()
      WHERE id = (item->>'menu_item_id')::UUID;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_menu_scores
AFTER UPDATE ON restaurant_orders
FOR EACH ROW EXECUTE FUNCTION update_menu_item_scores();
```

### Nuevos Hooks

| Hook | Propósito |
|------|-----------|
| `useAggregatedFinances` | Finanzas calculadas desde órdenes reales |
| `useMenuEngineeringData` | Matriz BCG con datos de ventas reales |
| `useCustomerProfile` | Vista 360° del cliente |
| `useStaffSchedule` | Gestión de turnos y labor cost |
| `useInventoryProjections` | Predicción de necesidades de inventario |
| `useTableOccupancy` | Ocupación en tiempo real |

### Componentes Modificados

| Componente | Cambios |
|------------|---------|
| `Recipes.tsx` | Agregar "Publicar en Menú", selector de producto vinculado |
| `FinancesAIModule.tsx` | Modo tiempo real, datos agregados |
| `MenuInventoryAIModule.tsx` | Matriz BCG con datos reales |
| `POS.tsx` | Validación de stock, vista de cliente |
| `TalentAIModule.tsx` | KPIs de productividad por empleado |
| `Reservations.tsx` | Integración con disponibilidad de mesas |

---

## Orden de Implementación

| Prioridad | Fase | Complejidad | Impacto |
|-----------|------|-------------|---------|
| 1 | Fase 3.1 - Agregación Ventas | Media | Alto |
| 2 | Fase 4.1/4.2 - Popularidad y Rentabilidad | Media | Alto |
| 3 | Fase 1.1 - Recetas → Productos | Baja | Alto |
| 4 | Fase 2.1 - Deducción Mejorada | Media | Medio |
| 5 | Fase 5.1 - Historial Cliente | Alta | Medio |
| 6 | Fase 6.1 - Turnos | Alta | Medio |
| 7 | Fase 7.1 - Ocupación | Media | Bajo |

---

## Resultado Esperado

Al completar esta integración:

1. **Cero Entrada Manual**: Las finanzas se calculan automáticamente
2. **Decisiones Basadas en Datos**: Ingeniería de menú usa ventas reales
3. **Alertas Proactivas**: Stock bajo, márgenes bajos, clientes en riesgo
4. **Vista 360°**: Cliente unificado con historial completo
5. **Productividad Medible**: Performance de empleados basado en datos
6. **Capacidad Optimizada**: Reservaciones inteligentes con disponibilidad real
