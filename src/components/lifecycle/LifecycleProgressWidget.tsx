import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb, 
  Wrench, 
  Rocket, 
  TrendingUp, 
  Building2,
  ChevronRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRestaurantLifecycle, RestaurantStage } from '@/hooks/useRestaurantLifecycle';

const STAGES_ORDER: RestaurantStage[] = [
  'conception',
  'enablement', 
  'pre_opening',
  'first_90_days',
  'normal_operation'
];

const STAGE_CONFIG = {
  conception: {
    icon: Lightbulb,
    label: 'Concepción',
    color: 'bg-blue-500',
    path: '/r/new-business',
  },
  enablement: {
    icon: Wrench,
    label: 'Habilitación',
    color: 'bg-amber-500',
    path: '/r/new-business',
  },
  pre_opening: {
    icon: Rocket,
    label: 'Pre-Apertura',
    color: 'bg-emerald-500',
    path: '/r/pre-opening',
  },
  first_90_days: {
    icon: TrendingUp,
    label: '90 Días',
    color: 'bg-purple-500',
    path: '/r/first-90-days',
  },
  normal_operation: {
    icon: Building2,
    label: 'Operación',
    color: 'bg-muted-foreground',
    path: '/r/dashboard',
  },
  no_project: {
    icon: Lightbulb,
    label: 'Inicio',
    color: 'bg-muted',
    path: '/r/onboarding',
  },
};

interface LifecycleProgressWidgetProps {
  compact?: boolean;
}

export const LifecycleProgressWidget: React.FC<LifecycleProgressWidgetProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const lifecycle = useRestaurantLifecycle();

  if (lifecycle.isLoading) {
    return (
      <div className="p-3 rounded-lg border border-border/50 bg-muted/20 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2 mb-2" />
        <div className="h-2 bg-muted rounded w-full" />
      </div>
    );
  }

  const currentStageIndex = STAGES_ORDER.indexOf(lifecycle.stage);
  const overallProgress = lifecycle.stage === 'no_project' 
    ? 0 
    : Math.round(((currentStageIndex + 1) / STAGES_ORDER.length) * 100);

  const stageConfig = STAGE_CONFIG[lifecycle.stage];
  const StageIcon = stageConfig.icon;

  // Get contextual info based on stage
  const getContextualInfo = () => {
    if (lifecycle.stage === 'pre_opening' && lifecycle.daysUntilOpening !== undefined) {
      return `${lifecycle.daysUntilOpening} días para abrir`;
    }
    if (lifecycle.stage === 'first_90_days' && lifecycle.daysRemainingIn90 !== undefined) {
      return `Día ${lifecycle.daysSinceOpening} de 90`;
    }
    if (lifecycle.stage === 'conception' || lifecycle.stage === 'enablement') {
      return `${lifecycle.project?.progressPercentage || 0}% completado`;
    }
    return null;
  };

  const contextInfo = getContextualInfo();

  if (compact) {
    return (
      <div 
        className="p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
        onClick={() => navigate(stageConfig.path)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md ${stageConfig.color}/20`}>
            <StageIcon className={`h-4 w-4 ${stageConfig.color.replace('bg-', 'text-')}`} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Mi Ciclo</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{stageConfig.label}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        {contextInfo && (
          <p className="text-xs text-muted-foreground mt-1">{contextInfo}</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Ciclo de Vida
        </h3>
        <Badge variant="outline" className="text-xs">
          {overallProgress}%
        </Badge>
      </div>

      {/* Stage Progress */}
      <div className="space-y-3">
        {STAGES_ORDER.map((stage, index) => {
          const config = STAGE_CONFIG[stage];
          const Icon = config.icon;
          const isCompleted = index < currentStageIndex;
          const isCurrent = stage === lifecycle.stage;

          return (
            <div key={stage} className="flex items-center gap-3">
              <div className={`
                p-1.5 rounded-full flex-shrink-0
                ${isCompleted ? 'bg-success text-success-foreground' : 
                  isCurrent ? `${config.color} text-white` : 
                  'bg-muted text-muted-foreground'}
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {config.label}
                </p>
              </div>
              {isCurrent && contextInfo && (
                <span className="text-xs text-primary whitespace-nowrap">
                  {contextInfo}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <Progress value={overallProgress} className="h-1.5" />

      {/* Action Button */}
      <Button 
        size="sm" 
        variant="outline" 
        className="w-full gap-2"
        onClick={() => navigate(stageConfig.path)}
      >
        Ver {stageConfig.label}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LifecycleProgressWidget;
