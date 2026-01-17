import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays, parseISO, isFuture, isPast } from 'date-fns';

export type RestaurantStage = 
  | 'conception'      // Planning phases 1-4
  | 'enablement'      // Phases 5-7, setting up
  | 'pre_opening'     // Progress 100% but opening_date > today
  | 'first_90_days'   // opening_date <= today AND < 90 days ago
  | 'normal_operation' // opening_date > 90 days ago
  | 'no_project';     // No business or project found

export interface LifecycleData {
  stage: RestaurantStage;
  isLoading: boolean;
  
  // Project data (for conception/enablement stages)
  project?: {
    id: string;
    name: string;
    currentPhase: string;
    progressPercentage: number;
    targetOpeningDate?: string;
  };
  
  // Business data (for pre_opening/first_90_days/normal stages)
  business?: {
    id: string;
    name: string;
    openingDate?: string;
  };
  
  // Computed values
  daysUntilOpening?: number;
  daysSinceOpening?: number;
  daysRemainingIn90?: number;
  progressIn90Days?: number;
}

// Phases that belong to each stage
const CONCEPTION_PHASES = ['legal_requirements', 'location_analysis', 'equipment_setup', 'supplier_network'];
const ENABLEMENT_PHASES = ['staffing_plan', 'marketing_launch', 'financial_projection'];

export function useRestaurantLifecycle(): LifecycleData {
  const { user } = useAuth();

  // Fetch active business opening project
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['business-opening-project', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_opening_projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch restaurant business
  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ['restaurant-business', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_businesses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const lifecycleData = useMemo<LifecycleData>(() => {
    const isLoading = loadingProject || loadingBusiness;

    if (isLoading) {
      return { stage: 'no_project', isLoading: true };
    }

    // If we have a business with an opening date, check the post-opening stages
    if (business?.opening_date) {
      const openingDate = parseISO(business.opening_date);
      const today = new Date();
      
      // Pre-opening: opening date is in the future
      if (isFuture(openingDate)) {
        const daysUntilOpening = differenceInDays(openingDate, today);
        return {
          stage: 'pre_opening',
          isLoading: false,
          business: {
            id: business.id,
            name: business.name,
            openingDate: business.opening_date,
          },
          project: project ? {
            id: project.id,
            name: project.project_name,
            currentPhase: project.current_phase || '',
            progressPercentage: project.progress_percentage || 0,
            targetOpeningDate: project.target_opening_date,
          } : undefined,
          daysUntilOpening,
        };
      }
      
      // Opening date has passed
      const daysSinceOpening = differenceInDays(today, openingDate);
      
      // First 90 days
      if (daysSinceOpening <= 90) {
        return {
          stage: 'first_90_days',
          isLoading: false,
          business: {
            id: business.id,
            name: business.name,
            openingDate: business.opening_date,
          },
          daysSinceOpening,
          daysRemainingIn90: 90 - daysSinceOpening,
          progressIn90Days: Math.round((daysSinceOpening / 90) * 100),
        };
      }
      
      // Normal operation (past 90 days)
      return {
        stage: 'normal_operation',
        isLoading: false,
        business: {
          id: business.id,
          name: business.name,
          openingDate: business.opening_date,
        },
        daysSinceOpening,
      };
    }

    // If we have a project but no business (or business without opening date)
    if (project) {
      const currentPhase = project.current_phase || 'legal_requirements';
      const progress = project.progress_percentage || 0;
      
      // Determine if we're in conception or enablement
      const isConception = CONCEPTION_PHASES.includes(currentPhase) && progress < 60;
      
      return {
        stage: isConception ? 'conception' : 'enablement',
        isLoading: false,
        project: {
          id: project.id,
          name: project.project_name,
          currentPhase,
          progressPercentage: progress,
          targetOpeningDate: project.target_opening_date,
        },
        daysUntilOpening: project.target_opening_date 
          ? differenceInDays(parseISO(project.target_opening_date), new Date())
          : undefined,
      };
    }

    // No project or business found
    return { stage: 'no_project', isLoading: false };
  }, [project, business, loadingProject, loadingBusiness]);

  return lifecycleData;
}

// Helper to get stage display info
export function getStageInfo(stage: RestaurantStage) {
  const stageInfo = {
    conception: {
      title: 'Concepción del Negocio',
      description: 'Planificación y diseño de tu restaurante',
      color: 'info',
      icon: 'Lightbulb',
    },
    enablement: {
      title: 'Habilitación',
      description: 'Permisos, equipamiento y preparación',
      color: 'warning',
      icon: 'Wrench',
    },
    pre_opening: {
      title: 'Pre-Apertura',
      description: 'Countdown hacia tu gran inauguración',
      color: 'success',
      icon: 'Rocket',
    },
    first_90_days: {
      title: 'Primeros 90 Días',
      description: 'Seguimiento y optimización inicial',
      color: 'primary',
      icon: 'TrendingUp',
    },
    normal_operation: {
      title: 'Operación Normal',
      description: 'Gestión continua de tu restaurante',
      color: 'muted',
      icon: 'Building2',
    },
    no_project: {
      title: 'Sin Proyecto',
      description: 'Comienza tu viaje gastronómico',
      color: 'muted',
      icon: 'Plus',
    },
  };
  
  return stageInfo[stage];
}
