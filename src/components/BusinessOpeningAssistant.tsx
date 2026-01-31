import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBusinessOpening, PhaseId, PHASES } from '@/hooks/useBusinessOpening';
import { useBusinessProject, useProjectAnalyses, useProjectChecklist } from '@/hooks/useBusinessProject';
import { OpeningProjectWizard } from './opening/OpeningProjectWizard';
import { PhaseAnalysisCard } from './opening/PhaseAnalysisCard';
import { OpeningChecklist } from './opening/OpeningChecklist';
import { OpeningChat } from './opening/OpeningChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { pushDebugEvent } from '@/lib/debugEvents';
import { 
  Rocket, ArrowLeft, Building2, MapPin, Calendar, DollarSign, 
  LayoutGrid, ListChecks, MessageSquare, Trash2, Loader2, 
  CheckCircle2, Clock, ChefHat
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BusinessOpeningAssistantProps {
  userType: 'restaurant_owner' | 'consultant';
}

export function BusinessOpeningAssistant({ userType }: BusinessOpeningAssistantProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Persist selectedProjectId in URL to survive page refresh
  const selectedProjectIdFromUrl = searchParams.get('projectId');
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(selectedProjectIdFromUrl);
  const [activeTab, setActiveTab] = useState('phases');
  const [analyzingPhase, setAnalyzingPhase] = useState<PhaseId | null>(null);

  // Sync URL with state
  const setSelectedProjectId = (id: string | null) => {
    setSelectedProjectIdState(id);
    if (id) {
      setSearchParams({ projectId: id });
    } else {
      setSearchParams({});
    }
  };

  // On mount, restore from URL
  useEffect(() => {
    if (selectedProjectIdFromUrl && !selectedProjectId) {
      setSelectedProjectIdState(selectedProjectIdFromUrl);
    }
  }, [selectedProjectIdFromUrl]);

  const {
    projects,
    loadingProjects,
    isAnalyzing,
    createProject,
    analyzePhase,
    askAssistant,
    generateChecklist,
    toggleChecklistItem,
    deleteProject,
  } = useBusinessOpening();

  // Use dedicated hooks for project data - these are proper React hooks
  const { data: selectedProject } = useBusinessProject(selectedProjectId);
  const { data: analyses } = useProjectAnalyses(selectedProjectId);
  const { data: checklist } = useProjectChecklist(selectedProjectId);

  const basePath = userType === 'consultant' ? '/c' : '/r';

  // Get analysis for a specific phase
  const getPhaseAnalysis = (phaseId: PhaseId) => {
    return analyses?.find(a => a.phase === phaseId);
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!analyses) return 0;
    const completedPhases = PHASES.filter(p => 
      analyses.some(a => a.phase === p.id && a.status === 'completed')
    ).length;
    return (completedPhases / PHASES.length) * 100;
  };

  const handleAnalyzePhase = async (phaseId: PhaseId) => {
    if (!selectedProject) return;

    // Prevent concurrent analyses (can make UI state appear to reset)
    if (isAnalyzing || analyzingPhase) {
      return;
    }

    setAnalyzingPhase(phaseId);
    await analyzePhase(selectedProject, phaseId);
    setAnalyzingPhase(null);
  };

  const handleAskQuestion = async (question: string) => {
    if (!selectedProject) return null;
    return await askAssistant(selectedProject, question);
  };

  const handleGenerateChecklist = async () => {
    if (!selectedProject) return;
    await generateChecklist(selectedProject);
  };

  const handleToggleChecklistItem = (itemId: string, isCompleted: boolean) => {
    toggleChecklistItem.mutate({ itemId, isCompleted });
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    await deleteProject.mutateAsync(selectedProjectId);
    setSelectedProjectId(null);
  };

  // Show wizard if no project selected
  if (!selectedProjectId) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Rocket className="h-8 w-8 text-primary" />
              Abrir Nuevo Negocio
            </h1>
            <p className="text-muted-foreground mt-1">
              Tu asistente inteligente para la apertura de negocios gastronómicos
            </p>
          </div>
        </div>

        {/* Existing projects */}
        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tus Proyectos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{project.project_name}</CardTitle>
                      </div>
                      <Badge variant={project.progress_percentage >= 100 ? "default" : "secondary"}>
                        {project.progress_percentage}%
                      </Badge>
                    </div>
                    <CardDescription>
                      {project.business_type} • {project.city}, {project.country}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={project.progress_percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Creado el {new Date(project.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="pt-4">
              <h2 className="text-xl font-semibold mb-4">Crear Nuevo Proyecto</h2>
              <OpeningProjectWizard 
                onSubmit={async (data) => {
                  const project = await createProject.mutateAsync(data);
                  if (project) {
                    setSelectedProjectId(project.id);
                  }
                }}
                isSubmitting={createProject.isPending}
              />
            </div>
          </div>
        ) : (
          <OpeningProjectWizard 
            onSubmit={async (data) => {
              const project = await createProject.mutateAsync(data);
              if (project) {
                setSelectedProjectId(project.id);
              }
            }}
            isSubmitting={createProject.isPending}
          />
        )}
      </div>
    );
  }

  // Show project dashboard
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedProjectId(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              {selectedProject.project_name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {selectedProject.business_type}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selectedProject.city}, {selectedProject.country}
              </span>
              {selectedProject.estimated_budget && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${selectedProject.estimated_budget.toLocaleString()}
                </span>
              )}
              {selectedProject.target_opening_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedProject.target_opening_date).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto 
                  "{selectedProject.project_name}" y todos sus análisis.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
          <Progress value={calculateProgress()} className="h-3" />
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
                country={selectedProject?.country}
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
            project={selectedProject}
            onAskQuestion={handleAskQuestion}
            isLoading={isAnalyzing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
