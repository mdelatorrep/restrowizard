import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { PHASES } from './useBusinessOpening';
import type { BusinessProject } from './useBusinessProject';

export interface AnalysisRun {
  id: string;
  project_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  current_phase: string | null;
  phases_completed: string[];
  phases_failed: string[];
  total_phases: number;
  error_message: string | null;
  include_checklist: boolean;
  checklist_generated: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to manage background analysis runs with polling
 */
export function useAnalysisRun(projectId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  // Query current run status
  const { data: currentRun, isLoading: loadingRun, refetch: refetchRun } = useQuery({
    queryKey: ['analysis-run', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('opening_analysis_runs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as AnalysisRun | null;
    },
    enabled: !!projectId,
    staleTime: 0,
  });

  // Polling while processing
  useEffect(() => {
    if (!currentRun) return;
    if (currentRun.status !== 'pending' && currentRun.status !== 'processing') return;
    
    console.log('[useAnalysisRun] Polling active for run:', currentRun.id, 'status:', currentRun.status);
    
    const interval = setInterval(() => {
      refetchRun();
      // Also refresh analyses to show new content
      queryClient.invalidateQueries({ queryKey: ['project-analyses', projectId] });
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [currentRun?.id, currentRun?.status, refetchRun, projectId, queryClient]);

  // Notify on completion
  useEffect(() => {
    if (!currentRun) return;
    
    if (currentRun.status === 'completed' && currentRun.completed_at) {
      // Only show toast if completed recently (within last 10 seconds)
      const completedAt = new Date(currentRun.completed_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - completedAt.getTime()) / 1000;
      
      if (diffSeconds < 10) {
        toast({
          title: '✅ Análisis completado',
          description: 'Tu plan de apertura está listo para revisar.',
        });
        
        // Refresh all related queries
        queryClient.invalidateQueries({ queryKey: ['project-analyses', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-checklist', projectId] });
        queryClient.invalidateQueries({ queryKey: ['business-project', projectId] });
      }
    }
  }, [currentRun?.status, currentRun?.completed_at, projectId, queryClient, toast]);

  // Start full analysis
  const startFullAnalysis = useCallback(async (project: BusinessProject) => {
    if (!project.id) return null;
    
    setIsStarting(true);
    
    try {
      console.log('[useAnalysisRun] Starting full analysis for project:', project.id);
      
      const response = await supabase.functions.invoke('business-opening-assistant', {
        body: {
          action: 'start_full_analysis',
          projectId: project.id,
          projectData: {
            id: project.id,
            projectName: project.project_name,
            businessType: project.business_type,
            cuisineType: project.cuisine_type,
            description: (project as any).description,
            city: project.city,
            country: project.country,
            neighborhood: project.neighborhood,
            estimatedBudget: project.estimated_budget,
          },
        },
      });
      
      if (response.error) throw response.error;
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start analysis');
      }
      
      console.log('[useAnalysisRun] Analysis started:', result);
      
      toast({
        title: '🚀 Análisis iniciado',
        description: result.status === 'resumed' 
          ? 'Continuando análisis previo...' 
          : 'El análisis se ejecutará en segundo plano.',
      });
      
      // Immediately refresh to get the new run
      await refetchRun();
      
      return result;
    } catch (error) {
      console.error('[useAnalysisRun] Error starting analysis:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el análisis. Intenta de nuevo.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [refetchRun, toast]);

  // Cancel current run
  const cancelRun = useCallback(async () => {
    if (!currentRun?.id) return;
    
    try {
      await supabase
        .from('opening_analysis_runs')
        .update({ status: 'cancelled' })
        .eq('id', currentRun.id);
      
      await refetchRun();
      
      toast({
        title: 'Análisis cancelado',
        description: 'Puedes continuar más tarde.',
      });
    } catch (error) {
      console.error('[useAnalysisRun] Error cancelling run:', error);
    }
  }, [currentRun?.id, refetchRun, toast]);

  // Check if there's an incomplete run that can be resumed
  const hasIncompleteRun = currentRun && 
    (currentRun.status === 'pending' || currentRun.status === 'processing') &&
    currentRun.phases_completed.length < PHASES.length;

  // Progress calculation
  const progress = currentRun ? {
    phasesCompleted: currentRun.phases_completed?.length || 0,
    totalPhases: PHASES.length,
    percentage: Math.round(((currentRun.phases_completed?.length || 0) / PHASES.length) * 100),
    currentPhase: currentRun.current_phase,
    checklistGenerated: currentRun.checklist_generated,
    isComplete: currentRun.status === 'completed',
    isProcessing: currentRun.status === 'pending' || currentRun.status === 'processing',
    isFailed: currentRun.status === 'failed',
  } : null;

  return {
    currentRun,
    loadingRun,
    isStarting,
    progress,
    hasIncompleteRun,
    startFullAnalysis,
    cancelRun,
    refetchRun,
  };
}
