import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { AppHeader } from '@/components/navigation/AppHeader';
import { WorkingAsBar } from '@/components/consultant/WorkingAsBar';
import { useUserType } from '@/hooks/useUserType';
import CopilotChat from '@/components/CopilotChat';
import { BrandThemeProvider } from '@/components/brand/BrandThemeProvider';

interface AppLayoutProps {
  requiredUserType?: 'restaurant_owner' | 'consultant';
}

/**
 * App layout component - renders sidebar, header, and content.
 * Authentication and onboarding checks are handled by OnboardingGuard.
 */
const AppLayout: React.FC<AppLayoutProps> = ({ requiredUserType }) => {
  const { userType } = useUserType();
  
  // Use the actual userType for rendering, fallback to required for initial render
  const effectiveUserType = userType || requiredUserType || 'restaurant_owner';

  return (
    <BrandThemeProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar userType={effectiveUserType} />
          <main className="flex-1 flex flex-col min-h-screen">
            <AppHeader />
            {effectiveUserType === 'consultant' && <WorkingAsBar />}
             <div className="flex-1 p-4 md:p-6 overflow-auto">
              <Outlet />
            </div>
          </main>
          <CopilotChat />
        </div>
      </SidebarProvider>
    </BrandThemeProvider>
  );
};

export default AppLayout;
