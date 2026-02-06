

# Plan: Sistema Multi-Usuario con Roles y Permisos por Restaurante

## Resumen

Implementar la capacidad para que un restaurante tenga múltiples usuarios (empleados del equipo) con diferentes roles y accesos específicos a módulos. Esto permitirá que el dueño invite a gerentes, cajeros, personal de cocina, etc., cada uno con permisos personalizados.

---

## 1. Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    RESTAURANT_BUSINESSES                           │
│  id | owner_id | name | ...                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESTAURANT_TEAM_MEMBERS                         │
│  id | business_id | user_id | staff_member_id | role | status      │
│     | permissions (JSONB) | invitation_token | invited_email       │
│     | invitation_sent_at | claimed_at                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
  STAFF_MEMBERS                              AUTH.USERS
  (datos laborales)                    (cuenta de acceso)
```

---

## 2. Roles del Sistema

| Rol | Descripcion | Permisos por Defecto |
|-----|-------------|---------------------|
| **owner** | Propietario del restaurante | Acceso total, gestionar equipo |
| **admin** | Administrador/Gerente General | Todo excepto eliminar negocio |
| **manager** | Gerente de turno | Ventas, inventario, turnos, reportes |
| **cashier** | Cajero | Solo POS, ordenes, cocina |
| **kitchen** | Personal de cocina | Ordenes, recetas, inventario (lectura) |
| **staff** | Empleado general | Ver turnos, ver dashboard basico |

---

## 3. Permisos por Modulo

Se definira un sistema de permisos granular con las siguientes claves:

```text
MODULOS DISPONIBLES:
- dashboard         (Panel principal)
- finances          (Finanzas)
- inventory         (Inventario)
- recipes           (Recetas)
- menus             (Menus digitales)
- pos               (Punto de venta)
- orders            (Pedidos/Cocina)
- delivery          (Domicilios)
- reservations      (Reservaciones)
- talent            (Talento/Turnos)
- feedback          (Feedback/Reputacion)
- loyalty           (Fidelizacion)
- website           (Sitio web)
- brand             (Marca)
- settings          (Configuracion)
- team              (Gestion de equipo) - NUEVO

NIVELES DE ACCESO:
- "none"   : Sin acceso
- "read"   : Solo lectura
- "write"  : Lectura y escritura
- "admin"  : Control total del modulo
```

---

## 4. Cambios en Base de Datos

### 4.1 Nueva Tabla: `restaurant_team_members`

```sql
CREATE TYPE team_member_role AS ENUM (
  'owner', 'admin', 'manager', 'cashier', 'kitchen', 'staff'
);

CREATE TYPE team_member_status AS ENUM (
  'invited', 'active', 'suspended', 'removed'
);

