import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Shield } from 'lucide-react';

interface RequireSuperAdminProps {
  children: React.ReactNode;
}

const RequireSuperAdmin: React.FC<RequireSuperAdminProps> = ({ children }) => {
  const { isAdmin, isLoading, user } = useSuperAdmin();

  // Not logged in
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireSuperAdmin;
