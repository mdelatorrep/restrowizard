# Módulos: mapa funcional y cómo agregar uno

## Mapa funcional

| Promesa | Módulo | Ruta | Estado |
| --- | --- | --- | --- |
| Finanzas | Panel, Centro Financiero (P&L, gastos, CxP, flujo de caja, conciliación) | `/r/dashboard`, `/r/finances` | Activo |
| Vender y operar | POS, pedidos, pantalla de cocina, reportes y metas, auditoría | `/:slug/pos`, `/r/orders`, `/r/kitchen`, `/r/pos-reports`, `/r/pos-audit` | Activo |
| Inventario | Recetas y costos, inventario y proveedores, facturas con IA | `/r/recipes`, `/r/inventory`, `/r/invoices` | Activo |
| Talento | Turnos, ausencias, propinas | `/r/talent` | Activo |
| Presencia digital | Sitio web, menús digitales, reservas, domicilios | `/r/website`, `/r/menus`, `/r/reservations`, `/r/delivery`; público `/p/:slug` | Activo |
| Margen y marketing | Ingeniería de menú, marketing gastronómico | `/r/menus`, `/r/marketing` | Activo |
| Copiloto | Chat, alertas, base de conocimiento | panel lateral, `/r/knowledge` | Activo |
| Fidelización y reputación | Puntos, portal del comensal, feedback por QR | `/r/loyalty`, `/r/feedback`, `/mi-fidelidad` | Activo |
| Indicadores | Sostenibilidad | `/r/sustainability` | Activo |
| Diagnóstico | Diagnóstico de madurez | `/diagnosis` | Activo |
| — | Ecosistema (RestroJobs, Learn, Services, Growth, Eventos, consultores) | `/jobs`, `/learn`, `/services`, `/growth`, `/events`, `/c/*` | Apagado (`FEATURES.ecosystem`) |
| — | Ghost kitchen, cadenas, nuevo negocio, preapertura, 90 días, PQRS, Mi desarrollo | `/r/ghost-kitchen`… | Apagado (`FEATURES.orphanModules`) |
| — | Rappi | `/r/integrations/rappi` | Apagado (`FEATURES.rappi`) hasta tener acceso de aliado |

## Agregar un módulo

1. **Promesa.** Escribe en una frase qué le resuelve al dueño y cómo se verifica (criterio observable). Sin promesa no hay módulo.
2. **Datos.** Migración en `supabase/migrations/` con tablas que llevan `user_id` (dueño), RLS activada y políticas con `team_owner_ids(ARRAY['<módulo>'], 'read'|'write')`. Si un miembro del equipo inserta, agrega el trigger `assign_team_owner_user_id`.
3. **Permisos.** Agrega la llave del módulo a `src/config/routePermissions.ts` y a los permisos por rol (`get_default_permissions_for_role`).
4. **Pantalla.** Página en `src/pages/restaurant/`, ruta en `src/App.tsx` envuelta en `GuardedRoute`, entrada en `src/components/navigation/AppSidebar.tsx`. Si el módulo no está listo para todos, agrégale un interruptor en `src/config/features.ts`.
5. **Acceso a datos.** Hook o servicio en `src/hooks` / `src/services`; nada de llamar a Supabase directo desde componentes nuevos.
6. **Pruebas.** Unitarias para la lógica (Vitest) y prueba SQL de permisos en `supabase/tests/sql/` con dos tenants.
7. **Documentación.** Esta tabla, el catálogo regenerado (`python3 scripts/gen-reference-docs.py`) y `CHANGELOG.md`.
