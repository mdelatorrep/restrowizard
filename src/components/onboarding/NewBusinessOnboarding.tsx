import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutomaticProcessingScreen } from '@/components/opening/AutomaticProcessingScreen';
import { OpeningResultsDashboard } from '@/components/opening/OpeningResultsDashboard';
import { useBusinessOpening, PHASES, PhaseId } from '@/hooks/useBusinessOpening';
import { useBusinessProject, useProjectAnalyses, useProjectChecklist, BusinessProject } from '@/hooks/useBusinessProject';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pushDebugEvent } from '@/lib/debugEvents';
import { OnboardingCreateScreen } from './OnboardingCreateScreen';
import { OnboardingResultsError } from './OnboardingResultsError';
import { OnboardingCompleteScreen } from './OnboardingCompleteScreen';
import { generateBaselineMaturityFromProject } from './baselineMaturity';

interface NewBusinessOnboardingProps {
  onBack: () => void;
  resumeProjectId?: string;
}

type OnboardingStep = 'create' | 'processing' | 'results' | 'complete';

export const NewBusinessOnboarding: React.FC<NewBusinessOnboardingProps> = ({ onBack, resumeProjectId }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { markOnboardingComplete } = useUserType();
  const { toast } = useToast();

  const projectIdFromUrl = searchParams.get('projectId');
  const forceNewProject = searchParams.get('new') === 'true';
  const initialProjectId = forceNewProject ? null : (projectIdFromUrl || resumeProjectId || null);

  const [step, setStep] = useState<OnboardingStep>(() => {
    if (forceNewProject) return 'create';
    return initialProjectId ? 'processing' : 'create';
  });
  const [projectId, setProjectIdState] = useState<string | null>(initialProjectId);
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const [isRefreshingResults, setIsRefreshingResults] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const hasInitializedRef = useRef(false);
  const hasAutoRefreshedResultsRef = useRef(false);

  const trace = (action: string, data?: Record<string, unknown>) => {
    const payload = { ...data, step, projectId, ts: new Date().toISOString() };
    console.debug(`[opening_onboarding] ${action}`, payload);
    void pushDebugEvent(user?.id, 'opening_onboarding', action, payload);
  };

  const setProjectId = (id: string | null) => {
    trace('set_project_id', { nextProjectId: id });
    setProjectIdState(id);
    if (id) setSearchParams({ projectId: id });
    else setSearchParams({});
  };

  useEffect(() => {
    if (forceNewProject && projectIdFromUrl) setSearchParams({ new: 'true' });
  }, [forceNewProject, projectIdFromUrl, setSearchParams]);

  const { createProject, analyzePhase, generateChecklist, toggleChecklistItem } = useBusinessOpening();
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);

  const projectQuery = useBusinessProject(projectId);
  const project = projectQuery.data;
  const analysesQuery = useProjectAnalyses(projectId);
  const checklistQuery = useProjectChecklist(projectId);
  const analyses = analysesQuery.data ?? [];
  const checklist = checklistQuery.data ?? [];

  const refreshResultsData = async () => {
    if (!projectId) return;
    setIsRefreshingResults(true);
    trace('results_refetch_start');
    try {
      await Promise.all([analysesQuery.refetch(), checklistQuery.refetch()]);
    } finally {
      setIsRefreshingResults(false);
      trace('results_refetch_end');
    }
  };

  const completedPhases = analyses.filter((a) => a.status === 'completed').map((a) => a.phase as PhaseId);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!initialProjectId) return;
    if (isNewlyCreated) return;
    if (!project || !analysesQuery.isFetched) return;

    hasInitializedRef.current = true;

    if (project.progress_percentage >= 100 || completedPhases.length === PHASES.length) {
      setStep('results');
    } else {
      setStep('processing');
    }

    toast({ title: 'Continuando tu proyecto', description: `Retomando "${project.project_name}"` });
  }, [initialProjectId, project, analysesQuery.isFetched, completedPhases.length, isNewlyCreated]);

  const handleProjectCreated = async (data: any) => {
    const newProject = await createProject.mutateAsync(data);
    if (newProject) {
      setIsNewlyCreated(true);
      setProjectId(newProject.id);
      setStep('processing');
    }
  };

  const handleProcessingComplete = () => {
    trace('processing_complete');
    hasAutoRefreshedResultsRef.current = false;
    setStep('results');
  };

  useEffect(() => {
    if (step !== 'results') return;
    if (!projectId) return;
    if (hasAutoRefreshedResultsRef.current) return;
    hasAutoRefreshedResultsRef.current = true;
    void refreshResultsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, projectId]);

  const handleCancelProcessing = () => {
    trace('processing_cancelled');
    setProjectId(null);
    setStep('create');
  };

  const handleToggleChecklistItem = (itemId: string, isCompleted: boolean) => {
    toggleChecklistItem.mutate({ itemId, isCompleted });
  };

  const handleGenerateChecklist = async () => {
    if (!project) return;
    setIsGeneratingChecklist(true);
    try {
      await generateChecklist(project);
      await checklistQuery.refetch();
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const handleUpdateProject = async (data: Partial<BusinessProject>) => {
    if (!project) return;

    const { error } = await supabase
      .from('business_opening_projects')
      .update({
        target_opening_date: data.target_opening_date ?? null,
        estimated_budget: data.estimated_budget ?? null,
        description: data.description ?? null,
      })
      .eq('id', project.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios', variant: 'destructive' });
      throw error;
    }

    setNeedsRegeneration(true);
    toast({ title: 'Cambios guardados', description: 'Puedes regenerar el plan con los nuevos datos.' });
    await Promise.all([projectQuery.refetch(), analysesQuery.refetch()]);
  };

  const handleRegenerateAll = async () => {
    if (!project) return;
    setIsRegenerating(true);
    try {
      const { data: freshProject, error: refreshError } = await supabase
        .from('business_opening_projects')
        .select('*')
        .eq('id', project.id)
        .single();

      if (refreshError || !freshProject) throw refreshError || new Error('Proyecto no encontrado');

      const projectForAnalysis = freshProject as BusinessProject;

      for (const phase of PHASES) {
        await analyzePhase(projectForAnalysis, phase.id);
      }

      await generateChecklist(projectForAnalysis);
      await Promise.all([analysesQuery.refetch(), checklistQuery.refetch()]);

      setNeedsRegeneration(false);
      toast({ title: 'Plan regenerado', description: 'Todas las fases han sido actualizadas con los nuevos datos.' });
    } catch (error) {
      console.error('Error regenerating plan:', error);
      toast({ title: 'Error', description: 'No se pudo regenerar el plan completo.', variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!user || !project) return;
    setIsCompletingSetup(true);

    try {
      const { data: business, error: businessError } = await (supabase as any)
        .from('restaurant_businesses')
        .insert({
          owner_id: user.id,
          name: project.project_name,
          business_type: project.business_type,
          cuisine_type: project.cuisine_type,
          city: project.city,
          state: project.country,
          address: project.neighborhood || '',
          opening_date: project.target_opening_date || null,
        })
        .select()
        .single();

      if (businessError) throw businessError;

      const baseline = generateBaselineMaturityFromProject(project, analyses);

      const { error: diagnosisError } = await supabase
        .from('maturity_diagnoses')
        .insert({
          user_id: user.id,
          answers: baseline.answers,
          pillar_scores: baseline.pillarScores,
          overall_score: baseline.overallScore,
          overall_level: baseline.level,
          restaurant_context: {
            businessType: project.business_type,
            location: `${project.city}, ${project.country}`,
            cuisineType: project.cuisine_type,
            isNewBusiness: true,
            openingProjectId: project.id,
          },
        } as any);

      if (diagnosisError) throw diagnosisError;

      await supabase.functions
        .invoke('maturity-ai-engine', {
          body: {
            action: 'generate_action_plan',
            diagnosisData: {
              pillarScores: baseline.pillarScores,
              overallScore: baseline.overallScore,
              overallLevel: baseline.level,
              answers: baseline.answers,
            },
            restaurantContext: {
              businessType: project.business_type,
              location: `${project.city}, ${project.country}`,
              cuisineType: project.cuisine_type,
              isNewBusiness: true,
            },
          },
        })
        .catch((err) => console.warn('AI action plan error:', err));

      await supabase
        .from('business_opening_projects')
        .update({ progress_percentage: 100, current_phase: 'completed' })
        .eq('id', project.id);

      markOnboardingComplete('restaurant_owner');

      toast({ title: '¡Felicidades! 🎉', description: 'Tu restaurante ha sido creado exitosamente.' });
      setStep('complete');
    } catch (error: any) {
      console.error('Error completing setup:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar la configuración',
        variant: 'destructive',
      });
    } finally {
      setIsCompletingSetup(false);
    }
  };

  const handleGoToDashboard = async () => {
    markOnboardingComplete('restaurant_owner');
    navigate('/r/dashboard', { replace: true });
  };

  if (step === 'create') {
    return (
      <OnboardingCreateScreen
        onBack={onBack}
        onSubmit={handleProjectCreated}
        isSubmitting={createProject.isPending}
      />
    );
  }

  if (step === 'processing' && project) {
    return (
      <div className="min-h-screen bg-background">
        <AutomaticProcessingScreen
          project={project}
          onComplete={handleProcessingComplete}
          onCancel={handleCancelProcessing}
        />
      </div>
    );
  }

  if (step === 'results' && project) {
    const analysesErrorMsg = analysesQuery.isError
      ? String((analysesQuery.error as any)?.message ?? analysesQuery.error)
      : null;
    const checklistErrorMsg = checklistQuery.isError
      ? String((checklistQuery.error as any)?.message ?? checklistQuery.error)
      : null;

    if (analysesErrorMsg || checklistErrorMsg) {
      return (
        <OnboardingResultsError
          onBack={onBack}
          analysesErrorMsg={analysesErrorMsg}
          checklistErrorMsg={checklistErrorMsg}
          onRetry={() => void refreshResultsData()}
          isRefreshing={isRefreshingResults}
        />
      );
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>

          <OpeningResultsDashboard
            project={project}
            analyses={analyses}
            checklist={checklist}
            onToggleChecklistItem={handleToggleChecklistItem}
            onGenerateChecklist={handleGenerateChecklist}
            isGeneratingChecklist={isGeneratingChecklist}
            onRefreshData={refreshResultsData}
            isRefreshing={isRefreshingResults || analysesQuery.isFetching || checklistQuery.isFetching}
            onComplete={handleCompleteSetup}
            isCompleting={isCompletingSetup}
            onUpdateProject={handleUpdateProject}
            onRegenerateAll={handleRegenerateAll}
            isRegenerating={isRegenerating}
            needsRegeneration={needsRegeneration}
          />
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return <OnboardingCompleteScreen onGoToDashboard={handleGoToDashboard} />;
  }

  if (projectId && !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return null;
};
