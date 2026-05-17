## Integración Rappi — Plan integral

Aprovechamos la infraestructura existente (`aggregator_integrations`, `aggregator_orders`, `kitchen_production_queue`, módulo Ghost Kitchen) y la extendemos para soportar el API oficial de Rappi (OAuth client_credentials, recursos de stores/menu/orders/events).

### 1. Base de datos (migración)

**Extender `aggregator_integrations`** (no romper datos):
- `client_id` (text), `client_secret_encrypted` (text), `access_token_encrypted` (text), `token_expires_at` (timestamptz)
- `store_ids` (text[]) — un aliado puede tener múltiples tiendas
- `webhook_secret` (text) — para validar firmas
- `sync_status` (jsonb) — última sincronización por recurso
- `environment` (text: 'sandbox' | 'production')

**Extender `aggregator_orders`**:
- `raw_payload` (jsonb), `status_history` (jsonb[]), `rejection_reason` (text)
- `pickup_code` (text), `courier_info` (jsonb), `customer_phone` (text)
- Índice único `(platform, external_order_id)`

**Nuevas tablas**:
- `rappi_menu_sync` — mapea `menu_items.id` ↔ `external_item_id` por integración (estado, último push, errores)
- `rappi_store_status` — historial de aperturas/cierres/pausas por store_id
- `rappi_webhook_events` — log crudo de eventos recibidos (idempotencia por `event_id`)
- `rappi_settlements` — liquidaciones/comisiones diarias para conciliación

RLS por `user_id` siguiendo patrón existente.

### 2. Edge Functions

| Función | Tipo | Responsabilidad |
|---|---|---|
| `rappi-auth` | interna | OAuth client_credentials, cache de token, refresh automático |
| `rappi-sync-menu` | invoke | Push de menús/items/modificadores/precios/disponibilidad desde nuestras tablas a Rappi |
| `rappi-store-control` | invoke | Abrir/cerrar/pausar tienda, actualizar horarios |
| `rappi-orders-poll` | cron 1 min | Fallback: GET de pedidos nuevos por cada integración activa |
| `rappi-webhook` | público (verify_jwt=false) | Recibe eventos `NEW_ORDER`, `STATUS_CHANGE`, `CANCELLATION`; valida firma; inserta en `aggregator_orders` + `kitchen_production_queue` |
| `rappi-order-action` | invoke | Aceptar/rechazar/marcar listo/entregado; sincroniza estado al API |
| `rappi-settlements-sync` | cron diario | Descarga liquidaciones y pobla `rappi_settlements` |

Todas validan JWT (excepto webhook), usan secretos `RAPPI_API_BASE_URL`, cifran credenciales del restaurante con `pgcrypto` (clave en `RAPPI_ENCRYPTION_KEY`).

### 3. Frontend — UI por restaurante

**Nuevo: `src/pages/restaurant/integrations/Rappi.tsx`** (ruta `/r/integrations/rappi`)
- **Tab Conexión**: formulario para `client_id`, `client_secret`, `store_id(s)`, ambiente sandbox/prod. Botón "Probar conexión" → llama `rappi-auth`. Muestra estado (token válido, última sync).
- **Tab Menú**: lista de menús publicados con botón "Sincronizar con Rappi"; tabla de items con estado de sync, último error, disponibilidad togglable (push inmediato).
- **Tab Tienda**: control de apertura/cierre/pausa con motivo y duración; editor de horarios.
- **Tab Pedidos**: tabla en vivo de pedidos Rappi (reusa `aggregator_orders`) con acciones aceptar/rechazar/listo/entregado.
- **Tab Conciliación**: reporte de `rappi_settlements`, comisiones, neto a recibir, export CSV.

**Hooks nuevos**:
- `useRappiIntegration` — CRUD de credenciales + test
- `useRappiMenuSync` — orquesta push y muestra progreso
- `useRappiOrders` — extiende `useGhostKitchenData` filtrando `platform='rappi'` con realtime
- `useRappiSettlements`

**Realtime**: habilitar `aggregator_orders` en `supabase_realtime` para que el tab de Pedidos y el KDS reciban nuevos pedidos al instante.

**Navegación**: agregar entrada "Integraciones › Rappi" en `AppSidebar` para roles con permiso `delivery:write`.

### 4. Integración con módulos existentes

- **KDS / `kitchen_production_queue`**: el webhook inserta automáticamente (ya existe FK).
- **Inventario**: al marcar pedido como aceptado dispara `useInventoryDeduction` con receta vinculada.
- **Finanzas**: `rappi_settlements` se agrega a `useAggregatedFinances` como canal de ingreso con comisión.
- **Menu Engineering**: los pedidos Rappi cuentan en `calculate_menu_item_scores` (ya basado en `restaurant_orders`; añadiremos vista que une `aggregator_orders` por `menu_item_id`).
- **Ghost Kitchen module**: ya muestra `ordersByPlatform`; aparecerá Rappi automáticamente.

### 5. Seguridad

- Cifrado AES-GCM de `client_secret` y `access_token` con `pgcrypto` (clave en secret).
- Validación HMAC de webhooks Rappi (`X-Rappi-Signature`).
- Rate limiting básico en webhook (deduplicación por `event_id`).
- RLS estricto: cada restaurante solo ve sus integraciones, pedidos y liquidaciones.

### 6. Secretos a configurar

- `RAPPI_API_BASE_URL` (prod y sandbox configurables)
- `RAPPI_ENCRYPTION_KEY` (cifrado de credenciales por restaurante)
- `RAPPI_WEBHOOK_PUBLIC_KEY` (si aplica firma asimétrica)

Las credenciales del aliado (`client_id`/`client_secret`) NO son secretos globales: cada restaurante las ingresa en su UI y se guardan cifradas en su fila.

### 7. Entregables por fase

```text
Fase 1 — Base
  • Migración DB + cifrado
  • Edge function rappi-auth
  • UI Tab Conexión + test

Fase 2 — Operación
  • rappi-sync-menu + UI Tab Menú
  • rappi-store-control + UI Tab Tienda
  • rappi-webhook + rappi-orders-poll + realtime
  • UI Tab Pedidos integrada con KDS

Fase 3 — Finanzas
  • rappi-settlements-sync (cron diario)
  • UI Tab Conciliación
  • Integración con módulo Finanzas
```

### Notas técnicas

- Documentación Rappi (`dev-portal.rappi.com`) detalla auth OAuth, `/api/v2/restaurants/stores`, `/menu`, `/orders`, `/events`. Implementaremos un cliente HTTP único en `_shared/rappi.ts` para reutilizar entre edge functions.
- Polling cada 60s como red de seguridad si el webhook falla; idempotencia garantizada por índice único.
- El módulo es extensible: el mismo patrón sirve después para Didi Food / Uber Eats reusando `aggregator_integrations`.
