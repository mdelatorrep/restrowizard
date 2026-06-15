import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from '@/hooks/useDataUserId';
import type { Database } from '@/integrations/supabase/types';

export type TeamMemberRole = Database['public']['Enums']['team_member_role'];
export type TeamMemberStatus = Database['public']['Enums']['team_member_status'];

export type ModulePermission = 'none' | 'read' | 'write' | 'admin';

/**
 * Canonical module keys — MUST cover 100% of routes in /r/*.
 * Keep in sync with src/config/routePermissions.ts and DB function
 * public.has_module_access().
 */
export interface ModulePermissions {
  // Operativos
  dashboard?: ModulePermission;
  pos?: ModulePermission;
  pos_reports?: ModulePermission;
  pos_audit?: ModulePermission;
  kitchen_display?: ModulePermission;
  orders?: ModulePermission;
  delivery?: ModulePermission;
  rappi?: ModulePermission;
  reservations?: ModulePermission;
  // Negocio
  brand?: ModulePermission;
  recipes?: ModulePermission;
  menus?: ModulePermission;
  inventory?: ModulePermission;
  suppliers?: ModulePermission;
  // Personas
  talent?: ModulePermission;
  my_development?: ModulePermission;
  loyalty?: ModulePermission;
  feedback?: ModulePermission;
  support?: ModulePermission;
  // Finanzas
  finances?: ModulePermission;
  invoices?: ModulePermission;
  electronic_invoicing?: ModulePermission;
  sustainability?: ModulePermission;
  // Crecimiento
  new_business?: ModulePermission;
  pre_opening?: ModulePermission;
  first_90_days?: ModulePermission;
  ghost_kitchen?: ModulePermission;
  chain_management?: ModulePermission;
  // Sistema
  website?: ModulePermission;
  knowledge?: ModulePermission;
  settings?: ModulePermission;
  team?: ModulePermission;
  ecosystem_admin?: ModulePermission;
}

export type ModuleKey = keyof ModulePermissions;

export interface TeamMember {
  id: string;
  business_id: string;
  user_id: string | null;
  staff_member_id: string | null;
  role: TeamMemberRole;
  custom_role_id: string | null;
  permissions: ModulePermissions;
  status: TeamMemberStatus;
  invited_email: string | null;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  staff_member?: {
    id: string;
    name: string;
    email: string | null;
    position: string | null;
  } | null;
}

export interface InviteTeamMemberData {
  email: string;
  role: TeamMemberRole;
  custom_role_id?: string | null;
  permissions?: ModulePermissions;
  staff_member_id?: string;
}

export interface UpdateTeamMemberData {
  role?: TeamMemberRole;
  custom_role_id?: string | null;
  permissions?: ModulePermissions;
  status?: TeamMemberStatus;
}

const NONE_MAP = (keys: ModuleKey[]): ModulePermissions =>
  keys.reduce((acc, k) => ({ ...acc, [k]: 'none' as ModulePermission }), {});

const ALL_MODULES: ModuleKey[] = [
  'dashboard','pos','pos_reports','pos_audit','kitchen_display','orders','delivery','rappi','reservations',
  'brand','recipes','menus','inventory','suppliers',
  'talent','my_development','loyalty','feedback','support',
  'finances','invoices','electronic_invoicing','sustainability',
  'new_business','pre_opening','first_90_days','ghost_kitchen','chain_management',
  'website','knowledge','settings','team','ecosystem_admin'
];

const allAdmin: ModulePermissions = ALL_MODULES.reduce(
  (acc, k) => ({ ...acc, [k]: 'admin' as ModulePermission }), {}
);

