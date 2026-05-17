# Auditoría integral RestroWizard — Plan de remediación

## 0. Foto de la plataforma

| Métrica | Valor |
|---|---|
| Tablas en `public` | 153 |
| Edge Functions | 27 |
| Páginas (React) | 100 |
| Hooks personalizados | 81 |
| Componentes | 234 |
| Índices DB | 280 |
| Edge functions con validación Zod | 0/27 |
| Tablas con auditoría dedicada | 5 (debug_events, order_status_history, inventory_price_history, notifications_log, rappi_webhook_events) |
| Componentes > 500 líneas | 15 |

Stack: React 18 + Vite, Tailwind, shadcn, React Query, Supabase (Lovable Cloud), Deno Edge Functions, Lovable AI Gateway. Multi-tenant por `user_id` + `restaurant_team_members`.

---

## 1. Brechas por frente

### A. Arquitectura de software

| # | Brecha | Evidencia | Impacto |
|---|---|---|---|
| A1 | **God components**: 15 archivos >500 líneas (POS 948, Loyalty 966, NewQuotation 868, Suppliers 635, Recipes 611, Brand 590, Reservations 592, OpeningPlanPDF 1.405) mezclan estado, UI y data fetching | `wc -l` | Difícil de testear, alto riesgo en cambios |
| A2 | **27 edge functions sin validación de entrada** (no usan Zod) | grep | Vulnerabilidades de inyección/payloads malformados |
| A3 | **Sin capa de servicios**: hooks llaman directo a `supabase.from(...)` con queries duplicadas (p.ej. fetch de `restaurant_businesses` en ≥15 hooks) | repo grep | Cambios de schema rompen N hooks |
| A4 | **Sin contratos compartidos** entre frontend ↔ edge functions (DTOs duplicados) | `_shared/rappi.ts` único | Drift de tipos |
| A5 | **AI gateway**: cada edge fn re-implementa retry/backoff y parseo de JSON markdown | mem://technical/ai-configuration-standards | Duplicación, comportamiento inconsistente |
| A6 | **No hay tests** (unit/integration/edge) salvo lo manual | repo sin `__tests__` ni `_test.ts` | Regresiones invisibles |
| A7 | **Estado global fragmentado**: `useAuth`, `ActiveClientContext`, `useUserType` + React Query — sin SSOT del "negocio activo" | múltiples Providers | Bugs de cache (ya documentados en mem) |
| A8 | **27 edge functions monolíticas**, sin helpers compartidos para CORS, auth, logging, errores estandarizados | solo `_shared/rappi.ts` | Mantenimiento costoso |
| A9 | **Sin versionado de APIs internas** (edge fns no llevan `/v1`) | rutas planas | Breaking changes silenciosos |
| A10 | **Sin feature flags**: lanzamientos = deploy + memoria del usuario | no hay tabla | Rollbacks dolorosos |

### B. UX / UI

| # | Brecha | Evidencia | Impacto |
|---|---|---|---|
| B1 | **Inconsistencia de layouts**: existe `ModulePageLayout` pero no se usa en todas las páginas | mem://style/unified-design-system | UI dispar entre módulos |
| B2 | **Estados vacíos genéricos** o ausentes; pocos llevan ilustración + CTA | inspección | Onboarding pobre por módulo |
| B3 | **Estados de error mostrados como toast efímero**, sin reintentar inline | `useRappiIntegration` y otros | Usuarios pierden contexto |
| B4 | **Mobile gaps**: páginas largas (Loyalty, POS) tienen tabs/forms que no colapsan bien en 411px | viewport actual del usuario | Fricción móvil |
| B5 | **Accesibilidad**: no se garantiza `aria-label`, foco visible, jerarquía H1/H2 fija (un solo H1 por página) | sin axe-check | Bloqueos a usuarios con AT |
| B6 | **Skeletons inconsistentes**: muchos hooks devuelven `Loader2` spinner en vez de skeleton del contenido | grep | Percepción de lentitud |
| B7 | **i18n**: copy en español hard-codeado en cientos de componentes (sin sistema i18n) | no hay `i18next` | Imposible escalar a otros mercados |
| B8 | **Onboarding fragmentado**: 5 stages del lifecycle pero la navegación de prerequisitos no siempre se muestra de forma autoexplicativa | mem://ux/module-navigation-logic | Confusión en usuarios nuevos |
| B9 | **Formularios sin validación inline**: dependen de toast tras submit (Rappi, Brand, Settings) | repo | Errores tardíos |
| B10 | **Comandos AI sin "explain action"**: el usuario no ve por qué la IA hizo X | módulos AI | Baja confianza |

### C. Trazabilidad y auditabilidad

