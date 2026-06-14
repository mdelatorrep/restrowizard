# Ciclo 6 — Plan de cierre de hallazgos abiertos

Abarcamos **todos** los hallazgos abiertos del reporte. Lo ordeno por dependencia y riesgo, en bloques que puedo ir cerrando uno tras otro.

## Bloque A — Correctness de Finanzas (P0/P1)

### BL-16 · Labor Cost desde turnos
- `useAggregatedFinances` ya calcula labor desde `staff_shifts` pero exige `status='completed'`. Causa de "0%": turnos quedan en `scheduled`/`confirmed`.
- **Cambio:** incluir también shifts `confirmed`/`in_progress`/`completed`. Si no hay `actual_*`, usar `start_time`/`end_time` programados.
- **CA:** crear 1 turno de 4 h con tarifa $10.000 → Finanzas muestra Labor Cost $40.000 y % ≠ 0.

### BL-18 · "Cubiertos" = comensales reales
- El hook ya suma `guests_count`. Causa: muchas órdenes POS tienen `guests_count` null y caen a `0`, pero KPIs de "Ticket promedio" se calculan sobre `order_count`. Verificar en POS que al cobrar dine-in se persista `guests_count` desde la mesa/diálogo.
- **Cambio:** en `usePOSPayment`/diálogo de cobro, garantizar `guests_count` ≥ 1 (default = capacidad de mesa o 1) y propagar a `restaurant_orders`. KPI "Ticket por cubierto" usa `covers_count` en lugar de `order_count`.
- **CA:** orden con 4 comensales suma 4 cubiertos y ticket/cubierto = total/4.

### BL-21 · Umbrales de salud por componente
- `PrimeCostGauge` evalúa solo prime total ≤60%.
- **Cambio:** evaluar Food Cost vs banda (target 28–32%, alerta >35%, crítico >40%) y Labor vs (target 25–30%, alerta >35%) además del prime total. Estado = peor de los tres.
- **CA:** con Food 55.6% el indicador marca "Crítico" aunque el prime sea ≤60%.

## Bloque B — POS / Cumplimiento

### BL-11 · Impuestos (IVA / Impoconsumo)
- Nueva columna `tax_config` (jsonb) en `restaurant_businesses`: `{ type: 'iva'|'impoconsumo'|'exento', rate, included_in_price }`.
- POS: al cobrar, calcular `tax_amount = subtotal × rate` (o desglose si está incluido), persistir en `restaurant_orders.tax_amount` y mostrar línea en ticket y diálogo de pago.
- Reportes y P&L: descontar impuestos del revenue neto.
- **CA:** venta de $10.000 con Impoconsumo 8% muestra $800 de impuesto y total $10.800 (o desglose si incluido).

### BL-07 · "86" — bloquear/avisar al vender con insumo agotado
- Al cargar menú en POS, calcular disponibilidad por platillo cruzando `recipes` × `inventory_items.stock`. Si algún insumo está en 0 → marcar `unavailable` (badge "Agotado") y, al intentar añadir al carrito, mostrar toast/diálogo: bloquear o permitir según setting `restaurant_businesses.allow_oversell` (default: avisar).
- **CA:** insumo de "Waffle" en stock 0 → tarjeta "Agotado" en POS; click → toast de aviso.

## Bloque C — Talento / Admin

### BL-01 · Auto-vínculo del owner en Mi Desarrollo
- En `/r/my-development`, si `user_roles.role IN ('admin','owner')` y no existe `staff_members` con su email → mostrar CTA "Vincularme como empleado". Crea `staff_members` con `email`, `full_name` y `user_id` del owner, sin invitación.
- **CA:** un owner sin staff entry pulsa el botón y entra a Mi Desarrollo sin "pide a tu administrador".

## Bloque D — Técnicos

### H-02 · Silenciar logs en prod
- Reemplazar `console.log/info/debug` por `logger.debug` en hot paths (POS, Inventory, Finanzas, hooks). `logger` ya silencia en !DEV.

### H-03 · A11y warnings restantes
- Auditar Buttons icon-only sin `aria-label`, inputs sin `<label>`, `<main>` duplicado. Foco en pantallas core (POS, Inventario, Finanzas, Mi Desarrollo).

### H-06 · KPIs de variación reales en Dashboard
- `DashboardKPIs` recibe `change` hardcoded. Calcular vs período anterior (últimos 30d vs 30d previos) en `useDashboard` y propagar.

### H-07 · Moneda residual
- `grep` por símbolos `$` hardcoded y `toLocaleString('es-CO')` directo. Reemplazar por `formatCurrency()` que respeta país del business.

## Orden de ejecución
1. **Bloque A** (3 cambios pequeños, validan la promesa central).
2. **Bloque D · H-02 + H-07** (saneamiento rápido).
3. **Bloque B · BL-11** (migración + POS + tickets).
4. **Bloque C · BL-01** (UI + insert).
5. **Bloque B · BL-07** (lógica de disponibilidad).
6. **Bloque D · H-06 + H-03** (refinamiento).

> BL-03/BL-06 (recetas M:N y conversión de unidades) los dejo fuera del ciclo: son rediseño de modelo de datos y requieren su propio entregable. Los abordamos en ciclo 7 con plan dedicado.

## Detalle técnico clave
- Migración: `restaurant_businesses` agregar `tax_config jsonb default '{"type":"exento","rate":0,"included_in_price":false}'`, `allow_oversell boolean default true`.
- Migración: `restaurant_orders` ya tiene `tax_amount`, sólo poblarlo.
- `useAggregatedFinances`: ampliar filtro de shifts y fallback a horas programadas.
- `PrimeCostGauge`: nueva función `evaluateHealth(food%, labor%, prime%)` con bandas por componente.
- `usePOSCart`: añadir `availability` calculada y `setting.allow_oversell` para decidir bloqueo.