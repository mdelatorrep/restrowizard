import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTeamPermissions } from './useTeamPermissions';
import type { ModulePermissions, TeamMemberRole, ModulePermission } from './useTeamMembers';
import { DEFAULT_PERMISSIONS } from './useTeamMembers';

export interface CustomRole {
  id: string;
  business_id: string;
  key: string;
  label: string;
  description: string | null;
  base_role: TeamMemberRole;
  permissions: ModulePermissions;
  default_landing: string | null;
  color: string | null;
  icon: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleData {
  key: string;
  label: string;
  description?: string;
  base_role: TeamMemberRole;
  permissions: ModulePermissions;
  default_landing?: string;
  color?: string;
  icon?: string;
}

export const useCustomRoles = () => {
  const { businessId } = useTeamPermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['custom-roles', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('restaurant_custom_roles' as any)
        .select('*')
        .eq('business_id', businessId)
        .order('is_system', { ascending: false })
        .order('label', { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        permissions: (r.permissions || {}) as ModulePermissions
      })) as CustomRole[];
    },
    enabled: !!businessId
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRoleData) => {
      if (!businessId) throw new Error('No business');
      const { data: row, error } = await supabase
        .from('restaurant_custom_roles' as any)
        .insert({
          business_id: businessId,
          key: data.key,
          label: data.label,
          description: data.description || null,
          base_role: data.base_role,
          permissions: data.permissions as any,
          default_landing: data.default_landing || null,
          color: data.color || '#3E1064',
          icon: data.icon || 'Shield',
          is_system: false
        } as any)
        .select()
        .single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles', businessId] });
      toast({ title: 'Rol creado', description: 'El nuevo rol ya está disponible' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateRoleData> }) => {
      const { error } = await supabase
        .from('restaurant_custom_roles' as any)
        .update({
          ...('label' in data ? { label: data.label } : {}),
          ...('description' in data ? { description: data.description } : {}),
          ...('permissions' in data ? { permissions: data.permissions as any } : {}),
          ...('default_landing' in data ? { default_landing: data.default_landing } : {}),
          ...('color' in data ? { color: data.color } : {}),
          ...('icon' in data ? { icon: data.icon } : {}),
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles', businessId] });
      queryClient.invalidateQueries({ queryKey: ['team-permissions'] });
      toast({ title: 'Rol actualizado' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_custom_roles' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles', businessId] });
      toast({ title: 'Rol eliminado' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  return {
    roles: roles || [],
    isLoading,
    createRole: createMutation.mutateAsync,
    updateRole: (id: string, data: Partial<CreateRoleData>) => updateMutation.mutateAsync({ id, data }),
    deleteRole: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    /** Helper: permissions baseline from a base role */
    defaultsFor: (role: TeamMemberRole): ModulePermissions => DEFAULT_PERMISSIONS[role]
  };
};

/** Helper standalone: pick the strongest level between two permission strings */
export const mergePermission = (
  a: ModulePermission | undefined,
  b: ModulePermission | undefined
): ModulePermission => {
  const order: ModulePermission[] = ['none', 'read', 'write', 'admin'];
  const ai = order.indexOf(a || 'none');
  const bi = order.indexOf(b || 'none');
  return order[Math.max(ai, bi)];
};