| # | Brecha | Evidencia | Impacto |
|---|---|---|---|
| C1 | **Sin audit log central** para acciones CRUD sensibles (precios, recetas, permisos, integraciones, pedidos) | solo 5 tablas log dispersas | Imposible responder "¿quién cambió qué?" |
| C2 | **`debug_events` se usa para flujo de negocio** (onboarding) en vez de para debugging puro | mem://ux/onboarding-flow-persistence | Mezcla concerns |
| C3 | **Sin trazabilidad de pedidos cross-canal**: POS, Rappi, website propio no comparten un `unified_orders_history` | `restaurant_orders` vs `aggregator_orders` separados | Conciliación manual |
| C4 | **Edge functions no loguean correlation_id ni request_id** | sin estándar | Debugging difícil en producción |
| C5 | **Mutaciones de inventario sin reason code**: `record_inventory_movement` marca todo como `adjustment` cuando viene de un trigger | `update_function` | Reportes sin causa |
| C6 | **Sin versionado de recetas** activo aunque exista `recipe_versions` (1 política RLS, no usado por UI) | tabla huérfana | No se puede rollback a costo histórico |
| C7 | **Webhooks Rappi**: tabla `rappi_webhook_events` para idempotencia, pero no expone UI de "ver últimos eventos" | UI ausente | Operadores ciegos a fallas |
| C8 | **Conciliación financiera**: `pos_transactions`, `aggregator_orders`, `consulting_invoices` sin trazabilidad cruzada con `finances` | sin tabla puente | Reportes inconsistentes |
| C9 | **Sin tracking de impersonación**: consultor entrando como cliente (`ActiveClientContext`) no se loguea | grep | Riesgo legal/compliance |
| C10 | **Permisos cambian sin historial**: `restaurant_team_members.permissions` se sobreescribe | tabla sin shadow | No se puede auditar quién quitó acceso |

### D. Captura y gestión de datos

| # | Brecha | Evidencia | Impacto |
|---|---|---|---|
| D1 | **40+ tablas con UNA sola política RLS** (típicamente solo SELECT) | psql query | Posibles huecos de INSERT/UPDATE/DELETE |
| D2 | **30+ foreign keys sin índice** (chain_locations, copilot_messages, purchase_order_items, pos_transactions, etc.) | `pg_constraint` | Joins lentos, deadlocks |
| D3 | **CHECK constraints temporales en código** en vez de triggers (riesgo de inmutabilidad) | mem://supabase | Migraciones inestables |
| D4 | **`profiles` con campos de negocio** (restaurant_name) duplicados con `restaurant_businesses` | trigger `handle_new_user` | Inconsistencia |
| D5 | **`menu_items.items` jsonb** se usa para calcular ventas con `jsonb_array_elements` en runtime sin índice GIN | `calculate_menu_item_scores` | Performance degrade con volumen |
| D6 | **Sin schema versioning** para JSONB (sync_status, permissions, items) | grep | Rompe lectura al cambiar shape |
| D7 | **Datos de catálogo (allergens, measurement_units, event_categories)** son por-usuario en vez de globales | tablas con 1 RLS | Cada restaurant repite catálogos |
| D8 | **Sin soft-delete estándar**: cascades pueden borrar histórico financiero | mem://technical/database-cascade-delete-standard | Pérdida de datos contables |
| D9 | **Sin políticas de retención** para `debug_events`, `notifications_log`, `rappi_webhook_events` | nada de cron de purga | Crecimiento ilimitado |
| D10 | **Datos sensibles en plano**: `aggregator_integrations.client_secret_encrypted` está cifrado, pero claves API de pagos (Stripe/Wompi/MercadoPago) en `payment_gateways` requieren auditoría | revisar | Cumplimiento PCI |
| D11 | **Multi-business**: hooks evitan `.single()` (regla en memoria) pero no hay índice compuesto `(owner_id, created_at)` confirmado en `restaurant_businesses` | revisar | Lentitud en navegación |
| D12 | **Sin validación de input server-side** en edge functions (D = 0 Zod) | grep | Datos basura |

### E. Seguridad

| # | Brecha | Evidencia | Impacto |
|---|---|---|---|
| E1 | **27 edge fns con `verify_jwt=false` por defecto** en Lovable; validación in-code inconsistente | `_shared/rappi.ts` lo hace bien, otras no | Endpoints abiertos |
| E2 | **Webhook Rappi**: HMAC OK, pero no hay rate-limit por IP/integración | edge fn | DoS posible |
| E3 | **Encripción AES-GCM** deriva de `SUPABASE_SERVICE_ROLE_KEY` (rotable) — al rotar, todos los secrets quedan inaccesibles | `getKey()` | Riesgo operativo serio |
| E4 | **`get_platform_stats` / `seed_platform_admin`**: SECURITY DEFINER correctos, pero no hay rate-limit | linter | Abuso por admins comprometidos |
| E5 | **Storage bucket `brand-assets` público**: cualquier URL es accesible sin scope | listado | Filtrado de imágenes privadas |
| E6 | **CORS `*`** en todas las edge fns | `_shared/rappi.ts` | OK para públicas, NO para autenticadas |
| E7 | **Sin Content Security Policy** ni headers de seguridad en `index.html` | revisar | XSS amplificado |
| E8 | **Sin HIBP password check** activado | configure_auth | Passwords filtrados aceptados |
| E9 | **Datos PII de candidatos (resume_url, email, phone)** sin minimización ni TTL | `candidate_profiles` | GDPR/Ley 1581 riesgo |
| E10 | **Logs pueden filtrar tokens**: edge fns hacen `JSON.stringify(error)` que puede incluir secrets | revisar | Token leakage |

