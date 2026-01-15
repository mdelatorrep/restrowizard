import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
  /** 
   * If true, user must have completed onboarding to access this route.
   * If false, user must NOT have completed onboarding (for onboarding pages).
   */
  requireOnboarding: boolean;
  userType: 'restaurant_owner' | 'consultant';
}

/**
 * Single source of truth for onboarding-related redirects.
 * This component handles all decisions about where to send users based on their onboarding status.
 */
const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ 
  children, 
  requireOnboarding,
  userType: requiredUserType 
}) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { userType, hasCompletedOnboarding, loading: typeLoading, isReady } = useUserType();

  // Show loading while auth or userType is being determined
  if (authLoading || typeLoading || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-lato-light">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> go to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // No user type selected -> go to type selection onboarding
  if (!userType) {
    return <Navigate to="/onboarding" replace />;
  }

  // Wrong user type for this route -> redirect to correct dashboard
  if (userType !== requiredUserType) {
    const correctPath = userType === 'restaurant_owner' ? '/r/dashboard' : '/c/dashboard';
    return <Navigate to={correctPath} replace />;
  }

  // Route requires onboarding to be complete
  if (requireOnboarding) {
    if (!hasCompletedOnboarding) {
      // User hasn't completed onboarding -> send to onboarding page
      const onboardingPath = requiredUserType === 'restaurant_owner' ? '/r/onboarding' : '/c/onboarding';
      return <Navigate to={onboardingPath} replace />;
    }
    // User has completed onboarding -> allow access
    return <>{children}</>;
  }

  // Route is FOR onboarding (requireOnboarding = false)
  if (hasCompletedOnboarding) {
    // User already completed onboarding -> send to dashboard
    const dashboardPath = requiredUserType === 'restaurant_owner' ? '/r/dashboard' : '/c/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  // User needs to complete onboarding and is on onboarding page -> allow access
  return <>{children}</>;
};

export default OnboardingGuard;
