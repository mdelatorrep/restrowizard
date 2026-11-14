# Arquitectura

## Vista general

```
Navegador (React SPA)  ──HTTPS──▶  Supabase
  ├─ sitio público /p/:slug          ├─ Postgres 17: 180 tablas, RLS en todas, 293 triggers
  ├─ panel del dueño /r/*            ├─ Auth (correo + contraseña; enlace mágico para el PIN del POS)
  ├─ POS /:slug/pos                  ├─ Storage: brand-assets, invoices, pos-closures
  └─ admin /admin                    ├─ Edge functions (Deno): 35, ver docs/referencia/edge-functions.md
                                     ├─ pg_cron: 13 trabajos (demo, retención, alertas, Rappi)
                                     └─ Realtime: cocina, mesas, alertas
Edge functions ──▶ Lovable AI Gateway (modelos de IA) · Rappi API · Resend (correo) · Firecrawl
```

Hoy el frontend se publica desde Lovable y la base es un proyecto de Lovable Cloud. El plan (decisión D1) lleva todo a un proyecto Supabase de la empresa en la fase 5; el repositorio ya no depende de Lovable para reconstruir la base (B-04).

## Multi-tenant y permisos

- Cada restaurante es un **dueño** (`auth.users.id`). Casi todas las tablas tienen `user_id` = dueño.
- Gerentes, cajeros y cocina son filas de `restaurant_team_members` con un rol (`manager`, `cashier`, `kitchen`, `staff`) y permisos por módulo (`restaurant_custom_roles`).
- Las políticas RLS usan `team_owner_ids(modulos, nivel)`: devuelve el propio `auth.uid()` y los dueños para los que el usuario tiene acceso a esos módulos. Ejemplo: `user_id IN (SELECT team_owner_ids(ARRAY['pos'], 'write'))`.
- `assign_team_owner_user_id()` reescribe `user_id` al del dueño cuando un miembro del equipo inserta.
- Funciones `SECURITY DEFINER`: ninguna ejecutable por `anon` salvo las públicas de la lista blanca (reservas, fidelización por código, inscripción y feedback). Regla en `CONTRIBUTING.md`.

## Flujos que mueven dinero

| Flujo | Dónde vive |
| --- | --- |
| Venta en POS → cocina → cierre de caja | `src/pages/pos`, `pos-close-session`, triggers `pos_audit_*` |
| Venta → descuento de inventario por receta | trigger `process_order_inventory_deduction` |
| Propinas por periodo | tablas `tip_*`, triggers `tg_tip_*` |
| Puntos de lealtad | `website-public-order`, `public_feedback_after_submit`, `public_loyalty_*` |
| P&L, gastos recurrentes, flujo de caja | `src/hooks/finance`, cron `finance-materialize-recurring` |

Ver [lógica en la base](referencia/logica-en-base.md) para el catálogo completo.

## Día de negocio

Bogotá, corte a las 6 a. m. (`business_day_of()` en SQL, `src/lib/businessDay.ts` en la app). Una venta a la 1 a. m. del sábado cuenta para el viernes.

## Interruptores de producto

`src/config/features.ts` apaga módulos sin contenido o sin respaldo (ecosistema, huérfanos, Rappi). Un módulo apagado no aparece en el menú ni responde por URL; su código y sus tablas se conservan.

## Seguridad en el navegador

CSP en `index.html` (`script-src 'self'`), bloqueo de incrustación en el dominio público (`src/lib/frameGuard.ts`) hasta tener cabeceras propias, sin scripts de terceros.