### F. Performance y escalabilidad

| # | Brecha | Evidencia | Impacto |
|---|---|---|---|
| F1 | **30+ FK sin índice** (ver D2) | psql | Queries N+1 |
| F2 | **React Query sin `staleTime` global** y `select` selectivos | revisar | Re-fetch innecesarios |
| F3 | **Páginas que cargan TODO al montar** (Dashboard 741 líneas, Loyalty 966) | grep | First Paint lento |
| F4 | **Sin code-splitting por ruta** (todo en bundle único de Vite) | `App.tsx` con imports directos | Bundle pesado |
| F5 | **Hooks que invocan 5+ queries sin `useQueries`** (useFinancesData, useGhostKitchenData) | repo | Waterfall de requests |
| F6 | **Realtime subscriptions** se crean por componente sin agrupación (Rappi, KDS, Orders) | grep | Conexiones múltiples |
| F7 | **Cron `rappi-orders-poll` cada 1 minuto** sin backoff cuando no hay actividad | config | Costo y rate-limit Rappi |
| F8 | **Funciones AI sin streaming** (todo se carga al final) | edge fns | UX percibida lenta |
| F9 | **Imágenes no optimizadas** (sin AVIF/WebP, sin lazy loading sistemático) | público | Pobre LCP |
| F10 | **Sin CDN para assets de marca** (van por Supabase Storage directo) | grep | Latencia variable |

---

## 2. Roadmap completo (5 fases, ~16 semanas)

### Fase 1 — Higiene y blindaje (Semanas 1-2) — P0

Objetivo: cerrar agujeros que dañan datos hoy.

1. **Audit log central**: tabla `audit_log(user_id, business_id, actor_id, entity, entity_id, action, before jsonb, after jsonb, ip, ua, at)` + helper edge `audit-write` + triggers en `restaurant_team_members`, `payment_gateways`, `aggregator_integrations`, `inventory_items`, `menu_items`, `recipes`.
2. **Zod en edge functions** (27 → 27): plantilla `_shared/validate.ts` + migrar las 5 más críticas (rappi-webhook, rappi-order-action, pos-payment-processor, copilot-chat, send-push-notification).
3. **Índices faltantes**: crear índices para los 30+ FK sin índice y para `aggregator_orders(user_id, created_at)`, `restaurant_orders(user_id, created_at)`, `pos_transactions(session_id, created_at)`.
4. **HIBP password check** activado vía `configure_auth`.
5. **Auditoría de RLS**: revisar las 40 tablas con 1 sola política y agregar UPDATE/DELETE explícitos (o documentar por qué solo SELECT).
6. **Headers seguridad** en `index.html` (CSP básico, X-Frame, Referrer-Policy).
7. **Rotación de clave de cifrado**: separar `RAPPI_ENCRYPTION_KEY` del service role (clave dedicada con rotación documentada).

### Fase 2 — Trazabilidad operativa (Semanas 3-5) — P0/P1

Objetivo: poder responder "qué pasó y por qué" en cualquier transacción.

1. **`unified_orders_view`** SQL view que une POS + Rappi + website con esquema común (channel, external_id, total, commission, customer).
2. **`order_lifecycle_events`** tabla que captura cada transición (pending→accepted→ready→delivered) con actor y timestamp; reemplaza `order_status_history` y suma webhooks.
3. **UI "Eventos recientes"** por integración (Rappi, Stripe, Wompi) consumiendo `rappi_webhook_events` y nuevo `payment_webhook_events`.
4. **Impersonación logueada**: `consultant_impersonation_log(consultant_id, client_user_id, started_at, ended_at, ip)`.
5. **Histórico de permisos**: trigger sobre `restaurant_team_members.permissions` → `team_permissions_history`.
6. **Correlation IDs**: helper `_shared/log.ts` que genera `x-request-id`, lo propaga a fetch y a inserts de audit.
7. **Retention jobs**: pg_cron diario que purga `debug_events` >90d, `notifications_log` >180d, `rappi_webhook_events` >365d.

### Fase 3 — Arquitectura y mantenibilidad (Semanas 6-9) — P1

