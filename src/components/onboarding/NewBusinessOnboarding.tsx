import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Rocket, CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
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
  const initialProjectId = projectIdFromUrl || resumeProjectId || null;

  // Determine initial step based on project state
  // If we have an initial project ID from URL/resume, we'll determine the step after fetching
  const [step, setStep] = useState<OnboardingStep>(initialProjectId ? 'processing' : 'create');
  const [projectId, setProjectIdState] = useState<string | null>(initialProjectId);
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);
  // Track if project was just created in this session (to prevent auto-skip)
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const hasInitializedRef = useRef(false);

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

  const {
    createProject,
    analyzePhase,
    generateChecklist,
    toggleChecklistItem,
  } = useBusinessOpening();

  const { data: project } = useBusinessProject(projectId);
  const analysesQuery = useProjectAnalyses(projectId);
  const checklistQuery = useProjectChecklist(projectId);
  const analyses = analysesQuery.data ?? [];
  const checklist = checklistQuery.data ?? [];

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
    setStep('results');
  };

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
            onComplete={handleCompleteSetup}
            isCompleting={isCompletingSetup}
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
