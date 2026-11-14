
-- 1) Tabla de roles personalizados por negocio
CREATE TABLE IF NOT EXISTS public.restaurant_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.restaurant_businesses(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  base_role team_member_role NOT NULL DEFAULT 'staff',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_landing text,
  color text DEFAULT '#3E1064',
  icon text DEFAULT 'Shield',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_custom_roles TO authenticated;
GRANT ALL ON public.restaurant_custom_roles TO service_role;

ALTER TABLE public.restaurant_custom_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can view roles of their business"
  ON public.restaurant_custom_roles;
CREATE POLICY "Team can view roles of their business"
  ON public.restaurant_custom_roles FOR SELECT
  TO authenticated
  USING (
    public.is_business_owner(auth.uid(), business_id)
    OR EXISTS (
      SELECT 1 FROM public.restaurant_team_members rtm
      WHERE rtm.business_id = restaurant_custom_roles.business_id
        AND rtm.user_id = auth.uid()
        AND rtm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner or admin can create roles"
  ON public.restaurant_custom_roles;
CREATE POLICY "Owner or admin can create roles"
  ON public.restaurant_custom_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_business_owner(auth.uid(), business_id)
    OR public.is_team_admin(auth.uid(), business_id)
  );

DROP POLICY IF EXISTS "Owner or admin can update non-system roles"
  ON public.restaurant_custom_roles;
CREATE POLICY "Owner or admin can update non-system roles"
  ON public.restaurant_custom_roles FOR UPDATE
  TO authenticated
  USING (
    (public.is_business_owner(auth.uid(), business_id)
      OR public.is_team_admin(auth.uid(), business_id))
  )
  WITH CHECK (
    (public.is_business_owner(auth.uid(), business_id)
      OR public.is_team_admin(auth.uid(), business_id))
  );

DROP POLICY IF EXISTS "Owner or admin can delete custom roles"
  ON public.restaurant_custom_roles;
CREATE POLICY "Owner or admin can delete custom roles"
  ON public.restaurant_custom_roles FOR DELETE
  TO authenticated
  USING (
    is_system = false
    AND (public.is_business_owner(auth.uid(), business_id)
      OR public.is_team_admin(auth.uid(), business_id))
  );

CREATE INDEX IF NOT EXISTS idx_custom_roles_business
  ON public.restaurant_custom_roles(business_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_custom_roles_updated_at ON public.restaurant_custom_roles;
CREATE TRIGGER trg_custom_roles_updated_at
  BEFORE UPDATE ON public.restaurant_custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) FK opcional desde miembros de equipo
ALTER TABLE public.restaurant_team_members
  ADD COLUMN IF NOT EXISTS custom_role_id uuid
    REFERENCES public.restaurant_custom_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_custom_role
  ON public.restaurant_team_members(custom_role_id);

-- 3) Permisos por defecto canónicos (33 módulos)
CREATE OR REPLACE FUNCTION public.get_default_permissions_for_role(p_role team_member_role)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_role
    WHEN 'owner' THEN '{
      "dashboard":"admin","pos":"admin","pos_reports":"admin","pos_audit":"admin","kitchen_display":"admin",
      "orders":"admin","delivery":"admin","rappi":"admin","reservations":"admin",
      "brand":"admin","recipes":"admin","menus":"admin","inventory":"admin","suppliers":"admin",
      "talent":"admin","my_development":"admin","loyalty":"admin","feedback":"admin","support":"admin",
      "finances":"admin","invoices":"admin","electronic_invoicing":"admin","sustainability":"admin",
      "new_business":"admin","pre_opening":"admin","first_90_days":"admin","ghost_kitchen":"admin","chain_management":"admin",
      "website":"admin","knowledge":"admin","settings":"admin","team":"admin","ecosystem_admin":"admin"
    }'::jsonb
    WHEN 'admin' THEN '{
      "dashboard":"admin","pos":"admin","pos_reports":"admin","pos_audit":"admin","kitchen_display":"admin",
      "orders":"admin","delivery":"admin","rappi":"admin","reservations":"admin",
      "brand":"admin","recipes":"admin","menus":"admin","inventory":"admin","suppliers":"admin",
      "talent":"admin","my_development":"admin","loyalty":"admin","feedback":"admin","support":"admin",
      "finances":"admin","invoices":"admin","electronic_invoicing":"admin","sustainability":"admin",
      "new_business":"admin","pre_opening":"admin","first_90_days":"admin","ghost_kitchen":"admin","chain_management":"admin",
      "website":"admin","knowledge":"admin","settings":"write","team":"write","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'manager' THEN '{
      "dashboard":"read","pos":"write","pos_reports":"read","pos_audit":"none","kitchen_display":"write",
      "orders":"write","delivery":"write","rappi":"write","reservations":"write",
      "brand":"none","recipes":"read","menus":"read","inventory":"write","suppliers":"read",
      "talent":"write","my_development":"read","loyalty":"read","feedback":"read","support":"write",
      "finances":"read","invoices":"read","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"read","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"read","settings":"none","team":"read","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'cashier' THEN '{
      "dashboard":"none","pos":"write","pos_reports":"none","pos_audit":"none","kitchen_display":"none",
      "orders":"write","delivery":"read","rappi":"none","reservations":"read",
      "brand":"none","recipes":"none","menus":"read","inventory":"none","suppliers":"none",
      "talent":"none","my_development":"read","loyalty":"read","feedback":"none","support":"none",
      "finances":"none","invoices":"none","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"none","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"none","settings":"none","team":"none","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'kitchen' THEN '{
      "dashboard":"none","pos":"none","pos_reports":"none","pos_audit":"none","kitchen_display":"write",
      "orders":"write","delivery":"none","rappi":"none","reservations":"none",
      "brand":"none","recipes":"read","menus":"read","inventory":"read","suppliers":"none",
      "talent":"none","my_development":"read","loyalty":"none","feedback":"none","support":"none",
      "finances":"none","invoices":"none","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"none","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"read","settings":"none","team":"none","ecosystem_admin":"none"
    }'::jsonb
    WHEN 'staff' THEN '{
      "dashboard":"none","pos":"none","pos_reports":"none","pos_audit":"none","kitchen_display":"none",
      "orders":"none","delivery":"none","rappi":"none","reservations":"none",
      "brand":"none","recipes":"none","menus":"none","inventory":"none","suppliers":"none",
      "talent":"none","my_development":"write","loyalty":"none","feedback":"none","support":"none",
      "finances":"none","invoices":"none","electronic_invoicing":"none","sustainability":"none",
      "new_business":"none","pre_opening":"none","first_90_days":"none","ghost_kitchen":"none","chain_management":"none",
      "website":"none","knowledge":"read","settings":"none","team":"none","ecosystem_admin":"none"
    }'::jsonb
    ELSE '{}'::jsonb
  END;
