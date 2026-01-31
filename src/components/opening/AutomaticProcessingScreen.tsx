import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, CheckCircle2, Circle, AlertCircle, 
  Rocket, Scale, MapPin, ChefHat, Truck, Users, 
  Megaphone, TrendingUp, XCircle, RefreshCw
} from 'lucide-react';
import { PhaseId, PHASES } from '@/hooks/useBusinessOpening';
import { BusinessProject } from '@/hooks/useBusinessProject';
import { useAnalysisRun } from '@/hooks/useAnalysisRun';
import { cn } from '@/lib/utils';

interface AutomaticProcessingScreenProps {
  project: BusinessProject;
  onComplete: () => void;
  onCancel: () => void;
}

const PHASE_ICONS: Record<PhaseId, React.ElementType> = {
  legal_requirements: Scale,
  location_analysis: MapPin,
  equipment_setup: ChefHat,
  supplier_network: Truck,
  staffing_plan: Users,
  marketing_launch: Megaphone,
  financial_projection: TrendingUp,
};

const PROCESSING_MESSAGES: Record<PhaseId, string[]> = {
  legal_requirements: [
    'Investigando requisitos legales...',
    'Consultando normativas locales...',
    'Analizando permisos necesarios...',
  ],
  location_analysis: [
    'Analizando ubicación seleccionada...',
    'Evaluando competencia cercana...',
    'Revisando demografía del área...',
  ],
  equipment_setup: [
    'Evaluando equipamiento necesario...',
    'Calculando costos de instalación...',
    'Revisando opciones de equipo...',
  ],
  supplier_network: [
    'Buscando proveedores locales...',
    'Comparando precios de insumos...',
    'Evaluando opciones de distribución...',
  ],
  staffing_plan: [
    'Definiendo estructura de personal...',
    'Calculando costos laborales...',
    'Analizando perfiles necesarios...',
  ],
  marketing_launch: [
    'Diseñando estrategia de lanzamiento...',
    'Planificando campaña de apertura...',
    'Evaluando canales de marketing...',
  ],
  financial_projection: [
    'Calculando inversión inicial...',
    'Proyectando flujo de caja...',
    'Estimando punto de equilibrio...',
  ],
};

export function AutomaticProcessingScreen({
  project,
  onComplete,
  onCancel,
}: AutomaticProcessingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  
  const {
    currentRun,
    progress,
    isStarting,
    startFullAnalysis,
    cancelRun,
    hasIncompleteRun,
  } = useAnalysisRun(project.id);

  // Start analysis on mount (only once)
  useEffect(() => {
    if (hasStarted) return;
    if (!project.id) return;
    
    setHasStarted(true);
    startFullAnalysis(project);
  }, [project.id, hasStarted, startFullAnalysis, project]);

  // Handle completion
  useEffect(() => {
    if (progress?.isComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress?.isComplete, onComplete]);

  // Cycle through processing messages
  useEffect(() => {
    if (!progress?.currentPhase) return;
    
    const phaseKey = progress.currentPhase as PhaseId;
    const messages = PROCESSING_MESSAGES[phaseKey];
    if (!messages) return;
    
    let index = 0;
    setCurrentMessage(messages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setCurrentMessage(messages[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, [progress?.currentPhase]);

  const handleCancel = async () => {
    await cancelRun();
    onCancel();
  };

  const handleResume = () => {
    startFullAnalysis(project);
  };

  // Calculate phase status based on run progress
  const getPhaseStatus = (phaseId: PhaseId): 'pending' | 'processing' | 'completed' | 'error' => {
    if (!currentRun) return 'pending';
    
    if (currentRun.phases_completed?.includes(phaseId)) return 'completed';
    if (currentRun.phases_failed?.includes(phaseId)) return 'error';
    if (currentRun.current_phase === phaseId) return 'processing';
    
    return 'pending';
  };

  const completedCount = progress?.phasesCompleted || 0;
  const isGeneratingChecklist = progress?.isProcessing && completedCount === PHASES.length && !progress?.checklistGenerated;
  const overallProgress = ((completedCount + (isGeneratingChecklist ? 0.5 : 0) + (progress?.checklistGenerated ? 1 : 0)) / (PHASES.length + 1)) * 100;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-primary/10 p-6 rounded-full">
              <Rocket className="h-12 w-12 text-primary animate-bounce" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            {hasIncompleteRun ? 'Continuando tu Plan de Apertura' : 'Preparando tu Plan de Apertura'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {project.project_name} • {project.city}, {project.country}
          </p>
          <p className="text-sm text-muted-foreground">
            💡 Puedes cerrar esta pestaña. El análisis continuará en segundo plano.
          </p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progreso general</span>
                <span className="text-muted-foreground">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>

            {/* Current action message */}
            {(progress?.isProcessing || isStarting) && currentMessage && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg mb-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {isGeneratingChecklist 
                    ? 'Generando checklist personalizado...' 
                    : currentMessage}
                </span>
              </div>
            )}

            {/* Phase list */}
            <div className="space-y-3">
              {PHASES.map((phase) => {
                const status = getPhaseStatus(phase.id);
                const Icon = PHASE_ICONS[phase.id];
                
                return (
                  <div
                    key={phase.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                      status === 'processing' && "bg-primary/5 border border-primary/20",
                      status === 'completed' && "bg-green-50 dark:bg-green-950/20",
                      status === 'error' && "bg-destructive/5 border border-destructive/20",
                      status === 'pending' && "bg-muted/30"
                    )}
                  >
                    {/* Status icon */}
                    <div className={cn(
                      "flex-shrink-0 p-2 rounded-full",
                      status === 'processing' && "bg-primary/10",
                      status === 'completed' && "bg-green-100 dark:bg-green-900/30",
                      status === 'error' && "bg-destructive/10",
                      status === 'pending' && "bg-muted"
                    )}>
                      {status === 'pending' && (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      {status === 'processing' && (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      )}
                      {status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      {status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>

                    {/* Phase icon and name */}
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className={cn(
                        "h-5 w-5",
                        status === 'completed' && "text-green-600 dark:text-green-400",
                        status === 'processing' && "text-primary",
                        status === 'error' && "text-destructive",
                        status === 'pending' && "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "font-medium",
                        status === 'pending' && "text-muted-foreground"
                      )}>
                        {phase.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Checklist step */}
              <div
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                  isGeneratingChecklist && "bg-primary/5 border border-primary/20",
                  progress?.checklistGenerated && "bg-green-50 dark:bg-green-950/20",
                  !isGeneratingChecklist && !progress?.checklistGenerated && "bg-muted/30"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full",
                  isGeneratingChecklist && "bg-primary/10",
                  progress?.checklistGenerated && "bg-green-100 dark:bg-green-900/30",
                  !isGeneratingChecklist && !progress?.checklistGenerated && "bg-muted"
                )}>
                  {!isGeneratingChecklist && !progress?.checklistGenerated && (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  {isGeneratingChecklist && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {progress?.checklistGenerated && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <Rocket className={cn(
                    "h-5 w-5",
                    progress?.checklistGenerated && "text-green-600 dark:text-green-400",
                    isGeneratingChecklist && "text-primary",
                    !isGeneratingChecklist && !progress?.checklistGenerated && "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium",
                    !isGeneratingChecklist && !progress?.checklistGenerated && "text-muted-foreground"
                  )}>
                    Generar Checklist de Apertura
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          {currentRun?.status === 'cancelled' && (
            <Button onClick={handleResume} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Continuar análisis
            </Button>
          )}
          
          {(progress?.isProcessing || isStarting) && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-muted-foreground"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar proceso
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
