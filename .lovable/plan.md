## Diagnóstico estructural actual

**Lo que ya existe**
- Tabla `restaurant_team_members` con `role` (enum: owner/admin/manager/cashier/kitchen/staff) + `permissions` JSONB.
- Hook `useTeamPermissions` con `canAccess(modulo, nivel)` y `RequireModuleAccess` guard.
- Editor de permisos en Configuración → Equipo y plantillas por defecto en `DEFAULT_PERMISSIONS`.
- `AppSidebar` filtra ítems por `permissionModule` cuando está definido.
- Función SQL `has_module_access` para gating en backend.

**Brechas críticas detectadas**
1. **Cobertura incompleta de módulos.** `ModulePermissions` solo declara 16 módulos, pero el sidebar/rutas exponen ~25: faltan `sustainability`, `support`, `knowledge`, `invoices`, `electronic_invoicing`, `ghost_kitchen`, `chain_management`, `ecosystem_admin`, `new_business`, `pre_opening`, `first_90_days`, `pos_reports`, `pos_audit`, `kitchen_display`, `my_development`, `rappi`. Como no están en el contrato, no se pueden gatear → cualquier miembro los ve.
2. **Sidebar gatea, rutas NO.** Ningún `<Route>` de `/r/*` está envuelto en `RequireModuleAccess`. Quien conoce la URL entra aunque su rol no debería verla.
3. **Muchos ítems de sidebar sin `permissionModule`** (ej. POS Reports, POS Audit, Ghost Kitchen, Knowledge, Soporte, Facturas, Mi Desarrollo) → visibles para cualquier rol activo.
4. **Sin roles personalizados.** Solo se pueden usar los 6 enum; el dueño no puede crear "Mesero", "Barista", "Host", "Contador" con su propio set de permisos reutilizable.
5. **Sin landing por rol.** Cajero/cocina aterrizan en Dashboard genérico en vez de su pantalla operativa (POS o KDS).
6. **Editor de permisos no muestra todos los módulos** (faltan orders, ghost-kitchen, sustainability, support, knowledge, invoices, electronic-invoicing en `MODULE_GROUPS`).
7. **POS standalone** usa PIN de `staff_members`, sin enlazar al rol/permisos de `restaurant_team_members` → posible inconsistencia (un PIN de cajero podría no tener `pos.write`).
8. **`has_module_access` SQL** desconoce módulos nuevos → backend tampoco protege.

---

## Plan de remediación (3 fases)

### Fase 1 — Modelo completo de permisos (contrato único)

**Objetivo**: una sola fuente de verdad que cubra el 100% de módulos.

1. Ampliar `ModulePermissions` (TS) y el JSON de permisos a la lista canónica completa (~26 módulos):
   - Operativos: `dashboard`, `pos`, `pos_reports`, `pos_audit`, `kitchen_display`, `orders`, `delivery`, `rappi`, `reservations`.
   - Negocio: `brand`, `recipes`, `menus`, `inventory`, `suppliers`.
   - Personas: `talent`, `my_development`, `loyalty`, `feedback`, `support`.
   - Finanzas: `finances`, `invoices`, `electronic_invoicing`, `sustainability`.
   - Crecimiento: `new_business`, `pre_opening`, `first_90_days`, `ghost_kitchen`, `chain_management`.
   - Sistema: `website`, `knowledge`, `settings`, `team`, `ecosystem_admin`.
2. Recalcular `DEFAULT_PERMISSIONS` para los 6 roles base de modo coherente (cajero solo POS+órdenes+reservas read; cocina solo KDS+recetas read; manager operativo amplio sin finanzas/admin; admin todo menos team admin; etc.).
3. Migración SQL: backfill de `permissions` JSONB de miembros existentes a la nueva forma + actualización de `get_default_permissions_for_role` y `has_module_access` para conocer todos los módulos.
4. Sincronizar `MODULE_LABELS`, `MODULE_GROUPS` y `TeamPermissionsEditor` para que el dueño vea y configure los 26.

### Fase 2 — Roles personalizados + enforcement total

