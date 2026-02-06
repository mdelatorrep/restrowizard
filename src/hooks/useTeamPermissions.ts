import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import type { TeamMemberRole, ModulePermissions, ModulePermission } from './useTeamMembers';

export interface TeamPermissionContext {
  isOwner: boolean;
  isTeamMember: boolean;
  role: TeamMemberRole | null;
  businessId: string | null;
  permissions: ModulePermissions;
  isLoading: boolean;
  
  // Helper functions
  canAccess: (module: keyof ModulePermissions, level?: ModulePermission) => boolean;
  hasRole: (roles: TeamMemberRole[]) => boolean;
}

/**
 * Hook to get the current user's team permissions.
 * Returns permission context for access control throughout the app.
 */
export const useTeamPermissions = (): TeamPermissionContext => {
  const { user } = useAuthContext();

  const { data, isLoading } = useQuery({
    queryKey: ['team-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          isOwner: false,
          isTeamMember: false,
          role: null as TeamMemberRole | null,
          businessId: null as string | null,
          permissions: {} as ModulePermissions
        };
      }

      // Check if user is owner of any business
      const { data: ownedBusiness } = await supabase
        .from('restaurant_businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedBusiness) {
        // User is owner - full permissions
        return {
          isOwner: true,
          isTeamMember: false,
          role: 'owner' as TeamMemberRole,
          businessId: ownedBusiness.id,
          permissions: {
            dashboard: 'admin',
            finances: 'admin',
            inventory: 'admin',
            recipes: 'admin',
            menus: 'admin',
            pos: 'admin',
            orders: 'admin',
            delivery: 'admin',
            reservations: 'admin',
            talent: 'admin',
            feedback: 'admin',
            loyalty: 'admin',
            website: 'admin',
            brand: 'admin',
            settings: 'admin',
            team: 'admin'
          } as ModulePermissions
        };
      }

      // Check if user is team member
      const { data: teamMembership } = await supabase
        .from('restaurant_team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (teamMembership) {
        return {
          isOwner: false,
          isTeamMember: true,
          role: teamMembership.role as TeamMemberRole,
          businessId: teamMembership.business_id,
          permissions: (teamMembership.permissions || {}) as ModulePermissions
        };
      }

      // User has no team membership
      return {
        isOwner: false,
        isTeamMember: false,
        role: null as TeamMemberRole | null,
        businessId: null as string | null,
        permissions: {} as ModulePermissions
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000
  });

  const permissionLevels: Record<ModulePermission, number> = {
    none: 0,
    read: 1,
    write: 2,
    admin: 3
  };

  /**
   * Check if user can access a module at a given level.
   * @param module - The module to check access for
   * @param level - Minimum required permission level (default: 'read')
   */
  const canAccess = (module: keyof ModulePermissions, level: ModulePermission = 'read'): boolean => {
    if (!data) return false;
    
    // Owners have full access
    if (data.isOwner) return true;
    
    // Admins have full access except for specific restrictions
    if (data.role === 'admin') return true;
    
    const userLevel = data.permissions[module] || 'none';
    return permissionLevels[userLevel] >= permissionLevels[level];
  };

  /**
   * Check if user has one of the specified roles.
   * @param roles - Array of roles to check
   */
  const hasRole = (roles: TeamMemberRole[]): boolean => {
    if (!data?.role) return false;
    return roles.includes(data.role);
  };

  return {
    isOwner: data?.isOwner ?? false,
    isTeamMember: data?.isTeamMember ?? false,
    role: data?.role ?? null,
    businessId: data?.businessId ?? null,
    permissions: data?.permissions ?? {},
    isLoading,
    canAccess,
    hasRole
  };
};

/**
 * Helper hook to check access for a specific module.
 * Useful for quick permission checks in components.
 */
export const useModuleAccess = (module: keyof ModulePermissions, level: ModulePermission = 'read') => {
  const { canAccess, isLoading } = useTeamPermissions();
  
  return {
    hasAccess: canAccess(module, level),
    isLoading
  };
};
