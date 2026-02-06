import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import type { ModulePermissions, ModulePermission } from '@/hooks/useTeamMembers';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireModuleAccessProps {
  module: keyof ModulePermissions;
  level?: ModulePermission;
  children: React.ReactNode;
  fallback?: 'redirect' | 'message' | 'hidden';
  redirectTo?: string;
}

/**
 * Guard component that checks if the current user has access to a specific module.
 * 
 * Usage:
 * ```tsx
 * <RequireModuleAccess module="inventory" level="write">
 *   <InventoryPage />
 * </RequireModuleAccess>
 * ```
 */
export const RequireModuleAccess: React.FC<RequireModuleAccessProps> = ({
  module,
  level = 'read',
  children,
  fallback = 'message',
  redirectTo = '/r/dashboard'
}) => {
  const { canAccess, isLoading, role } = useTeamPermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasAccess = canAccess(module, level);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle no access
  switch (fallback) {
    case 'redirect':
      return <Navigate to={redirectTo} replace />;
    
    case 'hidden':
      return null;
    
    case 'message':
    default:
      return (
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-headline font-bold text-foreground mb-2">
              Acceso restringido
            </h2>
            <p className="text-muted-foreground mb-4">
              {role ? (
                <>
                  Tu rol de <span className="font-medium">{role}</span> no tiene permisos 
                  para acceder a este módulo.
                </>
              ) : (
                'No tienes los permisos necesarios para acceder a este módulo.'
              )}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
              <AlertCircle className="h-4 w-4" />
              <span>Contacta al administrador para solicitar acceso</span>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.history.back()}
            >
              Volver
            </Button>
          </CardContent>
        </Card>
      );
  }
};

/**
 * Component wrapper to conditionally render content based on module access.
 * Unlike RequireModuleAccess, this doesn't show any fallback - just hides content.
 */
export const IfCanAccess: React.FC<{
  module: keyof ModulePermissions;
  level?: ModulePermission;
  children: React.ReactNode;
}> = ({ module, level = 'read', children }) => {
  const { canAccess, isLoading } = useTeamPermissions();

  if (isLoading || !canAccess(module, level)) {
    return null;
  }

  return <>{children}</>;
};

export default RequireModuleAccess;