1. **Nueva tabla `restaurant_custom_roles`** (business_id, key, label, description, base_role, permissions JSONB, is_system, color/icon). Se siembran como `is_system=true` los 6 base; el dueño puede crear/editar/eliminar los suyos.
2. `restaurant_team_members.custom_role_id` (FK opcional). Si está presente, los permisos efectivos = permisos del custom role (overridables por `permissions` del miembro como excepción puntual).
3. UI en Configuración → Equipo:
   - Pestaña **"Roles"**: lista con plantillas base bloqueadas + botón "Crear rol" (nombre, descripción, copiar de…, editor de permisos por módulo con grupos colapsables, toggle "Landing por defecto" → qué módulo abre al entrar).
   - Pestaña **"Miembros"** ya existente: el selector de rol pasa a listar roles base + custom; el editor avanzado se mantiene para overrides.
4. **Guards en todas las rutas `/r/*`**: envolver cada `<Route>` con `<RequireModuleAccess module="..." level="read">` mapeando ruta→módulo en una tabla central (`src/config/routePermissions.ts`).
5. Ajustar `AppSidebar`: todo ítem declara `permissionModule` obligatorio; eliminar ítems "huérfanos" sin gate.
6. **Backend**: `has_module_access` lee de `restaurant_custom_roles` cuando el miembro tiene `custom_role_id`; RLS de tablas sensibles (finances, payments, audit, team) usa esta función.

### Fase 3 — Experiencia simplificada por rol

1. **Landing dinámica**: tras login, redirigir según `default_landing` del rol del usuario:
   - Cashier → `/pos/{slug}` (POS standalone, ya hecho).
   - Kitchen → `/r/kitchen` (KDS a pantalla completa).
   - Manager → `/r/dashboard` con vista operativa.
   - Admin/Owner → Dashboard ejecutivo.
   - Staff → `/r/my-development`.
2. **Sidebar adaptativo**: además de filtrar por permiso, ocultar grupos enteros vacíos y colapsar "Expansión" para roles no-admin. Mostrar nombre del rol activo en el footer del sidebar.
3. **POS standalone alineado**: al hacer login por PIN, traer también `team_member.custom_role_id` y aplicar `useTeamPermissions` dentro del POS (ocultar botones de cierre/descuento si no tiene `pos:admin`).
4. **AppHeader**: badge con rol; menú "Mi acceso" que lista módulos visibles (autoservicio de descubrimiento, sin overwhelm).
5. **Auditoría**: log en `audit_log` cuando el dueño crea/edita un rol o cambia permisos de un miembro (ya hay trigger `log_team_member_change`; extender para custom roles).

---

## Detalles técnicos

**Archivos a tocar**
- `src/hooks/useTeamMembers.ts` — ampliar `ModulePermissions`, `DEFAULT_PERMISSIONS`, `MODULE_LABELS`.
- `src/hooks/useTeamPermissions.ts` — soportar `custom_role_id`; exponer `defaultLanding`.
- `src/components/team/TeamPermissionsEditor.tsx` + nuevo `RoleEditor.tsx`, `RolesTab.tsx`.
- `src/components/team/TeamManagementTab.tsx` — añadir sub-tabs Miembros/Roles.
- `src/App.tsx` — envolver rutas `/r/*` con `RequireModuleAccess` usando `routePermissions.ts`.
- `src/config/routePermissions.ts` (nuevo) — mapa ruta→módulo→nivel.
- `src/components/navigation/AppSidebar.tsx` — `permissionModule` obligatorio, badge rol, landing por defecto.
- `src/components/auth/AuthProvider.tsx` / `OnboardingGuard.tsx` — redirección por `defaultLanding` después del login.
- `src/pages/pos/POSLogin.tsx` / `POSMain.tsx` — leer rol y permisos en sesión POS.

**Migraciones**
- `restaurant_custom_roles` (id, business_id, key, label, description, permissions jsonb, default_landing text, base_role team_member_role, is_system bool, color, icon) + GRANT + RLS (solo owner/admin del business).
- `restaurant_team_members.custom_role_id uuid REFERENCES restaurant_custom_roles(id) ON DELETE SET NULL`.
- Seed de 6 roles `is_system=true` por cada business existente.
- Update de `get_default_permissions_for_role` y `has_module_access` con los 26 módulos.
- Backfill: rellenar `permissions` de miembros con la nueva plantilla.

**Compatibilidad**
- Los 6 roles enum siguen existiendo y se mapean 1:1 a roles `is_system`.
- Código existente que use `permissions[modulo]` sigue funcionando porque solo se añaden claves.

---

¿Implemento las 3 fases en orden, o priorizo Fase 1+2 (cobertura + custom roles) y dejamos Fase 3 (landing/POS RBAC) para una segunda iteración?