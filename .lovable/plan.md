# Plan RestroWizard v3 — Ajustes pendientes

Alcance grande (16 tickets + DIAN). Propongo ejecutar **por bloques de prioridad**, validando cada bloque antes del siguiente, para evitar regresiones y mantener migraciones pequeñas.

---

## Bloque P1 (esencial — primer entregable)

### TK-1 · Canales de venta unificados (BL-13)
- Migración: añadir `sales_channel` (enum: `dine_in`, `pos`, `delivery_own`, `rappi`, `takeout`) a `restaurant_orders` con default `pos` y backfill por origen (`aggregator_orders.rappi` → `rappi`; `delivery_zones`/orden con domicilio → `delivery_own`; resto → `pos`).
- `useSalesReports` y `useAggregatedFinances`: agrupar/filtrar por canal.
- UI Reportes: selector de canal + desglose por canal en KPIs y serie temporal.

### TK-2 · Costo laboral consistente Turnos vs Finanzas (C8-01)
- Crear util `calcShiftLaborCost(shift)` única en `src/lib/laborCost.ts`:
  `horas_netas = ((fin - inicio) - break_minutes/60) * hourly_rate`.
- Reemplazar cálculos duplicados en `useStaffSchedule` y `useAggregatedFinances`.
- CA: mismo turno → mismo valor en ambos módulos; Prime Cost usa neto.

### TK-3 · Silenciar logs producción (H-02)
- Auditar `console.*` y migrar a `logger` (ya existe `src/lib/logger.ts`).
- En `OnboardingGuard`, `useAuth`, `useDataUserId`: cambiar a `logger.debug`.
- Verificar: re-render del guard (memoizar).

---

## Bloque P2

### TK-4 · Cubiertos = comensales reales (BL-18)
- Reportes / Dashboard: usar `restaurant_orders.guests_count` en lugar de count(orders).

### TK-5 · Mesas con estado compartido (BL-10)
- `restaurant_tables.status` (`available`/`occupied`/`reserved`/`cleaning`) ya parcialmente existe — sincronizar:
  - POS: al abrir orden con mesa → `occupied`; al cerrar → `available`.
  - Reservas: al confirmar reserva en ventana → `reserved`.
- Realtime channel para `restaurant_tables`.

### TK-6 · Inventario por ubicación (BL-19)
- Migración: `inventory_item_stock(item_id, location_id, quantity)`; mantener `inventory_items.stock` como vista materializada/sumatoria.
- Transferencias (`inventory_transfers`): actualizan ambas filas (origen −, destino +).
- UI: mostrar stock por ubicación en detalle de ítem.

### TK-7 · Accesibilidad (H-03)
- Agregar `DialogDescription` faltante en diálogos sin descripción.
- Selects con `value` controlado (sin uncontrolled→controlled warnings).

### TK-8 · KPIs variación reales en Dashboard (H-06)
- Ya implementado en pase anterior — re-verificar: si no hay base previa, ocultar badge.

### TK-9 · Ingresos netos vs impuesto en Reportes (R-01)
- `useSalesReports`: separar `subtotal` y `tax_amount` (ya existen en `restaurant_orders`).
- Mostrar dos líneas: "Ventas netas" + "Impuestos recaudados".

### TK-15 (NUEVO) · Flujos de Inventario afectan stock/costos
- **Compras**: al recibir OC → insert `inventory_movements` (in) + sumar `stock`; actualizar `last_purchase_price`.
- **Conteos**: al cerrar conteo → ajuste por diferencia (movement `adjustment`).
- **Mermas**: al registrar → movement `waste` y restar stock.

### TK-16 (NUEVO) · Proveedor asignado a ítems (BL-08)
- Aprovechar `inventory_item_suppliers` (ya existe).
- UI: en editor de ítem, asignar proveedor primario.
- Botón "Ordenar" en alerta de par level → crea PO al proveedor primario por cantidad sugerida.

---

## Bloque P3

### TK-10 · Granularidad métodos de pago (R-02)
- Reportes: no agrupar en "Otros"; usar `payment_method` tal cual (Nequi, Daviplata, Transferencia).

### TK-11 · Propina voluntaria + distribución (BL-20)
- CartPanel: copia "Propina sugerida (voluntaria)" + toggle off-by-default.
- Reporte de propinas por mesero/turno (`pos_transactions.tip_amount` + `staff_member_id`).

### TK-12 · i18n residual ampliado
- Aplicar `labelFor` en Ingeniería de Menú (tabla de productos) y resto de vistas con categorías crudas.

### TK-13 · Roll-up sub-recetas (BL-04)
- `recalculate_recipe_cost` RPC ya tiene recursión (5 niveles). Verificar que al actualizar sub-receta dispare recalculo de padres (trigger `AFTER UPDATE` en `recipes.cost_per_unit` → invocar recálculo en recetas que la referencian via `recipe_sub_recipes`).

### TK-14 · Auto-vínculo admin (BL-01)
- Ya implementado en `MyDevelopment.tsx` (verificado en pase anterior). Spot-check.

### BL-02 · Verificación acceso por rol
- Confirmar `useTeamPermissions.canAccess` aplicado en `AppSidebar` para ocultar módulos sin permiso.

---

## Diferido

### TK-DIAN · Factura electrónica
- Módulo placeholder ya creado. Sin trabajo adicional hasta investigación de proveedor.

---

## Estrategia de entrega

Sugiero ejecutar y entregar **solo Bloque P1** en este turno (3 tickets, 1 migración pequeña). Tras tu validación, sigo con P2, luego P3.

¿Confirmas que arranque por **P1 (TK-1, TK-2, TK-3)** ahora, o prefieres otro orden / agrupar más en un solo entregable?
