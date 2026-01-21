import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, CheckCircle2, Circle, AlertCircle, 
  Rocket, Scale, MapPin, ChefHat, Truck, Users, 
  Megaphone, TrendingUp, XCircle
} from 'lucide-react';
import { PhaseId, PHASES } from '@/hooks/useBusinessOpening';
import { BusinessProject } from '@/hooks/useBusinessProject';
import { cn } from '@/lib/utils';

interface AutomaticProcessingScreenProps {
  project: BusinessProject;
  onComplete: () => void;
  onCancel: () => void;
  analyzePhase: (project: BusinessProject, phase: PhaseId) => Promise<any>;
  generateChecklist: (project: BusinessProject) => Promise<any>;
  completedPhases: PhaseId[];
}

type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

interface PhaseState {
  id: PhaseId;
  status: ProcessingStatus;
  error?: string;
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
  analyzePhase,
  generateChecklist,
  completedPhases,
}: AutomaticProcessingScreenProps) {
  const [phases, setPhases] = useState<PhaseState[]>(() => 
    PHASES.map(p => ({
      id: p.id,
      status: completedPhases.includes(p.id) ? 'completed' : 'pending',
    }))
  );
  const [currentMessage, setCurrentMessage] = useState('');
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [checklistGenerated, setChecklistGenerated] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const isProcessingRef = useRef(false);
  const cancelledRef = useRef(false);

  const completedCount = phases.filter(p => p.status === 'completed').length;
  const totalPhases = PHASES.length;
  const overallProgress = ((completedCount + (isGeneratingChecklist ? 0.5 : 0) + (checklistGenerated ? 1 : 0)) / (totalPhases + 1)) * 100;

  const currentPhase = phases.find(p => p.status === 'processing');

  // Cycle through processing messages
  useEffect(() => {
    if (!currentPhase) return;
    
    const messages = PROCESSING_MESSAGES[currentPhase.id];
    let index = 0;
    setCurrentMessage(messages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setCurrentMessage(messages[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPhase?.id]);

  // Main processing loop
  useEffect(() => {
    if (isProcessingRef.current || isCancelled) return;
    
    const processAll = async () => {
      isProcessingRef.current = true;
      
      for (const phase of PHASES) {
        if (cancelledRef.current) break;
        
        // Skip already completed phases
        const currentState = phases.find(p => p.id === phase.id);
        if (currentState?.status === 'completed') continue;

        // Set phase as processing
        setPhases(prev => prev.map(p => 
          p.id === phase.id ? { ...p, status: 'processing' } : p
        ));

        try {
          await analyzePhase(project, phase.id);
          
          if (cancelledRef.current) break;
          
          // Mark as completed
          setPhases(prev => prev.map(p => 
            p.id === phase.id ? { ...p, status: 'completed' } : p
          ));
        } catch (error) {
          console.error(`Error analyzing phase ${phase.id}:`, error);
          setPhases(prev => prev.map(p => 
            p.id === phase.id ? { ...p, status: 'error', error: 'Error en el análisis' } : p
          ));
          // Continue with next phase even if one fails
        }
      }

      // Generate checklist if not cancelled
      if (!cancelledRef.current) {
        setIsGeneratingChecklist(true);
        try {
          await generateChecklist(project);
          setChecklistGenerated(true);
        } catch (error) {
          console.error('Error generating checklist:', error);
        }
        setIsGeneratingChecklist(false);
      }

      isProcessingRef.current = false;
      
      // Auto-complete if all done
      if (!cancelledRef.current) {
        // Small delay to show completion state
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    };

    processAll();
  }, []); // Run once on mount

  const handleCancel = () => {
    cancelledRef.current = true;
    setIsCancelled(true);
    onCancel();
  };

  const handleRetry = async (phaseId: PhaseId) => {
    setPhases(prev => prev.map(p => 
      p.id === phaseId ? { ...p, status: 'processing', error: undefined } : p
    ));

    try {
      await analyzePhase(project, phaseId);
      setPhases(prev => prev.map(p => 
        p.id === phaseId ? { ...p, status: 'completed' } : p
      ));
    } catch (error) {
      setPhases(prev => prev.map(p => 
        p.id === phaseId ? { ...p, status: 'error', error: 'Error en el análisis' } : p
      ));
    }
  };

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
            Preparando tu Plan de Apertura
          </h1>
          <p className="text-muted-foreground text-lg">
            {project.project_name} • {project.city}, {project.country}
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
            {(currentPhase || isGeneratingChecklist) && (
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
              {phases.map((phase) => {
                const phaseInfo = PHASES.find(p => p.id === phase.id)!;
                const Icon = PHASE_ICONS[phase.id];
                
                return (
                  <div
                    key={phase.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                      phase.status === 'processing' && "bg-primary/5 border border-primary/20",
                      phase.status === 'completed' && "bg-green-50 dark:bg-green-950/20",
                      phase.status === 'error' && "bg-destructive/5 border border-destructive/20",
                      phase.status === 'pending' && "bg-muted/30"
                    )}
                  >
                    {/* Status icon */}
                    <div className={cn(
                      "flex-shrink-0 p-2 rounded-full",
                      phase.status === 'processing' && "bg-primary/10",
                      phase.status === 'completed' && "bg-green-100 dark:bg-green-900/30",
                      phase.status === 'error' && "bg-destructive/10",
                      phase.status === 'pending' && "bg-muted"
                    )}>
                      {phase.status === 'pending' && (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      {phase.status === 'processing' && (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      )}
                      {phase.status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      {phase.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>

                    {/* Phase icon and name */}
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className={cn(
                        "h-5 w-5",
                        phase.status === 'completed' && "text-green-600 dark:text-green-400",
                        phase.status === 'processing' && "text-primary",
                        phase.status === 'error' && "text-destructive",
                        phase.status === 'pending' && "text-muted-foreground"
                      )} />
                      <div>
                        <span className={cn(
                          "font-medium",
                          phase.status === 'pending' && "text-muted-foreground"
                        )}>
                          {phaseInfo.name}
                        </span>
                        {phase.error && (
                          <p className="text-xs text-destructive mt-0.5">{phase.error}</p>
                        )}
                      </div>
                    </div>

                    {/* Retry button for errors */}
                    {phase.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(phase.id)}
                      >
                        Reintentar
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Checklist step */}
              <div
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                  isGeneratingChecklist && "bg-primary/5 border border-primary/20",
                  checklistGenerated && "bg-green-50 dark:bg-green-950/20",
                  !isGeneratingChecklist && !checklistGenerated && "bg-muted/30"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full",
                  isGeneratingChecklist && "bg-primary/10",
                  checklistGenerated && "bg-green-100 dark:bg-green-900/30",
                  !isGeneratingChecklist && !checklistGenerated && "bg-muted"
                )}>
                  {!isGeneratingChecklist && !checklistGenerated && (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  {isGeneratingChecklist && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {checklistGenerated && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <Rocket className={cn(
                    "h-5 w-5",
                    checklistGenerated && "text-green-600 dark:text-green-400",
                    isGeneratingChecklist && "text-primary",
                    !isGeneratingChecklist && !checklistGenerated && "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium",
                    !isGeneratingChecklist && !checklistGenerated && "text-muted-foreground"
                  )}>
                    Generar Checklist de Apertura
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancel button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-muted-foreground"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar proceso
          </Button>
        </div>
      </div>
    </div>
  );
}