Objetivo: bajar el costo de cada cambio futuro.

1. **Capa de servicios** `src/services/{module}.ts` que envuelve `supabase.from(...)` y exponga funciones tipadas. Hooks pasan a consumir servicios.
2. **Refactor god components**: dividir POS, Loyalty, Brand, Suppliers, OpeningPlanPDF en subcomponentes <300 líneas. Extraer feature folders.
3. **Estándar de edge function**: `_shared/{cors,validate,auth,log,ai,errors}.ts`; migrar las 27 funciones a este esqueleto.
4. **`useActiveBusiness` único** que reemplace `useDataUserId` + `ActiveClientContext` + parte de `useAuth` con un Provider + hook.
5. **Code-splitting por ruta** con `React.lazy()` en `App.tsx` y prefetch en hover.
6. **Sistema de feature flags** (`feature_flags` tabla + hook `useFeatureFlag`).
7. **DTOs compartidos** en `src/types/api/` generados desde Zod (single source of truth front/back).

### Fase 4 — UX/UI sistémico (Semanas 10-12) — P1

Objetivo: experiencia consistente y accesible.

1. **Adopción de `ModulePageLayout` + `KPIGrid`** en las 100 páginas (auditar y migrar).
2. **EmptyState global** con ilustración + CTA + checklist (similar al de Rappi recién hecho).
3. **Sistema de errores inline**: `<ErrorBoundary>` por sección + componente `<ErrorState retry/>` reemplaza toasts perdidos.
4. **Validación inline con react-hook-form + Zod** en los 20 forms críticos.
5. **Accesibilidad pass**: axe-core en CI, foco visible global, jerarquía H1 verificada.
6. **Skeletons reales** por módulo (sustituyen spinners).
7. **i18n base con `react-i18next`**: extraer strings de Header/Sidebar/Dashboard, dejar arquitectura lista para EN/PT (sin traducir todo aún).
8. **AI "explain": cada acción IA muestra "qué considero y por qué" colapsable.

### Fase 5 — Performance, escalabilidad y plataforma (Semanas 13-16) — P2

Objetivo: prepararse para 10× del volumen actual.

1. **React Query config global**: `staleTime: 30s`, `gcTime: 5min`, `select` selectivos, `useQueries` en hooks multi-fetch.
2. **Realtime hub**: un único canal por business_id que multiplexa eventos a hooks suscritos.
3. **Backoff inteligente para crons**: rappi-orders-poll cada 1m si activo, 5m si silencio >30m.
4. **Imágenes AVIF/WebP** vía `vite-imagetools`, lazy + dimensiones explícitas para CLS.
5. **CDN delante de `brand-assets`** (Cloudflare Image Resizing o equivalente).
6. **Streaming de respuestas AI** (Server-Sent Events en copilot-chat y analyses largos).
7. **Materialized views** para reportes pesados (sales por día/canal, prime cost mensual) refrescados por pg_cron.
8. **Observabilidad**: integrar logs estructurados + dashboard de errores en Lovable Cloud (consulta `analytics_query`).
9. **Tests**: Vitest unit (50 tests prioritarios), Playwright smoke (10 flujos críticos), Deno tests en edge functions clave.
10. **Soft-delete y políticas de retención** en tablas financieras (reemplaza CASCADE por `deleted_at`).

---

## 3. Priorización ejecutiva

| Prioridad | Bloque | Cuándo | Riesgo si no se hace |
|---|---|---|---|
| **P0** | Fase 1 + auditoría RLS | Semanas 1-2 | Pérdida o filtrado de datos, sanciones |
| **P0** | Trazabilidad de órdenes y permisos | Semanas 3-5 | No poder responder disputas, conciliación rota |
| **P1** | Refactor de god components + servicios | Semanas 6-9 | Velocidad de equipo cae con cada feature |
| **P1** | UX sistémico + accesibilidad | Semanas 10-12 | Churn de usuarios y bloqueo a mercados regulados |
| **P2** | Performance, i18n, tests, observabilidad | Semanas 13-16 | Costos crecientes y degradación a escala |

---

## 4. Forma de trabajo sugerida

- Cada fase = 1 PR épico con sub-PRs por brecha (etiquetados `P0-audit`, `P1-arch`, etc.).
- Cada brecha cerrada actualiza una entrada en `mem://` para reglas durables.
- Tablero "Health Score" en `/admin` con: % de tablas con RLS completa, % edge fns con Zod, índices faltantes, tamaño promedio de componente, cobertura de tests. Permite medir el progreso.

---

## 5. Qué se entregará al aprobar

Al aprobar este plan, ejecutaremos **Fase 1 completa** como primer hito (P0): migración SQL del audit log + índices faltantes + activación HIBP + plantilla Zod + headers seguridad + revisión RLS de las 40 tablas críticas. Después acordamos seguir con Fase 2.