$$;

-- 4) has_module_access actualizada para leer custom_role
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
  -- Owner: acceso total
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
          CASE _level
            WHEN 'read'  THEN COALESCE(rtm.permissions->>_module, rcr.permissions->>_module) IN ('read','write','admin')
            WHEN 'write' THEN COALESCE(rtm.permissions->>_module, rcr.permissions->>_module) IN ('write','admin')
            WHEN 'admin' THEN COALESCE(rtm.permissions->>_module, rcr.permissions->>_module) = 'admin'
            ELSE false
          END
        )
      )
  );
$$;

-- 5) Helper: sembrar los 6 roles del sistema para un negocio
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
      ('owner',   'Propietario',   'Acceso total al negocio',                   'LayoutDashboard', '/r/dashboard'),
      ('admin',   'Administrador', 'Gestiona todo excepto configuración crítica','Shield',         '/r/dashboard'),
      ('manager', 'Gerente',       'Operación diaria: ventas, equipo, inventario','Briefcase',     '/r/dashboard'),
      ('cashier', 'Cajero',        'Punto de venta y atención',                  'CreditCard',     '/pos'),
      ('kitchen', 'Cocina',        'Pantalla de cocina y recetas',               'ChefHat',        '/r/kitchen'),
      ('staff',   'Empleado',      'Mi desarrollo y consulta básica',            'Users',          '/r/my-development')
    ) AS t(key, label, descr, icon, landing)
  LOOP
    INSERT INTO public.restaurant_custom_roles
      (business_id, key, label, description, base_role, permissions, default_landing, icon, is_system)
    VALUES
      (_business_id, r.key, r.label, r.descr, r.key::team_member_role,
       public.get_default_permissions_for_role(r.key::team_member_role),
       r.landing, r.icon, true)
    ON CONFLICT (business_id, key) DO UPDATE
      SET permissions = EXCLUDED.permissions,
          is_system = true,
          updated_at = now();
  END LOOP;
END;
$$;

-- 6) Sembrar negocios existentes
DO $$
DECLARE b record;
BEGIN
  FOR b IN SELECT id FROM public.restaurant_businesses LOOP
    PERFORM public.seed_system_roles_for_business(b.id);
  END LOOP;
END $$;

-- 7) Trigger: cuando se crea un negocio nuevo, sembrar roles
CREATE OR REPLACE FUNCTION public.tg_seed_roles_for_new_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_system_roles_for_business(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_roles_on_business_insert
  ON public.restaurant_businesses;
CREATE TRIGGER trg_seed_roles_on_business_insert
  AFTER INSERT ON public.restaurant_businesses
  FOR EACH ROW EXECUTE FUNCTION public.tg_seed_roles_for_new_business();

-- 8) Backfill: completar permisos faltantes en miembros existentes
UPDATE public.restaurant_team_members rtm
SET permissions = public.get_default_permissions_for_role(rtm.role) || COALESCE(rtm.permissions, '{}'::jsonb)
WHERE rtm.status <> 'removed';
