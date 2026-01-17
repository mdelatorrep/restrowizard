import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { BusinessTypeSelector } from '@/components/onboarding/BusinessTypeSelector';
import { NewBusinessOnboarding } from '@/components/onboarding/NewBusinessOnboarding';
import { ExistingBusinessOnboarding } from '@/components/onboarding/ExistingBusinessOnboarding';

type OnboardingFlow = 'select' | 'new' | 'existing';

const RestaurantOnboarding: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: typeLoading } = useUserType();
  const [flow, setFlow] = useState<OnboardingFlow>('select');

  // Loading state
  if (authLoading || typeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Already completed onboarding
  if (hasCompletedOnboarding) {
    return <Navigate to="/r/dashboard" replace />;
  }

  // Flow selection
  if (flow === 'select') {
    return (
      <BusinessTypeSelector
        onSelect={(type) => setFlow(type === 'new' ? 'new' : 'existing')}
      />
    );
  }

  // New business flow
  if (flow === 'new') {
    return <NewBusinessOnboarding onBack={() => setFlow('select')} />;
  }

  // Existing business flow
  return <ExistingBusinessOnboarding onBack={() => setFlow('select')} />;
};

export default RestaurantOnboarding;
