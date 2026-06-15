
# Rediseño POS — Portal de Ventas Standalone

Roadmap por fases. Cada fase es un entregable independiente, desplegable y QA-able. Implemento fase por fase con tu visto bueno entre cada una. Al final de cada fase: smoke test + checklist.

## Decisiones ya tomadas
- **URL**: `restrowizard.co/{slug-restaurante}/pos` (pública, login propio).
- **Auth cajero**: Híbrido — sesión `auth.users` por dispositivo/turno (auditoría real) + PIN de 4–6 dígitos por staff para login rápido / quick-switch en tablet compartida. Supervisor también tiene PIN para autorizar.
- **SSO interno**: si el usuario ya viene autenticado del portal admin, se entra al POS sin pedir credenciales (token de sesión Supabase reusado), y al cerrar regresa al portal manteniendo sesión.
- **Realtime**: WebSocket vía Supabase Realtime sobre `restaurant_tables`, `restaurant_orders`, `aggregator_orders`, `table_reservations`.

---

## FASE 1 — Shell standalone, auth dual y mapa de mesas en vivo
**Objetivo**: el cajero puede entrar al POS desde una URL bonita, ver el mapa de mesas configurado por el admin, y abrir/cerrar turno. Reemplaza la pantalla actual `/r/pos` por un layout tablet-first dark.

### Entregables
1. **Ruta pública** `/{slug}/pos` resuelve `restaurant_brands.slug` → `restaurant_id`. Layout sin sidebar admin (componente `POSShell` propio).
2. **Login POS** (`/{slug}/pos/login`):
   - Tab "PIN" (teclado numérico grande) + tab "Email/Password".
   - PIN valida contra `staff_members.pin_hash` vía edge function `pos-pin-login` (crea sesión Supabase con magic link interno o devuelve un JWT custom + setea sesión).
   - SSO silencioso: si `supabase.auth.getSession()` ya devuelve usuario con membresía al restaurante, salta el login.
   - Botón "Volver al portal admin" en header.
3. **Configuración de mesas** (admin, ya parcialmente existe en `restaurant_zones`/`restaurant_tables`): editor visual de zonas con drag&drop, capacidad, forma, estado por defecto.
4. **Mapa de mesas en vivo** (vista principal POS):
   - Grid por zonas, colores: verde/ámbar/azul/gris/rojo + timer visible en ocupadas.
   - Realtime: cambios de estado y nuevas órdenes se reflejan sin reload.
   - Resumen al tocar mesa: mesero, tiempo, consumo, último movimiento.
5. **Apertura/cierre de turno** (reusa `pos_sessions`) con UI dark nueva.

### Técnico
- Tabla `staff_members` ya existe; añadir `pin_hash text`, `pin_set_at timestamptz`, `pin_failed_attempts int`, `pin_locked_until timestamptz`.
- Edge function `pos-pin-login`: recibe `{slug, pin}`, valida con `crypt()`/`pgcrypto`, devuelve sesión.
- Hook `usePOSContext` (slug → restaurant + brand colors).
- Componentes nuevos: `POSShell`, `POSLogin`, `TableMap`, `TableCard`, `ZoneEditor`.
- Realtime channel sobre `restaurant_tables` y `restaurant_orders`.

---

## FASE 2 — Comanda activa, órdenes y operaciones de mesa
**Objetivo**: tomar y gestionar comandas reales desde el mapa. Reemplaza el carrito actual.

### Entregables
1. **Vista dividida** (landscape): mapa izquierda / comanda derecha. En portrait: tabs.
2. **Comanda activa** por mesa:
   - Catálogo con búsqueda, categorías, modificadores y extras (`menu_item_modifiers`).
   - Agregar/eliminar ítems con motivo si ya fue enviado a cocina.
   - Estado por ítem: pendiente / enviado a cocina / listo / entregado.
3. **Operaciones de mesa**:
   - Dividir cuenta (por persona o por ítems).
   - Fusionar mesas.
   - Transferir mesa con trazabilidad (`order_status_history`).
   - Reimprimir comanda a cocina/barra (impresión por estación, vía KDS existente).
4. **Pagos** (extiende `usePOSPayment`):
   - Efectivo (cálculo de vuelto), tarjeta, transferencia, QR, puntos, mixto.
   - Propina por medio de pago.
   - Integración pasarela ya existente (`payment_gateway_credentials`).
5. **Actualizaciones en vivo de carta**: cambios de precio/disponibilidad reflejados sin reload (Realtime sobre `menu_items`).

### Técnico
- Extender `restaurant_orders` con: `split_from_order_id`, `merged_into_order_id`, `transferred_from_table_id`, `transferred_by`, `tip_breakdown jsonb`.
- Nuevo hook `usePOSOrder(orderId)` con mutaciones optimistas.
- Componentes: `OrderPanel`, `OrderItemRow`, `SplitBillDialog`, `MergeTablesDialog`, `TransferTableDialog`, `PaymentDialogV2`.

---

## FASE 3 — Autorizaciones de supervisor + auditoría inmutable + antifraude
**Objetivo**: blindaje operativo. Toda acción sensible queda registrada y requiere PIN de supervisor según configuración del admin.

### Entregables
1. **Config de autorizaciones** (panel admin): toggle + umbral para cada causal (cancelación post-cocina, descuento > X%, cortesía, consumo empleado, override precio, reapertura caja, anulación pago, transferencia con diferencia, acceso a reportes en horario).
2. **Flujo de PIN supervisor** universal: modal `RequireSupervisorPIN` con campo motivo obligatorio. Valida contra `staff_members.pin_hash` con rol supervisor.
3. **Tabla `pos_audit_log`** inmutable (append-only, RLS solo INSERT, lectura para owner/supervisor):
   - timestamp, user_id, supervisor_user_id, terminal_id, action_type, entity_type, entity_id, old_value jsonb, new_value jsonb, reason text, restaurant_id.
