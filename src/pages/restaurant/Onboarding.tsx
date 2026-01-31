import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { BusinessTypeSelector } from '@/components/onboarding/BusinessTypeSelector';
import { ResumeOrNewSelector } from '@/components/onboarding/ResumeOrNewSelector';
import { NewBusinessOnboarding } from '@/components/onboarding/NewBusinessOnboarding';
import { ExistingBusinessOnboarding } from '@/components/onboarding/ExistingBusinessOnboarding';
import { supabase } from '@/integrations/supabase/client';

type OnboardingFlow = 'select' | 'resume-or-new' | 'new' | 'existing' | 'resume';

const RestaurantOnboarding: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: typeLoading } = useUserType();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const forceNew = searchParams.get('new') === 'true';
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);

  // Check if user has an existing opening project
  const { data: existingProject, isLoading: loadingProject } = useQuery({
    queryKey: ['existing-opening-project', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_opening_projects')
        .select('id, project_name, progress_percentage, city, country, target_opening_date, current_phase, updated_at')
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

    // If a projectId is in the URL, always resume that specific project
    if (projectIdFromUrl) {
      setFlow('resume');
      return;
    }
    
    // If URL explicitly has new=true, go straight to new project creation
    if (forceNew) {
      setFlow('new');
      return;
    }

    // If user has an existing project (complete or not), ask what they want to do
    if (existingProject && flow === null) {
      console.log('📋 Found existing project, showing resume-or-new selector:', existingProject.project_name);
      setFlow('resume-or-new');
      return;
    }

    // No existing project - show type selector
    if (flow === null) {
      setFlow('select');
    }
  }, [existingProject, loadingProject, user, flow, projectIdFromUrl, forceNew]);

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

  // Ask user if they want to resume existing project or start new
  if (flow === 'resume-or-new' && existingProject) {
    return (
      <ResumeOrNewSelector
        existingProject={existingProject}
        onResume={() => {
          setSearchParams({ projectId: existingProject.id });
          setFlow('resume');
        }}
        onStartNew={() => {
          setSearchParams({ new: 'true' });
          setFlow('new');
        }}
        onBack={() => {
          setFlow('select');
        }}
      />
    );
  }

  // Flow selection (new vs existing business)
  if (flow === 'select') {
    return (
      <BusinessTypeSelector
        onSelect={(type) => {
          if (type === 'new') {
            setSearchParams({ new: 'true' });
            setFlow('new');
          } else {
            setFlow('existing');
          }
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
          setFlow(existingProject ? 'resume-or-new' : 'select');
        }} 
        resumeProjectId={flow === 'resume' ? (projectIdFromUrl || existingProject?.id) : undefined}
      />
    );
  }

  // Existing business flow
  return <ExistingBusinessOnboarding onBack={() => setFlow('select')} />;
};

export default RestaurantOnboarding;
