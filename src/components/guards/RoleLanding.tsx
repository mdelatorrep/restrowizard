import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import type { TeamMemberRole } from '@/hooks/useTeamMembers';

/**
 * Default landing per base role. Used when a member's custom role has no
 * default_landing override. Owners/Admins always go to the executive Dashboard.
 */
export const BASE_ROLE_LANDING: Record<TeamMemberRole, string> = {
  owner: '/r/dashboard',
  admin: '/r/dashboard',
  manager: '/r/dashboard',
  cashier: '/r/pos',
  kitchen: '/r/kitchen',
  staff: '/r/my-development',
};

/**
 * Redirects the user to the right landing screen for their role:
 *   1. Custom role default_landing (highest priority)
 *   2. Base role default
 *   3. Fallback /r/dashboard
 */
export const RoleLanding: React.FC = () => {
  const { isLoading, defaultLanding, role } = useTeamPermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const target =
    defaultLanding ||
    (role ? BASE_ROLE_LANDING[role] : null) ||
    '/r/dashboard';

  return <Navigate to={target} replace />;
};

export default RoleLanding;
