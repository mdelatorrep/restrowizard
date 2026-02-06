-- =============================================================================
-- SISTEMA MULTI-USUARIO CON ROLES Y PERMISOS PARA RESTAURANTES
-- =============================================================================

-- 1. Crear tipos ENUM para roles y estados
CREATE TYPE public.team_member_role AS ENUM (
  'owner', 'admin', 'manager', 'cashier', 'kitchen', 'staff'
);

CREATE TYPE public.team_member_status AS ENUM (
  'invited', 'active', 'suspended', 'removed'
);

-- 2. Crear tabla restaurant_team_members
CREATE TABLE public.restaurant_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.restaurant_businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_member_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  role public.team_member_role NOT NULL DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.team_member_status NOT NULL DEFAULT 'invited',
  invited_email TEXT,
  invitation_token UUID DEFAULT gen_random_uuid(),
  invitation_sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_business_user UNIQUE(business_id, user_id),
  CONSTRAINT unique_business_email UNIQUE(business_id, invited_email)
);

-- 3. Crear índices para optimización
CREATE INDEX idx_team_members_business ON public.restaurant_team_members(business_id);
CREATE INDEX idx_team_members_user ON public.restaurant_team_members(user_id);
CREATE INDEX idx_team_members_token ON public.restaurant_team_members(invitation_token) WHERE user_id IS NULL;
CREATE INDEX idx_team_members_status ON public.restaurant_team_members(status);

-- 4. Trigger para actualizar updated_at
CREATE TRIGGER update_restaurant_team_members_updated_at
  BEFORE UPDATE ON public.restaurant_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Función SECURITY DEFINER para verificar si usuario tiene rol específico
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id UUID, _business_id UUID, _role public.team_member_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_team_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND role = _role
      AND status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM restaurant_businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
$$;

