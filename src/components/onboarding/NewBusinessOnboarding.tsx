import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Rocket, CheckCircle2, Loader2, PartyPopper, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpeningProjectWizard } from '@/components/opening/OpeningProjectWizard';
import { AutomaticProcessingScreen } from '@/components/opening/AutomaticProcessingScreen';
import { OpeningResultsDashboard } from '@/components/opening/OpeningResultsDashboard';
import { useBusinessOpening, PHASES, PhaseId } from '@/hooks/useBusinessOpening';
import { useBusinessProject, useProjectAnalyses, useProjectChecklist, BusinessProject } from '@/hooks/useBusinessProject';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pushDebugEvent } from '@/lib/debugEvents';

interface NewBusinessOnboardingProps {
  onBack: () => void;
  resumeProjectId?: string;
}

type OnboardingStep = 'create' | 'processing' | 'results' | 'complete';

export const NewBusinessOnboarding: React.FC<NewBusinessOnboardingProps> = ({ onBack, resumeProjectId }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshUserType } = useUserType();
  const { toast } = useToast();

  const projectIdFromUrl = searchParams.get('projectId');
  // Check if URL explicitly has a "new" parameter to force creation mode
  const forceNewProject = searchParams.get('new') === 'true';
  const initialProjectId = forceNewProject ? null : (projectIdFromUrl || resumeProjectId || null);

  console.debug('[NewBusinessOnboarding] Init', { 
    forceNewProject, 
    projectIdFromUrl, 
    resumeProjectId, 
    initialProjectId 
  });

  // Determine initial step based on project state
  // Only start in 'processing' if we have a project ID AND it's not a forced new project
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (forceNewProject) return 'create';
    return initialProjectId ? 'processing' : 'create';
  });
  const [projectId, setProjectIdState] = useState<string | null>(initialProjectId);
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);
  // Track if project was just created in this session (to prevent auto-skip)
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
    if (id) {
      // Clear the "new" param and set the projectId
      setSearchParams({ projectId: id });
    } else {
      setSearchParams({});
    }
  };

  // Clear URL params if forcing new project creation
  useEffect(() => {
    if (forceNewProject && projectIdFromUrl) {
      // Clear the old projectId from URL when creating a new project
      setSearchParams({ new: 'true' });
    }
  }, [forceNewProject, projectIdFromUrl, setSearchParams]);

  const {
    createProject,
    analyzePhase,
    generateChecklist,
    toggleChecklistItem,
  } = useBusinessOpening();

  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);

  const { data: project } = useBusinessProject(projectId);
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

  // Determine if project has completed analyses
  const completedPhases = analyses
    .filter(a => a.status === 'completed')
    .map(a => a.phase as PhaseId);

  // Initialize step based on project state (only once, for RESUMED projects)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    // Only run for projects being resumed, NOT for newly created ones
    if (!initialProjectId) return;
    if (isNewlyCreated) return; // Skip if we just created this project
    if (!project || !analysesQuery.isFetched) return;

    hasInitializedRef.current = true;

    // Determine where to resume
    if (project.progress_percentage >= 100) {
      // Already completed, show results
      setStep('results');
    } else if (completedPhases.length === PHASES.length) {
      // All phases done, show results
      setStep('results');
    } else {
      // Resume processing (some or no phases done)
      setStep('processing');
    }

    toast({
      title: "Continuando tu proyecto",
      description: `Retomando "${project.project_name}"`,
    });
  }, [initialProjectId, project, analysesQuery.isFetched, completedPhases.length, isNewlyCreated]);

  // Handle project creation
  const handleProjectCreated = async (data: any) => {
    const newProject = await createProject.mutateAsync(data);
    if (newProject) {
      setIsNewlyCreated(true); // Mark as newly created to prevent useEffect from overriding step
      setProjectId(newProject.id);
      setStep('processing');
    }
  };

  // Handle processing completion
  const handleProcessingComplete = () => {
    trace('processing_complete');
    // When we land on Results, force a fresh pull of analyses/checklist.
    hasAutoRefreshedResultsRef.current = false;
    setStep('results');
  };

  // Auto-refresh data once when entering Results (prevents blank UI on stale cache / silent query errors)
  useEffect(() => {
    if (step !== 'results') return;
    if (!projectId) return;
    if (hasAutoRefreshedResultsRef.current) return;
    hasAutoRefreshedResultsRef.current = true;
    void refreshResultsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, projectId]);

  // Handle cancel processing
  const handleCancelProcessing = () => {
    trace('processing_cancelled');
    // Go back to create step, clear project
    setProjectId(null);
    setStep('create');
  };

  // Handle checklist item toggle
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

  // Update project details
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
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
      throw error;
    }

    // Mark that we need to regenerate
    setNeedsRegeneration(true);

    toast({
      title: "Cambios guardados",
      description: "Puedes regenerar el plan con los nuevos datos.",
    });

    // Refresh project data
    await analysesQuery.refetch();
  };

  // Regenerate all phases
  const handleRegenerateAll = async () => {
    if (!project) return;
    
    setIsRegenerating(true);
    try {
      // Refresh project to get latest data
      const { data: freshProject, error: refreshError } = await supabase
        .from('business_opening_projects')
        .select('*')
        .eq('id', project.id)
        .single();
      
      if (refreshError || !freshProject) {
        throw refreshError || new Error('Proyecto no encontrado');
      }

      const projectForAnalysis = freshProject as BusinessProject;

      // Re-analyze all phases sequentially
      for (const phase of PHASES) {
        await analyzePhase(projectForAnalysis, phase.id);
      }

      // Regenerate checklist
      await generateChecklist(projectForAnalysis);

      // Refresh data
      await Promise.all([analysesQuery.refetch(), checklistQuery.refetch()]);

      setNeedsRegeneration(false);

      toast({
        title: "Plan regenerado",
        description: "Todas las fases han sido actualizadas con los nuevos datos.",
      });
    } catch (error) {
      console.error('Error regenerating plan:', error);
      toast({
        title: "Error",
        description: "No se pudo regenerar el plan completo.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Complete the setup and create the restaurant
  const handleCompleteSetup = async () => {
    if (!user || !project) return;
    
    setIsCompletingSetup(true);
    
    try {
      // 1. Create the restaurant business
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

      // 2. Generate baseline maturity scores
      const baselineScores = generateBaselineMaturityFromProject(project, analyses);
      
      // 3. Create the maturity diagnosis
      const { error: diagnosisError } = await supabase
        .from('maturity_diagnoses')
        .insert({
          user_id: user.id,
          answers: baselineScores.answers,
          pillar_scores: baselineScores.pillarScores,
          overall_score: baselineScores.overallScore,
          overall_level: baselineScores.level,
          restaurant_context: {
            businessType: project.business_type,
            location: `${project.city}, ${project.country}`,
            cuisineType: project.cuisine_type,
            isNewBusiness: true,
            openingProjectId: project.id,
          },
        } as any);

      if (diagnosisError) throw diagnosisError;

      // 4. Generate AI action plan
      await supabase.functions.invoke('maturity-ai-engine', {
        body: {
          action: 'generate_action_plan',
          diagnosisData: {
            pillarScores: baselineScores.pillarScores,
            overallScore: baselineScores.overallScore,
            overallLevel: baselineScores.level,
            answers: baselineScores.answers,
          },
          restaurantContext: {
            businessType: project.business_type,
            location: `${project.city}, ${project.country}`,
            cuisineType: project.cuisine_type,
            isNewBusiness: true,
          },
        },
      }).catch(err => console.warn('AI action plan error:', err));

      // 5. Mark project as complete
      await supabase
        .from('business_opening_projects')
        .update({ progress_percentage: 100, current_phase: 'completed' })
        .eq('id', project.id);

      // 6. Refresh user type
      await refreshUserType();

      toast({
        title: "¡Felicidades! 🎉",
        description: "Tu restaurante ha sido creado exitosamente.",
      });

      setStep('complete');
    } catch (error: any) {
      console.error('Error completing setup:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo completar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsCompletingSetup(false);
    }
  };

  const handleGoToDashboard = async () => {
    await refreshUserType();
    await new Promise(resolve => setTimeout(resolve, 100));
    navigate('/r/dashboard', { replace: true });
  };

  // Step 1: Create Project
  if (step === 'create') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-headline font-bold">Asistente de Apertura</h1>
                <p className="text-muted-foreground">Te guiaremos paso a paso en la apertura de tu negocio</p>
              </div>
            </div>
          </div>

          <OpeningProjectWizard
            onSubmit={handleProjectCreated}
            isSubmitting={createProject.isPending}
          />
        </div>
      </div>
    );
  }

  // Step 2: Automatic Processing
  if (step === 'processing' && project) {
    return (
      <div className="min-h-screen bg-background">
        <AutomaticProcessingScreen
          project={project}
          onComplete={handleProcessingComplete}
          onCancel={handleCancelProcessing}
          analyzePhase={analyzePhase}
          generateChecklist={generateChecklist}
          completedPhases={completedPhases}
        />
      </div>
    );
  }

  // Step 3: Results Dashboard
  if (step === 'results' && project) {
    const analysesErrorMsg = analysesQuery.isError
      ? String((analysesQuery.error as any)?.message ?? analysesQuery.error)
      : null;
    const checklistErrorMsg = checklistQuery.isError
      ? String((checklistQuery.error as any)?.message ?? checklistQuery.error)
      : null;

    if (analysesErrorMsg || checklistErrorMsg) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <CardTitle>No se pudo cargar tu plan</CardTitle>
                </div>
                <CardDescription>
                  Se generaron acciones, pero la app no puede leer el análisis/checklist. Esto suele ser permisos (RLS) o sesión.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysesErrorMsg && (
                  <div className="text-sm">
                    <p className="font-medium">Error cargando análisis:</p>
                    <p className="text-muted-foreground break-words">{analysesErrorMsg}</p>
                  </div>
                )}
                {checklistErrorMsg && (
                  <div className="text-sm">
                    <p className="font-medium">Error cargando checklist:</p>
                    <p className="text-muted-foreground break-words">{checklistErrorMsg}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void refreshResultsData()}
                  disabled={isRefreshingResults}
                >
                  {isRefreshingResults ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Reintentando…
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Reintentar carga
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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

  // Step 4: Complete
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
              <PartyPopper className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">
              ¡Felicidades por tu nuevo restaurante!
            </CardTitle>
            <CardDescription className="text-base">
              Hemos creado tu línea base de madurez basada en cómo montaste tu negocio. 
              Ahora tienes un plan de acción personalizado para mejorar continuamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="font-medium mb-2">Lo que preparamos para ti:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Diagnóstico inicial de madurez
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Plan de acción con prioridades
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Benchmark contra la industria
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  KPIs para medir tu progreso
                </li>
              </ul>
            </div>

            <Button size="lg" onClick={handleGoToDashboard} className="w-full gap-2">
              Ir a mi Dashboard
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (projectId && !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return null;
};

// Helper function to generate baseline maturity scores
function generateBaselineMaturityFromProject(
  project: BusinessProject,
  analyses: any[]
): {
  answers: Record<number, number>;
  pillarScores: Record<string, number>;
  overallScore: number;
  level: 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto';
} {
  const phaseToMaturityPillar: Record<string, string> = {
    'legal_requirements': 'legal_compliance',
    'location_analysis': 'operations',
    'equipment_setup': 'operations',
    'supplier_network': 'supply_chain',
    'staffing_plan': 'talent',
    'marketing_launch': 'marketing',
    'financial_projection': 'finances',
  };

  const pillarScores: Record<string, number> = {
    'finances': 2.0,
    'operations': 2.0,
    'talent': 2.0,
    'marketing': 2.0,
    'supply_chain': 2.0,
    'technology': 1.5,
    'customer_experience': 1.5,
    'sustainability': 1.0,
  };

  analyses.forEach(analysis => {
    const maturityPillar = phaseToMaturityPillar[analysis.phase];
    if (maturityPillar && pillarScores[maturityPillar] !== undefined) {
      pillarScores[maturityPillar] = Math.min(pillarScores[maturityPillar] + 0.5, 3.5);
    }
  });

  const scores = Object.values(pillarScores);
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  let level: 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto' = 'inicial';
  if (overallScore >= 4) level = 'experto';
  else if (overallScore >= 3) level = 'avanzado';
  else if (overallScore >= 2.5) level = 'intermedio';
  else if (overallScore >= 2) level = 'basico';

  const answers: Record<number, number> = {};
  for (let i = 0; i < 8; i++) {
    answers[i] = Math.round(overallScore);
  }

  return { answers, pillarScores, overallScore, level };
}
