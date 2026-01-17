import React from 'react';
import { 
  Lightbulb, 
  Wrench, 
  Rocket, 
  TrendingUp, 
  Building2,
  HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type ClientStage = 
  | 'conception'
  | 'enablement'
  | 'pre_opening'
  | 'first_90_days'
  | 'normal_operation'
  | 'unknown';

interface ClientLifecycleIndicatorProps {
  stage: ClientStage;
  compact?: boolean;
  showTooltip?: boolean;
}

const STAGE_CONFIG = {
  conception: {
    icon: Lightbulb,
    label: 'Concepción',
    shortLabel: 'Concepción',
    color: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    description: 'Planificando el negocio',
  },
  enablement: {
    icon: Wrench,
    label: 'Habilitación',
    shortLabel: 'Habilitación',
    color: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    description: 'Preparando permisos y equipamiento',
  },
  pre_opening: {
    icon: Rocket,
    label: 'Pre-Apertura',
    shortLabel: 'Pre-Apertura',
    color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    description: 'Próximo a inaugurar',
  },
  first_90_days: {
    icon: TrendingUp,
    label: 'Primeros 90 Días',
    shortLabel: '90 Días',
    color: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    description: 'En fase de estabilización',
  },
  normal_operation: {
    icon: Building2,
    label: 'Operación Normal',
    shortLabel: 'Operación',
    color: 'bg-muted text-muted-foreground border-muted',
    description: 'Operando normalmente',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Sin determinar',
    shortLabel: '?',
    color: 'bg-muted/50 text-muted-foreground border-muted',
    description: 'Etapa no determinada',
  },
};

export const ClientLifecycleIndicator: React.FC<ClientLifecycleIndicatorProps> = ({
  stage,
  compact = false,
  showTooltip = true,
}) => {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.unknown;
  const Icon = config.icon;

  const content = (
    <Badge 
      variant="outline" 
      className={`${config.color} gap-1 ${compact ? 'px-1.5 py-0.5' : ''}`}
    >
      <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {!compact && <span className="text-xs">{config.shortLabel}</span>}
    </Badge>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

// Helper to determine client stage from diagnosis/business data
export function determineClientStage(client: {
  diagnosis?: { overall_score?: number } | null;
  business?: { opening_date?: string | null } | null;
}): ClientStage {
  // If they have an opening date, calculate based on that
  if (client.business?.opening_date) {
    const openingDate = new Date(client.business.opening_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - openingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'pre_opening';
    if (daysDiff <= 90) return 'first_90_days';
    return 'normal_operation';
  }
  
  // If they have a diagnosis, they're at least in operation
  if (client.diagnosis?.overall_score !== undefined && client.diagnosis.overall_score > 0) {
    return 'normal_operation';
  }
  
  return 'unknown';
}

export default ClientLifecycleIndicator;
