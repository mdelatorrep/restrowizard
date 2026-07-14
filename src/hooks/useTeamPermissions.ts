import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import type { TeamMemberRole, ModulePermissions, ModulePermission } from './useTeamMembers';
import { DEFAULT_PERMISSIONS } from './useTeamMembers';

export interface TeamPermissionContext {
  isOwner: boolean;
  isTeamMember: boolean;
  role: TeamMemberRole | null;
  customRoleLabel: string | null;
  defaultLanding: string | null;
  businessId: string | null;
  permissions: ModulePermissions;
  isLoading: boolean;
  canAccess: (module: keyof ModulePermissions, level?: ModulePermission) => boolean;
  hasRole: (roles: TeamMemberRole[]) => boolean;
}

const permissionLevels: Record<ModulePermission, number> = {
  none: 0, read: 1, write: 2, admin: 3
};

const mergePermissions = (
  base: ModulePermissions,
  override: ModulePermissions
): ModulePermissions => {
  const out: ModulePermissions = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    if (v && v !== 'none') (out as any)[k] = v;
  }
  return out;
};

/**
 * Pure permission resolver — single source of truth shared in spirit with the
 * DB function public.has_module_access(). Precedence per module:
 *   member override (if != 'none')  ->  custom role  ->  base-role default
 * Custom role sits on top of the role defaults so partial custom roles still
 * inherit sensible defaults; explicit 'none' in the custom role denies.
 */
export const resolveEffectivePermissions = (
  roleDefaults: ModulePermissions,
  customRolePermissions: ModulePermissions | null,
  memberPermissions: ModulePermissions
): ModulePermissions => {
  const base = customRolePermissions
    ? { ...roleDefaults, ...customRolePermissions }
    : { ...roleDefaults };
  return mergePermissions(base, memberPermissions);
};

/**
 * Effective permission context for the current user.
 * Owner → full admin on everything.
 * Team member → custom role permissions (if assigned) merged with per-member overrides,
 *                otherwise default permissions of base role merged with per-member overrides.
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
          customRoleLabel: null as string | null,
          defaultLanding: null as string | null,
          businessId: null as string | null,
          permissions: {} as ModulePermissions
        };
      }

      const { data: ownedBusiness } = await supabase
        .from('restaurant_businesses')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ownedBusiness) {
        return {
          isOwner: true,
          isTeamMember: false,
          role: 'owner' as TeamMemberRole,
          customRoleLabel: 'Propietario',
          defaultLanding: '/r/dashboard',
          businessId: ownedBusiness.id,
          permissions: DEFAULT_PERMISSIONS.owner
        };
      }

      const { data: membership } = await supabase
        .from('restaurant_team_members')
        .select('*, custom_role:restaurant_custom_roles(label, permissions, default_landing)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership) {
        const role = membership.role as TeamMemberRole;
        const customRole = (membership as any).custom_role as
          | { label: string; permissions: ModulePermissions; default_landing: string | null }
          | null;

        // per-member overrides (only non-none values override the base)
        const memberPerms = (membership.permissions || {}) as ModulePermissions;
        const effective = resolveEffectivePermissions(
          DEFAULT_PERMISSIONS[role] || {},
          customRole?.permissions ?? null,
          memberPerms
        );

        return {
          isOwner: false,
          isTeamMember: true,
          role,
          customRoleLabel: customRole?.label || null,
          defaultLanding: customRole?.default_landing || null,
          businessId: membership.business_id,
          permissions: effective
        };
      }

      return {
        isOwner: false,
        isTeamMember: false,
        role: null as TeamMemberRole | null,
        customRoleLabel: null as string | null,
        defaultLanding: null as string | null,
        businessId: null as string | null,
        permissions: {} as ModulePermissions
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const canAccess = (
    module: keyof ModulePermissions,
    level: ModulePermission = 'read'
  ): boolean => {
    if (!data) return false;
    if (data.isOwner) return true;
    if (data.role === 'admin') return true;
    const userLevel = data.permissions[module] || 'none';
    return permissionLevels[userLevel] >= permissionLevels[level];
  };

  const hasRole = (roles: TeamMemberRole[]): boolean => {
    if (!data?.role) return false;
    return roles.includes(data.role);
  };

  return {
    isOwner: data?.isOwner ?? false,
    isTeamMember: data?.isTeamMember ?? false,
    role: data?.role ?? null,
    customRoleLabel: data?.customRoleLabel ?? null,
    defaultLanding: data?.defaultLanding ?? null,
    businessId: data?.businessId ?? null,
    permissions: data?.permissions ?? {},
    isLoading,
    canAccess,
    hasRole
  };
};

export const useModuleAccess = (
  module: keyof ModulePermissions,
  level: ModulePermission = 'read'
) => {
  const { canAccess, isLoading } = useTeamPermissions();
  return { hasAccess: canAccess(module, level), isLoading };
};