4. **Detección de patrones de riesgo** (SQL view + edge job nightly):
   - Múltiples cancelaciones mismo cajero/turno.
   - Descuentos repetidos justo bajo umbral.
   - Cortesías recurrentes mismas mesas.
   - Reaperturas frecuentes.
   - Diferencias recurrentes de caja del mismo cajero.
   - Accesos fuera de horario.
   - Genera entradas en `copilot_alerts` con tipo `fraud_risk`.
5. **Visor de auditoría** filtrable (cajero/turno/fecha/tipo).

### Técnico
- `terminal_id` se persiste en `localStorage` por tablet (UUID).
- Trigger en `restaurant_orders`, `pos_transactions`, `pos_sessions`, `pos_discounts_applied` que escribe a `pos_audit_log`.
- View `pos_fraud_signals` y edge function `pos-fraud-scanner`.

---

## FASE 4 — IA en venta + canales externos + reservas
**Objetivo**: el "efecto wow". El POS sugiere, alerta y consolida canales en una sola vista.

### Entregables
1. **Sugerencias predictivas** al abrir mesa:
   - Edge function `pos-ai-suggest` que cruza `daily_sales` + hora + día → top ítems contextual.
   - "Los viernes 7pm el 68% pide X" como tarjeta horizontal scrolleable.
2. **Complementos inteligentes**: al agregar ítem, calcula co-ocurrencia histórica y sugiere maridajes (SQL + cache).
3. **Alertas de tiempo en mesa**: timer por mesa con thresholds configurables ("sin postre tras 45min", "sin cuenta tras 90min"), banner suave.
4. **Canales externos** en la misma vista:
   - Panel "Domicilios" agrupa `aggregator_orders` (Rappi/iFood/Domicilios.com) + `restaurant_orders` con `sales_channel in (delivery_own, takeout)`.
   - Estados: recibida → preparación → lista → entregada/recogida.
   - Asignación de domiciliario propio.
   - Cancelación con motivo y trazabilidad.
5. **Reservas integradas**:
   - Línea de tiempo del día por zona usando `table_reservations`.
   - Buscar por nombre/teléfono/código.
   - Marcar llegada/cancelada/no-show, asignar a mesa.
   - Disponibilidad en vivo para walk-ins.

### Técnico
- Edge functions: `pos-ai-suggest`, `pos-ai-complements`, usando Lovable AI (Gemini 3 Flash) con system prompt corto y data ya agregada.
- View `menu_item_cooccurrence` materializada cada noche.

---

## FASE 5 — Cierre de caja asistido por IA + métricas de talento + offline endurecido
**Objetivo**: cerrar el ciclo del turno con cuadre asistido y alimentar el módulo de Talento con datos reales.

### Entregables
1. **Config previa cierre** (admin): caja base, medios habilitados con flag "genera efectivo", tolerancia ±$.
2. **Cierre asistido** (cajero):
   - Resumen en vivo: base + ventas efectivo + retiros = esperado; otros medios desglosados; propinas por medio.
   - Conteo guiado denominación por denominación (COP por defecto, configurable).
   - Comparación IA → 3 estados (✅ tolerancia / ⚠️ menor con motivo / 🚨 mayor con PIN supervisor).
   - Acta PDF firmada digitalmente (`@react-pdf/renderer`), archivada en `pos_session_closures`.
3. **Métricas de conexión → Talento**:
   - Tabla `pos_user_activity` (login, logout, last_interaction, idle_periods jsonb, orders_count, avg_order_time_sec).
   - Hook `usePOSActivityTracker` que ya pinguea cada 30s desde el shell.
   - Cards nuevas en `/r/talent` y `/r/my-development`: puntualidad apertura caja, productividad, comparativo por turno.
4. **Offline endurecido**:
   - IndexedDB para órdenes/pagos pendientes (extiende `useOfflineSync`).
   - Banner persistente modo offline, cola visible, retry inteligente.
   - Catálogo cacheado al login.

### Técnico
- Tablas nuevas: `pos_session_closures` (snapshot completo + URL PDF en storage), `pos_user_activity`.
- Storage bucket `pos-closures` (privado).
- Edge function `pos-close-session` que valida, genera PDF y guarda.

---

## Diagrama de dependencias

```text
Fase 1 (shell+auth+mapa)
   └── Fase 2 (comanda+pagos)
         ├── Fase 3 (autorizaciones+auditoría)
         ├── Fase 4 (IA+canales+reservas)
         └── Fase 5 (cierre IA+talento+offline)
```

Fases 3, 4 y 5 pueden ir en paralelo después de Fase 2; las haré secuenciales para mantener QA limpio salvo que pidas paralelismo.

## Tamaño estimado por fase
- F1: ~6–8 archivos nuevos + 1 migración. Mediana.
- F2: ~10 archivos + 1 migración. Grande.
- F3: ~6 archivos + 2 migraciones (audit + fraud signals). Mediana.
- F4: ~8 archivos + 3 edge functions + 1 migración. Grande.
- F5: ~7 archivos + 2 edge functions + 2 migraciones. Mediana-grande.

## Lo que NO incluye este plan (lo dejo fuera explícitamente, dímelo si lo quieres dentro)
- Integración real con datafonos físicos (SDK del banco): se queda como "pasarela virtual" usando lo que ya hay.
- Certificación DIAN/facturación electrónica del ticket POS (sigue diferido como BL-12).
- App nativa Capacitor del POS (la PWA actual cubre tablet).

## Cómo procedo
Al darme luz verde, implemento **Fase 1 completa** y te aviso para validar antes de pasar a Fase 2.