// Default permissions per role (kept in sync with DB get_default_permissions_for_role)
export const DEFAULT_PERMISSIONS: Record<TeamMemberRole, ModulePermissions> = {
  owner: allAdmin,
  admin: {
    ...allAdmin,
    settings: 'write',
    team: 'write',
    ecosystem_admin: 'none'
  },
  manager: {
    ...NONE_MAP(ALL_MODULES),
    dashboard: 'read',
    pos: 'write', pos_reports: 'read', kitchen_display: 'write',
    orders: 'write', delivery: 'write', rappi: 'write', reservations: 'write',
    recipes: 'read', menus: 'read', inventory: 'write', suppliers: 'read',
    talent: 'write', my_development: 'read', loyalty: 'read', feedback: 'read', support: 'write',
    finances: 'read', invoices: 'read',
    first_90_days: 'read',
    knowledge: 'read', team: 'read'
  },
  cashier: {
    ...NONE_MAP(ALL_MODULES),
    pos: 'write',
    orders: 'write',
    delivery: 'read',
    reservations: 'read',
    menus: 'read',
    my_development: 'read',
    loyalty: 'read'
  },
  kitchen: {
    ...NONE_MAP(ALL_MODULES),
    kitchen_display: 'write',
    orders: 'write',
    recipes: 'read',
    menus: 'read',
    inventory: 'read',
    my_development: 'read',
    knowledge: 'read'
  },
  staff: {
    ...NONE_MAP(ALL_MODULES),
    my_development: 'write',
    knowledge: 'read'
  }
};

export const ROLE_LABELS: Record<TeamMemberRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero',
  kitchen: 'Cocina',
  staff: 'Empleado'
};

export const STATUS_LABELS: Record<TeamMemberStatus, string> = {
  invited: 'Invitado',
  active: 'Activo',
  suspended: 'Suspendido',
  removed: 'Eliminado'
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  pos: 'Punto de Venta',
  pos_reports: 'Reportes y Metas',
  pos_audit: 'Auditoría POS',
  kitchen_display: 'Pantalla de Cocina',
  orders: 'Pedidos',
  delivery: 'Domicilios',
  rappi: 'Rappi',
  reservations: 'Reservaciones',
  brand: 'Marca e Identidad',
  recipes: 'Recetas y Costos',
  menus: 'Menús Digitales',
  inventory: 'Inventario',
  suppliers: 'Proveedores',
  talent: 'Talento y Turnos',
  my_development: 'Mi Desarrollo',
  loyalty: 'Fidelización',
  feedback: 'Feedback y Reputación',
  support: 'Soporte PQRS',
  finances: 'Finanzas IA',
  invoices: 'Facturas con IA',
  electronic_invoicing: 'Facturación Electrónica',
  sustainability: 'Sostenibilidad',
  new_business: 'Nuevo Negocio',
  pre_opening: 'Pre-Apertura',
  first_90_days: 'Primeros 90 Días',
  ghost_kitchen: 'Ghost Kitchen',
  chain_management: 'Gestión de Cadenas',
  website: 'Sitio Web y URLs',
  knowledge: 'Base de Conocimiento',
  settings: 'Configuración',
  team: 'Equipo y Roles',
  ecosystem_admin: 'Admin Ecosistema'
};

export const MODULE_GROUPS: { label: string; modules: ModuleKey[] }[] = [
  { label: 'Operación', modules: ['dashboard', 'pos', 'pos_reports', 'pos_audit', 'kitchen_display', 'orders', 'delivery', 'rappi', 'reservations'] },
  { label: 'Mi Restaurante', modules: ['brand', 'recipes', 'menus', 'inventory', 'suppliers'] },
  { label: 'Personas y Clientes', modules: ['talent', 'my_development', 'loyalty', 'feedback', 'support'] },
  { label: 'Finanzas y Análisis', modules: ['finances', 'invoices', 'electronic_invoicing', 'sustainability'] },
  { label: 'Crecimiento', modules: ['new_business', 'pre_opening', 'first_90_days', 'ghost_kitchen', 'chain_management'] },
  { label: 'Sistema', modules: ['website', 'knowledge', 'settings', 'team', 'ecosystem_admin'] }
];

