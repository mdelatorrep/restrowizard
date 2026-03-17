import React, { useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { Loader2 } from 'lucide-react';
import { pushDebugEvent } from '@/lib/debugEvents';

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
  const { userType, hasCompletedOnboarding, loading: typeLoading, isReady, isFetching } = useUserType();

  const lastDecisionKeyRef = useRef<string | null>(null);

  const report = (decision: string, extra?: Record<string, unknown>) => {
    if (!user?.id) return;

    const key = JSON.stringify({
      path: location.pathname,
      decision,
      requireOnboarding,
      requiredUserType,
      userType,
      hasCompletedOnboarding,
    });

    if (lastDecisionKeyRef.current === key) return;
    lastDecisionKeyRef.current = key;

    void pushDebugEvent(user.id, 'OnboardingGuard', decision, {
      path: location.pathname,
      requireOnboarding,
      requiredUserType,
      userType,
      hasCompletedOnboarding,
      ...extra,
    });
  };

  // ===== TRACEABILITY LOGGING =====
  console.log('🛡️ [OnboardingGuard] Render:', {
    path: location.pathname,
    requireOnboarding,
    requiredUserType,
    authLoading,
    typeLoading,
    isReady,
    userId: user?.id,
    userType,
    hasCompletedOnboarding,
  });

  // Show loading while auth or userType is being determined
  if (authLoading || typeLoading || !isReady) {
    console.log('🛡️ [OnboardingGuard] DECISION: Show loading spinner', { authLoading, typeLoading, isReady });
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
    console.log('🛡️ [OnboardingGuard] DECISION: Redirect to /auth (no user)');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // No user type selected -> go to type selection onboarding
  if (!userType) {
    console.log('🛡️ [OnboardingGuard] DECISION: Redirect to /onboarding (no userType)');
    return <Navigate to="/onboarding" replace />;
  }

  // Wrong user type for this route -> redirect to correct dashboard
  if (userType !== requiredUserType) {
    const correctPath = userType === 'restaurant_owner' ? '/r/dashboard' : '/c/dashboard';
    console.log('🛡️ [OnboardingGuard] DECISION: Redirect to', correctPath, '(wrong userType)');
    return <Navigate to={correctPath} replace />;
  }

  // Route requires onboarding to be complete
  if (requireOnboarding) {
    if (!hasCompletedOnboarding) {
      // If data is being refetched in background, show loading instead of redirecting
      // This prevents race conditions where optimistic cache was overwritten by a stale refetch
      if (isFetching) {
        console.log('🛡️ [OnboardingGuard] DECISION: Show loading (isFetching, avoid premature redirect)');
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground font-lato-light">Cargando...</p>
            </div>
          </div>
        );
      }
      // User hasn't completed onboarding -> send to onboarding page
      const onboardingPath = requiredUserType === 'restaurant_owner' ? '/r/onboarding' : '/c/onboarding';
      console.log('🛡️ [OnboardingGuard] DECISION: Redirect to', onboardingPath, '(onboarding not complete)');
      report('redirect_onboarding_incomplete', { to: onboardingPath });
      return <Navigate to={onboardingPath} replace />;
    }
    // User has completed onboarding -> allow access
    console.log('🛡️ [OnboardingGuard] DECISION: Allow access (onboarding complete)');
    report('allow_onboarding_complete');
    return <>{children}</>;
  }

  // Route is FOR onboarding (requireOnboarding = false)
  if (hasCompletedOnboarding) {
    // User already completed onboarding -> send to dashboard
    const dashboardPath = requiredUserType === 'restaurant_owner' ? '/r/dashboard' : '/c/dashboard';
    console.log('🛡️ [OnboardingGuard] DECISION: Redirect to', dashboardPath, '(already onboarded, skip onboarding page)');
    report('redirect_already_onboarded', { to: dashboardPath });
    return <Navigate to={dashboardPath} replace />;
  }

  // User needs to complete onboarding and is on onboarding page -> allow access
  console.log('🛡️ [OnboardingGuard] DECISION: Allow access to onboarding page');
  report('allow_onboarding_page');
  return <>{children}</>;
};

export default OnboardingGuard;