CREATE TABLE restaurant_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES restaurant_businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  role team_member_role NOT NULL DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '{}',
  status team_member_status NOT NULL DEFAULT 'invited',
  invited_email TEXT,
  invitation_token UUID DEFAULT gen_random_uuid(),
  invitation_sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id),
  UNIQUE(business_id, invited_email)
);
```

### 4.2 Funcion de Verificacion de Acceso

```sql
CREATE OR REPLACE FUNCTION has_module_access(
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
  SELECT EXISTS (
    SELECT 1 FROM restaurant_team_members rtm
    JOIN restaurant_businesses rb ON rb.id = rtm.business_id
    WHERE rtm.business_id = _business_id
      AND (rtm.user_id = _user_id OR rb.owner_id = _user_id)
      AND rtm.status = 'active'
      AND (
        rtm.role = 'owner' 
        OR rtm.role = 'admin'
        OR (rtm.permissions->>_module)::TEXT IN (_level, 'write', 'admin')
      )
  )
  OR EXISTS (
    SELECT 1 FROM restaurant_businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
$$;
```

### 4.3 Funcion para Reclamar Invitacion

```sql
CREATE OR REPLACE FUNCTION claim_team_invitation(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member restaurant_team_members%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  SELECT * INTO v_member
  FROM restaurant_team_members
  WHERE invitation_token = p_token
    AND user_id IS NULL
    AND status = 'invited';

  IF v_member.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitacion invalida o ya reclamada');
  END IF;

  UPDATE restaurant_team_members
  SET user_id = v_user_id,
      claimed_at = NOW(),
      status = 'active'
  WHERE id = v_member.id;

  RETURN json_build_object(
    'success', true,
    'business_id', v_member.business_id,
    'role', v_member.role
  );
END;
$$;
```

### 4.4 Politicas RLS

```sql
-- Propietarios ven todos los miembros de su negocio
CREATE POLICY "Owners can manage team"
  ON restaurant_team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- Miembros activos pueden verse a si mismos
CREATE POLICY "Members can view own record"
  ON restaurant_team_members FOR SELECT
  USING (user_id = auth.uid());

-- Admins pueden gestionar (excepto owner)
CREATE POLICY "Admins can manage non-owners"
  ON restaurant_team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_team_members rtm
      WHERE rtm.business_id = restaurant_team_members.business_id
        AND rtm.user_id = auth.uid()
        AND rtm.role IN ('admin', 'manager')
        AND rtm.status = 'active'
    )
    AND role != 'owner'
  );
```

---

## 5. Cambios en Frontend

### 5.1 Nuevo Hook: `useTeamMembers`

Funcionalidades:
- Listar miembros del equipo
- Invitar nuevo miembro (por email)
- Actualizar rol/permisos
- Suspender/Reactivar miembro
- Eliminar miembro
- Generar link de invitacion

### 5.2 Nuevo Hook: `useTeamPermissions`

Funcionalidades:
- Verificar acceso a modulo
- Obtener rol del usuario actual
- Obtener permisos del usuario actual
- Funcion helper `canAccess(module, level)`

### 5.3 Nueva Pagina: `/r/settings` - Tab "Equipo"

Agregar nueva pestana en Configuracion:
- Lista de miembros del equipo
- Dialogo para invitar nuevo miembro
- Editor de permisos por modulo
- Acciones: editar rol, suspender, eliminar

### 5.4 Componente: `TeamMemberInviteDialog`

- Formulario: email, nombre, rol
- Permisos predefinidos segun rol
- Opcion de personalizar permisos
- Generar y copiar link de invitacion

### 5.5 Componente: `TeamPermissionsEditor`

- Grid de modulos con toggles
- Selector de nivel (ninguno/lectura/escritura/admin)
- Presets por rol

### 5.6 Guard de Permisos: `RequireModuleAccess`

```tsx
<RequireModuleAccess module="inventory" level="write">
  <InventoryPage />
</RequireModuleAccess>
```

### 5.7 Modificar `AppSidebar`

- Filtrar modulos segun permisos del usuario
- Mostrar icono de candado en modulos sin acceso
- Mostrar badge con rol del usuario

### 5.8 Modificar `useDataUserId`

- Agregar soporte para usuarios de equipo
- Retornar `businessId` ademas de `userId`
- Identificar si es owner o team member

---

## 6. Flujo de Invitacion

```text
1. Owner abre Settings > Equipo
2. Click "Invitar Miembro"
3. Ingresa email y selecciona rol
4. Sistema genera token de invitacion
5. Owner copia link o envia por email
6. Invitado abre link
7. Si no tiene cuenta: se registra
8. Si tiene cuenta: inicia sesion
9. Sistema detecta token en URL
10. Ejecuta claim_team_invitation()
11. Redirige al dashboard del restaurante
```

---

## 7. Archivos a Crear/Modificar

### Nuevos Archivos:
- `src/hooks/useTeamMembers.ts`
- `src/hooks/useTeamPermissions.ts`
- `src/components/team/TeamManagementTab.tsx`
- `src/components/team/TeamMemberInviteDialog.tsx`
- `src/components/team/TeamPermissionsEditor.tsx`
- `src/components/guards/RequireModuleAccess.tsx`
- `supabase/migrations/[timestamp]_add_team_members.sql`

### Archivos a Modificar:
- `src/pages/restaurant/Settings.tsx` - Agregar tab Equipo
- `src/components/navigation/AppSidebar.tsx` - Filtrar por permisos
- `src/hooks/useDataUserId.ts` - Soporte para team members
- `src/components/auth/AuthProvider.tsx` - Detectar invitacion
- `src/pages/Auth.tsx` - Procesar token de invitacion

---

## 8. Consideraciones de Seguridad

1. **RLS Estricto**: Todas las tablas de datos del restaurante deben verificar permisos
2. **Security Definer**: Las funciones de verificacion evitan recursion
3. **Token de Invitacion**: UUID unico, solo funciona una vez
4. **Roles Inmutables**: Solo el owner puede cambiar roles de admin
5. **Audit Trail**: Registrar cambios de permisos (opcional futuro)

---

## 9. Secuencia de Implementacion

1. Crear migracion de base de datos
2. Implementar `useTeamMembers` hook
3. Implementar `useTeamPermissions` hook
4. Crear componentes de UI para gestion de equipo
5. Integrar en Settings
6. Modificar sidebar para filtrar por permisos
7. Actualizar flujo de autenticacion para invitaciones
8. Agregar guards de permisos en paginas
9. Testing end-to-end

