import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRestaurantLifecycle } from '@/hooks/useRestaurantLifecycle';
import { PreOpeningCountdown } from '@/components/PreOpeningCountdown';

const RestaurantPreOpening: React.FC = () => {
  const lifecycle = useRestaurantLifecycle();

  if (lifecycle.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not in pre-opening stage
  if (lifecycle.stage !== 'pre_opening') {
    if (lifecycle.stage === 'first_90_days') {
      return <Navigate to="/r/first-90-days" replace />;
    }
    if (lifecycle.stage === 'conception' || lifecycle.stage === 'enablement') {
      return <Navigate to="/r/new-business" replace />;
    }
    return <Navigate to="/r/dashboard" replace />;
  }

  return (
    <PreOpeningCountdown
      businessName={lifecycle.business?.name || 'Tu Restaurante'}
      openingDate={lifecycle.business?.openingDate || ''}
      daysUntilOpening={lifecycle.daysUntilOpening || 0}
      projectId={lifecycle.project?.id}
    />
  );
};

export default RestaurantPreOpening;
