import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import CopilotChat from '@/components/CopilotChat';

interface AppLayoutProps {
  requiredUserType?: 'restaurant_owner' | 'consultant';
}

const AppLayout: React.FC<AppLayoutProps> = ({ requiredUserType }) => {
  const { user, loading: authLoading } = useAuth();
  const { userType, loading: typeLoading, hasCompletedOnboarding } = useUserType();

  if (authLoading || typeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-lato-light">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user hasn't selected a type yet, redirect to onboarding
  if (!userType) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user hasn't completed onboarding, redirect to type-specific onboarding
  if (!hasCompletedOnboarding) {
    return <Navigate to={userType === 'restaurant_owner' ? '/r/onboarding' : '/c/onboarding'} replace />;
  }

  // If accessing wrong dashboard type, redirect
  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to={userType === 'restaurant_owner' ? '/r/dashboard' : '/c/dashboard'} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userType={userType} />
        <main className="flex-1 flex flex-col min-h-screen">
          <AppHeader />
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
        <CopilotChat />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