-- 6. Función SECURITY DEFINER para verificar acceso a módulo
CREATE OR REPLACE FUNCTION public.has_module_access(
  _user_id UUID, 
  _business_id UUID, 
  _module TEXT, 
  _level TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Verificar si es owner del negocio (acceso total)
  SELECT EXISTS (
    SELECT 1 FROM restaurant_businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM restaurant_team_members rtm
    WHERE rtm.business_id = _business_id
      AND rtm.user_id = _user_id
      AND rtm.status = 'active'
      AND (
        -- Roles con acceso total
        rtm.role IN ('owner', 'admin')
        -- O tiene el permiso específico
        OR (
          CASE _level
            WHEN 'read' THEN (rtm.permissions->>_module) IN ('read', 'write', 'admin')
            WHEN 'write' THEN (rtm.permissions->>_module) IN ('write', 'admin')
            WHEN 'admin' THEN (rtm.permissions->>_module) = 'admin'
            ELSE false
          END
        )
      )
  )
$$;

-- 7. Función SECURITY DEFINER para obtener business_id del usuario
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Primero verificar si es owner de algún negocio
  SELECT id FROM restaurant_businesses WHERE owner_id = _user_id
  UNION ALL
  -- Luego verificar si es miembro de equipo activo
  SELECT business_id FROM restaurant_team_members 
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;

-- 8. Función para reclamar invitación de equipo
CREATE OR REPLACE FUNCTION public.claim_team_invitation(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member restaurant_team_members%ROWTYPE;
  v_user_id UUID;
  v_business_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  -- Buscar invitación pendiente
  SELECT * INTO v_member
  FROM restaurant_team_members
  WHERE invitation_token = p_token
    AND user_id IS NULL
    AND status = 'invited';

  IF v_member.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitación inválida o ya reclamada');
  END IF;

  -- Verificar si el usuario ya es miembro de este negocio
  IF EXISTS (
    SELECT 1 FROM restaurant_team_members 
    WHERE business_id = v_member.business_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Ya eres miembro de este equipo');
  END IF;

  -- Obtener nombre del negocio
  SELECT name INTO v_business_name
  FROM restaurant_businesses
  WHERE id = v_member.business_id;

  -- Reclamar la invitación
  UPDATE restaurant_team_members
  SET user_id = v_user_id,
      claimed_at = NOW(),
      status = 'active',
      updated_at = NOW()
  WHERE id = v_member.id;

  RETURN json_build_object(
    'success', true,
    'business_id', v_member.business_id,
    'business_name', v_business_name,
    'role', v_member.role
  );
END;
$$;

-- 9. Función para obtener permisos por defecto según rol
CREATE OR REPLACE FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_role
    WHEN 'owner' THEN '{
      "dashboard": "admin", "finances": "admin", "inventory": "admin", 
      "recipes": "admin", "menus": "admin", "pos": "admin", "orders": "admin",
      "delivery": "admin", "reservations": "admin", "talent": "admin",
      "feedback": "admin", "loyalty": "admin", "website": "admin",
      "brand": "admin", "settings": "admin", "team": "admin"
    }'::jsonb
    WHEN 'admin' THEN '{
      "dashboard": "admin", "finances": "admin", "inventory": "admin", 
      "recipes": "admin", "menus": "admin", "pos": "admin", "orders": "admin",
      "delivery": "admin", "reservations": "admin", "talent": "admin",
      "feedback": "admin", "loyalty": "admin", "website": "admin",
      "brand": "admin", "settings": "write", "team": "write"
    }'::jsonb
    WHEN 'manager' THEN '{
      "dashboard": "read", "finances": "read", "inventory": "write", 
      "recipes": "read", "menus": "read", "pos": "write", "orders": "write",
      "delivery": "write", "reservations": "write", "talent": "write",
      "feedback": "read", "loyalty": "read", "website": "none",
      "brand": "none", "settings": "none", "team": "read"
    }'::jsonb
    WHEN 'cashier' THEN '{
      "dashboard": "read", "finances": "none", "inventory": "read", 
      "recipes": "none", "menus": "read", "pos": "write", "orders": "write",
      "delivery": "read", "reservations": "read", "talent": "none",
      "feedback": "none", "loyalty": "read", "website": "none",
      "brand": "none", "settings": "none", "team": "none"
    }'::jsonb
    WHEN 'kitchen' THEN '{
      "dashboard": "read", "finances": "none", "inventory": "read", 
      "recipes": "read", "menus": "read", "pos": "none", "orders": "write",
      "delivery": "none", "reservations": "none", "talent": "none",
      "feedback": "none", "loyalty": "none", "website": "none",
      "brand": "none", "settings": "none", "team": "none"
    }'::jsonb
    WHEN 'staff' THEN '{
      "dashboard": "read", "finances": "none", "inventory": "none", 
      "recipes": "none", "menus": "none", "pos": "none", "orders": "none",
      "delivery": "none", "reservations": "none", "talent": "read",
      "feedback": "none", "loyalty": "none", "website": "none",
      "brand": "none", "settings": "none", "team": "none"
    }'::jsonb
    ELSE '{}'::jsonb
  END
$$;

-- 10. Habilitar RLS
ALTER TABLE public.restaurant_team_members ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS

-- Owners del negocio pueden ver y gestionar todos los miembros
CREATE POLICY "Owners can manage all team members"
  ON public.restaurant_team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_businesses
      WHERE id = restaurant_team_members.business_id 
        AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_businesses
      WHERE id = restaurant_team_members.business_id 
        AND owner_id = auth.uid()
    )
  );

-- Miembros activos pueden ver su propio registro
CREATE POLICY "Members can view own record"
  ON public.restaurant_team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins y managers pueden ver miembros de su equipo
CREATE POLICY "Team leads can view team members"
  ON public.restaurant_team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_team_members rtm
      WHERE rtm.business_id = restaurant_team_members.business_id
        AND rtm.user_id = auth.uid()
        AND rtm.role IN ('admin', 'manager')
        AND rtm.status = 'active'
    )
  );

-- Admins pueden gestionar miembros (excepto owners y otros admins)
CREATE POLICY "Admins can manage non-admin members"
  ON public.restaurant_team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_team_members rtm
      WHERE rtm.business_id = restaurant_team_members.business_id
        AND rtm.user_id = auth.uid()
        AND rtm.role = 'admin'
        AND rtm.status = 'active'
    )
    AND restaurant_team_members.role NOT IN ('owner', 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_team_members rtm
      WHERE rtm.business_id = restaurant_team_members.business_id
        AND rtm.user_id = auth.uid()
        AND rtm.role = 'admin'
        AND rtm.status = 'active'
    )
    AND restaurant_team_members.role NOT IN ('owner', 'admin')
  );