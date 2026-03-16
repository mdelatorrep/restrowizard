import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from '@/hooks/useDataUserId';
import type { Database } from '@/integrations/supabase/types';

export type TeamMemberRole = Database['public']['Enums']['team_member_role'];
export type TeamMemberStatus = Database['public']['Enums']['team_member_status'];

export type ModulePermission = 'none' | 'read' | 'write' | 'admin';

export interface ModulePermissions {
  dashboard?: ModulePermission;
  finances?: ModulePermission;
  inventory?: ModulePermission;
  recipes?: ModulePermission;
  menus?: ModulePermission;
  pos?: ModulePermission;
  orders?: ModulePermission;
  delivery?: ModulePermission;
  reservations?: ModulePermission;
  talent?: ModulePermission;
  feedback?: ModulePermission;
  loyalty?: ModulePermission;
  website?: ModulePermission;
  brand?: ModulePermission;
  settings?: ModulePermission;
  team?: ModulePermission;
}

export interface TeamMember {
  id: string;
  business_id: string;
  user_id: string | null;
  staff_member_id: string | null;
  role: TeamMemberRole;
  permissions: ModulePermissions;
  status: TeamMemberStatus;
  invited_email: string | null;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
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
  permissions?: ModulePermissions;
  staff_member_id?: string;
}

export interface UpdateTeamMemberData {
  role?: TeamMemberRole;
  permissions?: ModulePermissions;
  status?: TeamMemberStatus;
}

// Default permissions per role
export const DEFAULT_PERMISSIONS: Record<TeamMemberRole, ModulePermissions> = {
  owner: {
    dashboard: 'admin', finances: 'admin', inventory: 'admin',
    recipes: 'admin', menus: 'admin', pos: 'admin', orders: 'admin',
    delivery: 'admin', reservations: 'admin', talent: 'admin',
    feedback: 'admin', loyalty: 'admin', website: 'admin',
    brand: 'admin', settings: 'admin', team: 'admin'
  },
  admin: {
    dashboard: 'admin', finances: 'admin', inventory: 'admin',
    recipes: 'admin', menus: 'admin', pos: 'admin', orders: 'admin',
    delivery: 'admin', reservations: 'admin', talent: 'admin',
    feedback: 'admin', loyalty: 'admin', website: 'admin',
    brand: 'admin', settings: 'write', team: 'write'
  },
  manager: {
    dashboard: 'read', finances: 'read', inventory: 'write',
    recipes: 'read', menus: 'read', pos: 'write', orders: 'write',
    delivery: 'write', reservations: 'write', talent: 'write',
    feedback: 'read', loyalty: 'read', website: 'none',
    brand: 'none', settings: 'none', team: 'read'
  },
  cashier: {
    dashboard: 'read', finances: 'none', inventory: 'read',
    recipes: 'none', menus: 'read', pos: 'write', orders: 'write',
    delivery: 'read', reservations: 'read', talent: 'none',
    feedback: 'none', loyalty: 'read', website: 'none',
    brand: 'none', settings: 'none', team: 'none'
  },
  kitchen: {
    dashboard: 'read', finances: 'none', inventory: 'read',
    recipes: 'read', menus: 'read', pos: 'none', orders: 'write',
    delivery: 'none', reservations: 'none', talent: 'none',
    feedback: 'none', loyalty: 'none', website: 'none',
    brand: 'none', settings: 'none', team: 'none'
  },
  staff: {
    dashboard: 'read', finances: 'none', inventory: 'none',
    recipes: 'none', menus: 'none', pos: 'none', orders: 'none',
    delivery: 'none', reservations: 'none', talent: 'read',
    feedback: 'none', loyalty: 'none', website: 'none',
    brand: 'none', settings: 'none', team: 'none'
  }
};

// Role labels in Spanish
export const ROLE_LABELS: Record<TeamMemberRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero',
  kitchen: 'Cocina',
  staff: 'Empleado'
};

// Status labels in Spanish
export const STATUS_LABELS: Record<TeamMemberStatus, string> = {
  invited: 'Invitado',
  active: 'Activo',
  suspended: 'Suspendido',
  removed: 'Eliminado'
};

// Module labels in Spanish
export const MODULE_LABELS: Record<keyof ModulePermissions, string> = {
  dashboard: 'Dashboard',
  finances: 'Finanzas',
  inventory: 'Inventario',
  recipes: 'Recetas',
  menus: 'Menús',
  pos: 'Punto de Venta',
  orders: 'Pedidos/Cocina',
  delivery: 'Domicilios',
  reservations: 'Reservaciones',
  talent: 'Talento/Turnos',
  feedback: 'Feedback',
  loyalty: 'Fidelización',
  website: 'Sitio Web',
  brand: 'Marca',
  settings: 'Configuración',
  team: 'Equipo'
};

export const useTeamMembers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useDataUserId();
  const [invitationLink, setInvitationLink] = useState<string | null>(null);

  // Fetch business ID for the current user
  const { data: businessId, isLoading: businessLoading } = useQuery({
    queryKey: ['user-business-id', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // First check if user is owner
      const { data: ownedBusiness } = await supabase
        .from('restaurant_businesses')
        .select('id')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (ownedBusiness) return ownedBusiness.id;

      // Then check if user is team member
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

  // Fetch team members
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

  // Invite new team member
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteTeamMemberData) => {
      if (!businessId) throw new Error('No business found');

      const permissions = data.permissions || DEFAULT_PERMISSIONS[data.role];

      const insertData = {
        business_id: businessId,
        invited_email: data.email.toLowerCase(),
        role: data.role,
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
        if (error.code === '23505') {
          throw new Error('Este email ya ha sido invitado');
        }
        throw error;
      }

      return newMember;
    },
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', businessId] });
      
      // Generate invitation link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/auth?team_invite=${newMember.invitation_token}`;
      setInvitationLink(link);
      
      toast({
        title: 'Invitación creada',
        description: 'Se ha generado el link de invitación'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al invitar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update team member
  const updateMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: UpdateTeamMemberData }) => {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      if (data.role) updatePayload.role = data.role;
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
      toast({
        title: 'Miembro actualizado',
        description: 'Los cambios han sido guardados'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Suspend team member
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
      toast({
        title: 'Miembro suspendido',
        description: 'El acceso ha sido suspendido'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Reactivate team member
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
      toast({
        title: 'Miembro reactivado',
        description: 'El acceso ha sido restaurado'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Remove team member
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
      toast({
        title: 'Miembro eliminado',
        description: 'El miembro ha sido removido del equipo'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Regenerate invitation link
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
      
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/auth?team_invite=${data.invitation_token}`;
      setInvitationLink(link);
      
      toast({
        title: 'Link regenerado',
        description: 'Se ha generado un nuevo link de invitación'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Get invitation link for a member
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
    
    // Actions
    inviteTeamMember: inviteMutation.mutateAsync,
    updateTeamMember: (memberId: string, data: UpdateTeamMemberData) => 
      updateMutation.mutateAsync({ memberId, data }),
    suspendTeamMember: suspendMutation.mutateAsync,
    reactivateTeamMember: reactivateMutation.mutateAsync,
    removeTeamMember: removeMutation.mutateAsync,
    regenerateInvitation: regenerateInvitation.mutateAsync,
    getInvitationLink,
    refetch,
    
    // Loading states
    isInviting: inviteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSuspending: suspendMutation.isPending,
    isReactivating: reactivateMutation.isPending,
    isRemoving: removeMutation.isPending,
    isRegenerating: regenerateInvitation.isPending
  };
};
