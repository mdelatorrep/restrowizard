-- ============================================================================
-- RBAC — Fix de resolución de permisos con roles personalizados (H-01) + landing cajero (H-05)
--
-- Problema (H-01): has_module_access resolvía con COALESCE(rtm.permissions, rcr.permissions).
-- Como el invite y el backfill dejan rtm.permissions con las 33 claves completas,
-- el COALESCE nunca consulta el custom role => los custom roles no tienen efecto real,
-- y la semántica difiere de la del frontend (drift).
--
-- Solución: precedencia única y explícita, idéntica a la del frontend:
--   override del miembro (si != 'none')  ->  custom role  ->  default del rol base
-- Es retro-compatible: no cambia firmas ni rompe llamadas existentes.
-- Además normaliza a '{}' los permisos de los miembros que SÍ tienen custom role,
-- para que el custom role gobierne (los overrides puntuales se vuelven a fijar desde la UI).
-- ============================================================================

-- 1) has_module_access con precedencia correcta -----------------------------
CREATE OR REPLACE FUNCTION public.has_module_access(
  _user_id uuid,
  _business_id uuid,
  _module text,
  _level text DEFAULT 'read'
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Owner del negocio: acceso total
  SELECT EXISTS (
    SELECT 1 FROM restaurant_businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM restaurant_team_members rtm
    LEFT JOIN restaurant_custom_roles rcr ON rcr.id = rtm.custom_role_id
    WHERE rtm.business_id = _business_id
      AND rtm.user_id = _user_id
      AND rtm.status = 'active'
      AND (
        rtm.role IN ('owner', 'admin')
        OR (
          -- Nivel efectivo del módulo con precedencia:
          --   override del miembro (ignorando 'none') -> custom role -> default del rol
          (CASE COALESCE(
                  NULLIF(rtm.permissions->>_module, 'none'),
                  rcr.permissions->>_module,
                  public.get_default_permissions_for_role(rtm.role)->>_module
                )
             WHEN 'admin' THEN 3
             WHEN 'write' THEN 2
             WHEN 'read'  THEN 1
             ELSE 0
           END)
          >=
          (CASE _level
             WHEN 'admin' THEN 3
             WHEN 'write' THEN 2
             WHEN 'read'  THEN 1
             ELSE 0
           END)
        )
      )
  );
$$;

-- 2) Normalizar miembros con custom role: permisos dispersos ----------------
-- Con custom_role_id presente, el custom role gobierna. Se limpian los permisos
-- completos que dejó el backfill para que no ensombrezcan al custom role.
UPDATE public.restaurant_team_members
SET permissions = '{}'::jsonb,
    updated_at = now()
WHERE custom_role_id IS NOT NULL
  AND status <> 'removed'
  AND permissions <> '{}'::jsonb;

-- 3) Fix landing del rol de sistema 'cashier' (H-05) ------------------------
-- '/pos' no es una ruta válida (POS standalone es /:slug/pos; POS in-app es /r/pos).
CREATE OR REPLACE FUNCTION public.seed_system_roles_for_business(_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('owner',   'Propietario',   'Acceso total al negocio',                    'LayoutDashboard', '/r/dashboard'),
      ('admin',   'Administrador', 'Gestiona todo excepto configuración crítica', 'Shield',         '/r/dashboard'),
      ('manager', 'Gerente',       'Operación diaria: ventas, equipo, inventario','Briefcase',      '/r/dashboard'),
      ('cashier', 'Cajero',        'Punto de venta y atención',                   'CreditCard',     '/r/pos'),
      ('kitchen', 'Cocina',        'Pantalla de cocina y recetas',                'ChefHat',        '/r/kitchen'),
      ('staff',   'Empleado',      'Mi desarrollo y consulta básica',             'Users',          '/r/my-development')
    ) AS t(key, label, descr, icon, landing)
  LOOP
    INSERT INTO public.restaurant_custom_roles
      (business_id, key, label, description, base_role, permissions, default_landing, icon, is_system)
    VALUES
      (_business_id, r.key, r.label, r.descr, r.key::team_member_role,
       public.get_default_permissions_for_role(r.key::team_member_role),
       r.landing, r.icon, true)
    ON CONFLICT (business_id, key) DO UPDATE
      SET permissions     = EXCLUDED.permissions,
          default_landing = EXCLUDED.default_landing,
          is_system       = true,
          updated_at      = now();
  END LOOP;
END;
$$;

-- Corregir filas ya sembradas
UPDATE public.restaurant_custom_roles
SET default_landing = '/r/pos', updated_at = now()
WHERE key = 'cashier' AND is_system = true AND default_landing = '/pos';

-- Re-sembrar todos los negocios existentes (idempotente) para propagar landings
DO $$
DECLARE b record;
BEGIN
  FOR b IN SELECT id FROM public.restaurant_businesses LOOP
    PERFORM public.seed_system_roles_for_business(b.id);
  END LOOP;
END $$;
