import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Rocket, CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OpeningProjectWizard } from '@/components/opening/OpeningProjectWizard';
import { PhaseAnalysisCard } from '@/components/opening/PhaseAnalysisCard';
import { useBusinessOpening, PHASES, PhaseId, BusinessProject } from '@/hooks/useBusinessOpening';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, ListChecks, MessageSquare } from 'lucide-react';
import { OpeningChecklist } from '@/components/opening/OpeningChecklist';
import { OpeningChat } from '@/components/opening/OpeningChat';

interface NewBusinessOnboardingProps {
  onBack: () => void;
  resumeProjectId?: string; // Optional: if provided, resume this project instead of creating new
}

type OnboardingStep = 'create' | 'setup' | 'complete';

export const NewBusinessOnboarding: React.FC<NewBusinessOnboardingProps> = ({ onBack, resumeProjectId }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshUserType } = useUserType();
  const { toast } = useToast();

  // Prefer URL param for persistence across refresh; fallback to resumeProjectId
  const projectIdFromUrl = searchParams.get('projectId');
  const initialProjectId = projectIdFromUrl || resumeProjectId || null;

  // If resuming, start in setup step directly
  const [step, setStep] = useState<OnboardingStep>(initialProjectId ? 'setup' : 'create');
  const [projectId, setProjectIdState] = useState<string | null>(initialProjectId);
  const [analyzingPhase, setAnalyzingPhase] = useState<PhaseId | null>(null);
  const [activeTab, setActiveTab] = useState('phases');
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);

  const setProjectId = (id: string | null) => {
    setProjectIdState(id);
    if (id) setSearchParams({ projectId: id });
    else setSearchParams({});
  };

  const {
    useProject,
    useProjectAnalyses,
    useProjectChecklist,
    createProject,
    analyzePhase,
    askAssistant,
    generateChecklist,
    toggleChecklistItem,
    isAnalyzing,
  } = useBusinessOpening();

  const { data: project } = useProject(projectId || '');
  const { data: analyses } = useProjectAnalyses(projectId || '');
  const { data: checklist } = useProjectChecklist(projectId || '');

  // If resuming and we have a project, show a toast
  useEffect(() => {
    if ((resumeProjectId || projectIdFromUrl) && project) {
      toast({
        title: "Continuando tu proyecto",
        description: `Retomando "${project.project_name}"`,
      });
    }
  }, [resumeProjectId, projectIdFromUrl, project?.id]);

  // Keep local state in sync if URL changes (e.g. user opens a shared link)
  useEffect(() => {
    if (projectIdFromUrl && projectIdFromUrl !== projectId) {
      setProjectIdState(projectIdFromUrl);
      setStep('setup');
    }
  }, [projectIdFromUrl]);

  const getPhaseAnalysis = (phaseId: PhaseId) => {
    return analyses?.find(a => a.phase === phaseId);
  };

  const calculateProgress = () => {
    if (!analyses) return 0;
    const completedPhases = PHASES.filter(p => 
      analyses.some(a => a.phase === p.id && a.status === 'completed')
    ).length;
    return (completedPhases / PHASES.length) * 100;
  };

  const handleAnalyzePhase = async (phaseId: PhaseId) => {
    if (!project) return;

    // Prevent concurrent analyses (this was causing state to "jump" and appear to lose progress)
    if (isAnalyzing || analyzingPhase) {
      toast({
        title: 'Análisis en progreso',
        description: 'Espera a que termine el análisis actual antes de iniciar otro.',
      });
      return;
    }

    setAnalyzingPhase(phaseId);
    await analyzePhase(project, phaseId);
    setAnalyzingPhase(null);
    
    // Auto-generate checklist after first analysis if not exists
    if (!checklist || checklist.length === 0) {
      toast({
        title: "Generando checklist",
        description: "Creando tu lista de tareas personalizada...",
      });
      await generateChecklist(project);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!project) return null;
    return await askAssistant(project, question);
  };

  const handleGenerateChecklist = async () => {
    if (!project) return;
    await generateChecklist(project);
  };

  const handleToggleChecklistItem = (itemId: string, isCompleted: boolean) => {
    toggleChecklistItem.mutate({ itemId, isCompleted });
  };

  // Complete the setup and create the restaurant + baseline maturity
  const handleCompleteSetup = async () => {
    if (!user || !project) return;
    
    setIsCompletingSetup(true);
    
    try {
      // 1. Create the restaurant business from project data with target opening date
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
          opening_date: project.target_opening_date || null, // Use the planned opening date
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // 2. Generate baseline maturity scores from the opening process
      const baselineScores = generateBaselineMaturityFromProject(project, analyses || []);
      
      // 3. Create the maturity diagnosis with baseline
      const { data: diagnosis, error: diagnosisError } = await supabase
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
        } as any)
        .select()
        .single();

      if (diagnosisError) throw diagnosisError;

      // 4. Generate AI action plan for the new business
      const { error: aiError } = await supabase.functions.invoke('maturity-ai-engine', {
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
      });

      if (aiError) {
        console.warn('Could not generate AI action plan:', aiError);
      }

      // 5. Mark project as 100% complete
      await supabase
        .from('business_opening_projects')
        .update({ progress_percentage: 100, current_phase: 'completed' })
        .eq('id', project.id);

      // 6. Refresh user type cache so OnboardingGuard knows onboarding is complete
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

  // Navigate to dashboard after completion - ensure user type is refreshed
  const handleGoToDashboard = async () => {
    // Double-check the user type is refreshed before navigating
    await refreshUserType();
    // Small delay to ensure React Query has propagated the update
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
            onSubmit={async (data) => {
              const newProject = await createProject.mutateAsync(data);
              if (newProject) {
                setProjectId(newProject.id);
                setStep('setup');
              }
            }}
            isSubmitting={createProject.isPending}
          />
        </div>
      </div>
    );
  }

  // Step 2: Setup & Analysis
  if (step === 'setup' && project) {
    const progress = calculateProgress();
    // Allow completion after at least 1 phase analyzed OR if resuming a project
    const hasAnyAnalysis = analyses && analyses.length > 0;
    const canComplete = hasAnyAnalysis || progress > 0;

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-primary" />
                  {project.project_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {project.business_type} • {project.city}, {project.country}
                </p>
              </div>
            </div>

            {/* Single action button - clearer UX */}
            <Button 
              onClick={handleCompleteSetup}
              disabled={isCompletingSetup}
              className="gap-2"
            >
              {isCompletingSetup ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando tu restaurante...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {hasAnyAnalysis ? 'Finalizar y crear restaurante' : 'Crear restaurante ahora'}
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso del proyecto</span>
                <span className="text-sm text-muted-foreground">
                  {analyses?.filter(a => a.status === 'completed').length || 0} / {PHASES.length} fases analizadas
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {hasAnyAnalysis 
                  ? "Puedes finalizar cuando quieras o continuar analizando más fases para obtener mejores recomendaciones"
                  : "Analiza las fases que necesites o crea tu restaurante directamente con el botón superior"
                }
              </p>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="phases" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Fases de Análisis
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Asistente
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phases" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {PHASES.map((phase) => (
                  <PhaseAnalysisCard
                    key={phase.id}
                    phaseId={phase.id}
                    analysis={getPhaseAnalysis(phase.id)}
                    onAnalyze={() => handleAnalyzePhase(phase.id)}
                    isAnalyzing={analyzingPhase === phase.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="mt-6">
              {checklist && checklist.length > 0 ? (
                <OpeningChecklist 
                  items={checklist} 
                  onToggle={handleToggleChecklistItem}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay checklist generado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Genera un checklist personalizado para tu proyecto de apertura
                    </p>
                    <Button onClick={handleGenerateChecklist} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <ListChecks className="h-4 w-4 mr-2" />
                          Generar Checklist
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <OpeningChat 
                project={project}
                onAskQuestion={handleAskQuestion}
                isLoading={isAnalyzing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Step 3: Complete
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

  return null;
};

// Helper function to generate baseline maturity scores from the opening project
function generateBaselineMaturityFromProject(
  project: BusinessProject,
  analyses: any[]
): {
  answers: Record<number, number>;
  pillarScores: Record<string, number>;
  overallScore: number;
  level: 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto';
} {
  // Map opening phases to maturity pillars
  const phaseToMaturityPillar: Record<string, string> = {
    'legal_requirements': 'legal_compliance',
    'location_analysis': 'operations',
    'equipment_setup': 'operations',
    'supplier_network': 'supply_chain',
    'staffing_plan': 'talent',
    'marketing_launch': 'marketing',
    'financial_projection': 'finances',
  };

  // Calculate scores based on completed phases and their quality
  const pillarScores: Record<string, number> = {
    'finances': 2.0,      // Base score for new business
    'operations': 2.0,
    'talent': 2.0,
    'marketing': 2.0,
    'supply_chain': 2.0,
    'technology': 1.5,    // Lower base for tech
    'customer_experience': 1.5,
    'sustainability': 1.0,
  };

  // Boost scores based on completed analyses
  analyses.forEach(analysis => {
    const maturityPillar = phaseToMaturityPillar[analysis.phase];
    if (maturityPillar && pillarScores[maturityPillar] !== undefined) {
      // Add 0.5 for each completed phase analysis
      pillarScores[maturityPillar] = Math.min(pillarScores[maturityPillar] + 0.5, 3.5);
    }
  });

  // Calculate overall score
  const scores = Object.values(pillarScores);
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Determine level
  let level: 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto' = 'inicial';
  if (overallScore >= 4) level = 'experto';
  else if (overallScore >= 3) level = 'avanzado';
  else if (overallScore >= 2.5) level = 'intermedio';
  else if (overallScore >= 2) level = 'basico';

  // Generate placeholder answers (we'll use the pillar scores instead)
  const answers: Record<number, number> = {};
  for (let i = 0; i < 8; i++) {
    answers[i] = Math.round(overallScore);
  }

  return {
    answers,
    pillarScores,
    overallScore,
    level,
  };
}
