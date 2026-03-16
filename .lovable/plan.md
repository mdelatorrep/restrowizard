
Objetivo: cortar de raíz el “loop” y la incoherencia del flujo de creación de cuenta/restaurante para `mdelatorrep@gmail.com`, eliminando errores de red/políticas y alineando redirecciones con la etapa real del negocio.

1) Diagnóstico confirmado (causas raíz)
- Error 500 recurrente: `infinite recursion detected in policy for relation "restaurant_team_members"`.
  - Causa: políticas RLS de `restaurant_team_members` se auto-consultan (subquery a la misma tabla dentro de policy).
- Error 400 recurrente: `column daily_sales.date does not exist`.
  - Causa: `useFirst90Days` consulta `daily_sales` con `.order('date')` pero la columna real es `sale_date`.
- Comportamiento incoherente por multi-negocio:
  - Hay múltiples `restaurant_businesses` para el mismo owner.
  - Hooks críticos (`useDataUserId`, `useTeamPermissions`, `useTeamMembers`) usan `maybeSingle()` sin `order+limit`, fallan/caen a rutas de team-membership y disparan más errores.
- “Sensación de loop”:
  - ` /r/dashboard` redirige según lifecycle a `/r/first-90-days`; si hay errores de datos en esa vista, parece ciclo roto aunque onboarding esté completo.

2) Corrección de backend (raíz de errores de team members)
- Crear migración para `restaurant_team_members`:
  - `DROP POLICY` de policies recursivas actuales.
  - Reemplazar por policies que NO consulten directamente `restaurant_team_members` dentro de la policy.
  - Usar funciones `SECURITY DEFINER` existentes (o nuevas) para evaluar rol/acceso (p. ej. owner/admin/manager) y evitar recursión.
- Resultado esperado:
  - Desaparecen 500 en queries a `restaurant_team_members`.
  - Sidebar/permisos y resolución de usuario dejan de entrar en fallback errático.

3) Corrección frontend multi-business-safe (consistencia de identidad)
Actualizar hooks para soportar múltiples negocios sin `.maybeSingle()` ambiguo:
- `src/hooks/useDataUserId.ts`
- `src/hooks/useTeamPermissions.ts`
- `src/hooks/useTeamMembers.ts`
Cambio:
- Reemplazar consultas owner por:
  - `.order('created_at', { ascending: false }).limit(1).maybeSingle()`
  - manejo explícito de `error` antes de continuar.
- Si usuario es owner, cortar flujo y NO consultar `restaurant_team_members`.
Resultado:
- Se evita caer en consultas de membresía innecesarias.
- Menos errores, menos reintentos de React Query, menos “ruido” en flujo post-login.

4) Corrección First 90 Days (error SQL + coherencia temporal)
- `src/hooks/useFirst90Days.ts`
Cambios:
- `.order('date')` -> `.order('sale_date')`.
- En `calculateWeeklyGrowth`, usar `sale_date` (con fallback defensivo) en vez de `date`.
- Calcular `daysOpen` con `opening_date` (si existe) en vez de `created_at` para alinear con lifecycle real.
Resultado:
- Se elimina el 400 repetitivo.
- Métricas de primeros 90 días coherentes con apertura real.

5) Coherencia de navegación post-login/post-onboarding
- `src/components/auth/AuthProvider.tsx` y/o flujo de salida de onboarding:
  - Mantener guardias actuales, pero navegar directo según lifecycle cuando ya hay onboarding completo (pre-opening/first-90-days/normal).
  - Evitar salto “dashboard -> redirección inmediata” cuando ya conocemos etapa.
Resultado:
- Menos percepción de “rebote/loop”.
- Entrada más predecible al módulo correcto.

6) Saneamiento de datos del usuario afectado
- Ejecutar limpieza controlada para `mdelatorrep@gmail.com`:
  - conservar 1 negocio “activo” (más reciente y consistente con opening_date).
  - eliminar duplicados accidentales.
- No imponer unicidad global por owner (se conserva soporte multi-negocio), solo limpieza puntual.

7) Validación end-to-end (criterio de cierre)
Casos a probar:
- Login de `mdelatorrep@gmail.com` desde `/auth`.
- Acceso a `/r/dashboard` y landing estable según etapa (sin rebotes erráticos).
- Carga de `/r/first-90-days` sin errores 400.
- Sin errores 500 de `restaurant_team_members`.
- Reingreso de sesión (logout/login) sin volver a onboarding.
- Navegación a diagnóstico y retorno a dashboard sin romper flujo.

Detalle técnico (resumen)
- SQL migration: refactor RLS en `restaurant_team_members` para eliminar recursión (usar `SECURITY DEFINER` helpers).
- Frontend hooks hardening:
  - owner lookup con `order+limit+maybeSingle` + manejo explícito de errores.
- First90Days fix:
  - `daily_sales.sale_date` en query + parsing consistente de fechas.
- Routing consistency:
  - redirección inicial basada en lifecycle cuando onboarding ya está completo.