export const useTeamMembers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useDataUserId();
  const [invitationLink, setInvitationLink] = useState<string | null>(null);

  const { data: businessId, isLoading: businessLoading } = useQuery({
    queryKey: ['user-business-id', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: ownedBusiness } = await supabase
        .from('restaurant_businesses')
        .select('id')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ownedBusiness) return ownedBusiness.id;

      const { data: teamMembership } = await supabase
        .from('restaurant_team_members')
        .select('business_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      return teamMembership?.business_id || null;
    },
    enabled: !!userId
  });

  const {
    data: teamMembers,
    isLoading: membersLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['team-members', businessId],
    queryFn: async () => {
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('restaurant_team_members')
        .select(`
          *,
          staff_member:staff_members(id, name, email, position)
        `)
        .eq('business_id', businessId)
        .neq('status', 'removed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(member => ({
        ...member,
        permissions: (member.permissions || {}) as ModulePermissions
      })) as TeamMember[];
    },
    enabled: !!businessId
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteTeamMemberData) => {
      if (!businessId) throw new Error('No business found');

      const permissions = data.permissions || DEFAULT_PERMISSIONS[data.role];

      const insertData = {
        business_id: businessId,
        invited_email: data.email.toLowerCase(),
        role: data.role,
        custom_role_id: data.custom_role_id || null,
        permissions: permissions as unknown as Record<string, unknown>,
        staff_member_id: data.staff_member_id || null,
        status: 'invited' as const,
        invitation_sent_at: new Date().toISOString()
      };

      const { data: newMember, error } = await supabase
        .from('restaurant_team_members')
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('Este email ya ha sido invitado');
        throw error;
      }
      return newMember;
    },
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/auth?team_invite=${newMember.invitation_token}`;
      setInvitationLink(link);
      toast({ title: 'Invitación creada', description: 'Se ha generado el link de invitación' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al invitar', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: UpdateTeamMemberData }) => {
      const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.role) updatePayload.role = data.role;
      if (data.custom_role_id !== undefined) updatePayload.custom_role_id = data.custom_role_id;
      if (data.status) updatePayload.status = data.status;
      if (data.permissions) updatePayload.permissions = data.permissions as unknown as Record<string, unknown>;

      const { error } = await supabase
        .from('restaurant_team_members')
        .update(updatePayload)
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      queryClient.invalidateQueries({ queryKey: ['team-permissions'] });
      toast({ title: 'Miembro actualizado', description: 'Los cambios han sido guardados' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('restaurant_team_members')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      toast({ title: 'Miembro suspendido', description: 'El acceso ha sido suspendido' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
  });

  const reactivateMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('restaurant_team_members')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      toast({ title: 'Miembro reactivado', description: 'El acceso ha sido restaurado' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('restaurant_team_members')
        .update({ status: 'removed', updated_at: new Date().toISOString() })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      toast({ title: 'Miembro eliminado', description: 'El miembro ha sido removido del equipo' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
  });

  const regenerateInvitation = useMutation({
    mutationFn: async (memberId: string) => {
      const newToken = crypto.randomUUID();
      const { data, error } = await supabase
        .from('restaurant_team_members')
        .update({
          invitation_token: newToken,
          invitation_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      const link = `${window.location.origin}/auth?team_invite=${data.invitation_token}`;
      setInvitationLink(link);
      toast({ title: 'Link regenerado', description: 'Se ha generado un nuevo link de invitación' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
  });

  const getInvitationLink = (token: string | null) => {
    if (!token) return null;
    return `${window.location.origin}/auth?team_invite=${token}`;
  };

  return {
    teamMembers: teamMembers || [],
    isLoading: businessLoading || membersLoading,
    error,
    businessId,
    invitationLink,
    clearInvitationLink: () => setInvitationLink(null),
    inviteTeamMember: inviteMutation.mutateAsync,
    updateTeamMember: (memberId: string, data: UpdateTeamMemberData) =>
      updateMutation.mutateAsync({ memberId, data }),
    suspendTeamMember: suspendMutation.mutateAsync,
    reactivateTeamMember: reactivateMutation.mutateAsync,
    removeTeamMember: removeMutation.mutateAsync,
    regenerateInvitation: regenerateInvitation.mutateAsync,
    getInvitationLink,
    refetch,
    isInviting: inviteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSuspending: suspendMutation.isPending,
    isReactivating: reactivateMutation.isPending,
    isRemoving: removeMutation.isPending,
    isRegenerating: regenerateInvitation.isPending
  };
};
