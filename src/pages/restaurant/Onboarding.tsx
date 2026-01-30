import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { BusinessTypeSelector } from '@/components/onboarding/BusinessTypeSelector';
import { NewBusinessOnboarding } from '@/components/onboarding/NewBusinessOnboarding';
import { ExistingBusinessOnboarding } from '@/components/onboarding/ExistingBusinessOnboarding';
import { supabase } from '@/integrations/supabase/client';

type OnboardingFlow = 'select' | 'new' | 'existing' | 'resume';

const RestaurantOnboarding: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: typeLoading } = useUserType();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);

  // Check if user has an existing opening project to resume
  const { data: existingProject, isLoading: loadingProject } = useQuery({
    queryKey: ['existing-opening-project', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_opening_projects')
        .select('id, project_name, progress_percentage')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Determine initial flow based on URL + existing data
  useEffect(() => {
    if (loadingProject || !user) return;

    // If a projectId is in the URL, always resume that project (prevents "losing" progress on refresh)
    if (projectIdFromUrl) {
      setFlow('resume');
      return;
    }
    
    // Check if user explicitly wants to create a new project (via URL param)
    const forceNew = searchParams.get('new') === 'true';
    if (forceNew) {
      setFlow('new');
      return;
    }
    
    // If user has an incomplete project and hasn't selected a flow yet, resume it
    if (existingProject && (existingProject.progress_percentage ?? 0) < 100 && flow === null) {
      console.log('📋 Found existing project to resume:', existingProject.project_name);
      setFlow('resume');
    } else if (flow === null) {
      setFlow('select');
    }
  }, [existingProject, loadingProject, user, flow, projectIdFromUrl, searchParams]);

  // Loading state
  if (authLoading || typeLoading || loadingProject || flow === null) {
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
        onSelect={(type) => {
          if (type === 'new') {
            // Clear any existing projectId from URL and set new=true
            setSearchParams({ new: 'true' });
          }
          setFlow(type === 'new' ? 'new' : 'existing');
        }}
      />
    );
  }

  // New business flow OR resuming an existing project
  if (flow === 'new' || flow === 'resume') {
    return (
      <NewBusinessOnboarding 
        onBack={() => {
          setSearchParams({});
          setFlow('select');
        }} 
        resumeProjectId={flow === 'resume' ? (projectIdFromUrl || existingProject?.id) : undefined}
      />
    );
  }

  // Existing business flow
  return <ExistingBusinessOnboarding onBack={() => setFlow('select')} />;
};

export default RestaurantOnboarding;
