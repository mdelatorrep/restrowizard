import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { pushDebugEvent } from '@/lib/debugEvents';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
// Re-export types from the new hook for backward compatibility
export type { BusinessProject, PhaseAnalysis, ChecklistItem } from './useBusinessProject';
import type { BusinessProject, PhaseAnalysis } from './useBusinessProject';

export interface CreateProjectData {
  projectName: string;
  businessType: string;
  cuisineType?: string;
  description?: string;
  city: string;
  country: string;
  neighborhood?: string;
  estimatedBudget?: number;
  targetOpeningDate?: string;
}

export const PHASES = [
  { id: 'legal_requirements', name: 'Requisitos Legales', icon: 'Scale' },
  { id: 'location_analysis', name: 'Análisis de Ubicación', icon: 'MapPin' },
  { id: 'equipment_setup', name: 'Equipamiento', icon: 'ChefHat' },
  { id: 'supplier_network', name: 'Red de Proveedores', icon: 'Truck' },
  { id: 'staffing_plan', name: 'Plan de Personal', icon: 'Users' },
  { id: 'marketing_launch', name: 'Estrategia de Lanzamiento', icon: 'Megaphone' },
  { id: 'financial_projection', name: 'Proyección Financiera', icon: 'TrendingUp' },
] as const;

export type PhaseId = typeof PHASES[number]['id'];

/**
 * Hook for business opening operations (mutations and list query)
 * For individual project data, use the dedicated hooks from useBusinessProject.ts
 */
export function useBusinessOpening() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch all projects for the user
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['business-projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_opening_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BusinessProject[];
    },
    enabled: !!user,
  });

  // Create a new project
  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: project, error } = await supabase
        .from('business_opening_projects')
        .insert({
          user_id: user.id,
          project_name: data.projectName,
          business_type: data.businessType,
          cuisine_type: data.cuisineType,
          description: data.description,
          city: data.city,
          country: data.country,
          neighborhood: data.neighborhood,
          estimated_budget: data.estimatedBudget,
          target_opening_date: data.targetOpeningDate,
        })
        .select()
        .single();

      if (error) throw error;
      return project as BusinessProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-projects'] });
      toast({
        title: 'Proyecto creado',
        description: 'Tu proyecto de apertura ha sido creado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el proyecto.',
        variant: 'destructive',
      });
      console.error('Error creating project:', error);
    },
  });

  // Analyze a phase
  const analyzePhase = async (project: BusinessProject, phase: PhaseId): Promise<PhaseAnalysis | null> => {
    setIsAnalyzing(true);

    const startedAt = Date.now();
    await pushDebugEvent(user?.id, 'opening', 'analyze_phase_start', {
      projectId: project.id,
      phase,
      startedAt,
    });

    try {
      console.log('[useBusinessOpening] Starting analysis for phase:', phase);

      const response = await supabase.functions.invoke('business-opening-assistant', {
        body: {
          action: 'analyze_phase',
          projectData: {
            projectName: project.project_name,
            businessType: project.business_type,
            cuisineType: project.cuisine_type,
            description: (project as any).description,
            city: project.city,
            country: project.country,
            neighborhood: project.neighborhood,
            estimatedBudget: project.estimated_budget,
          },
          phase,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      console.log('[useBusinessOpening] AI response received, saving to database');

      // Save the analysis to the database
      const { data: analysis, error } = await supabase
        .from('opening_phase_analyses')
        .upsert(
          {
            project_id: project.id,
            phase,
            analysis_data: {
              text: result.analysis,
              structured: result.structured_data || null,
            },
            sources: result.sources || [],
            status: 'completed',
          },
          {
            onConflict: 'project_id,phase',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) throw error;

      console.log('[useBusinessOpening] Analysis saved, updating cache for project:', project.id);

      // Update the cache immediately with the new analysis
      queryClient.setQueryData(['project-analyses', project.id], (old: PhaseAnalysis[] | undefined) => {
        const newAnalysis = analysis as PhaseAnalysis;
        if (!old) return [newAnalysis];
        // Replace existing analysis for this phase or add new one
        const filtered = old.filter((a) => a.phase !== phase);
        return [...filtered, newAnalysis];
      });

      // Persist progress_percentage + current_phase (fixes "progress bar not saving" on refresh)
      try {
        const updatedAnalyses =
          (queryClient.getQueryData(['project-analyses', project.id]) as PhaseAnalysis[] | undefined) ?? [];

        const completedPhases = PHASES.filter((p) =>
          updatedAnalyses.some((a) => a.phase === p.id && a.status === 'completed')
        ).length;

        const progress = Math.round((completedPhases / PHASES.length) * 100);
        const currentPhase = progress >= 100 ? 'completed' : phase;

        const { error: progressError } = await supabase
          .from('business_opening_projects')
          .update({ progress_percentage: progress, current_phase: currentPhase })
          .eq('id', project.id);

        if (progressError) {
          console.warn('[useBusinessOpening] Could not persist progress:', progressError);
        } else {
          queryClient.setQueryData(['business-project', project.id], (old: BusinessProject | null | undefined) => {
            if (!old) return old;
            return { ...old, progress_percentage: progress, current_phase: currentPhase };
          });

          queryClient.setQueryData(['business-projects', user?.id], (old: BusinessProject[] | undefined) => {
            if (!old) return old;
            return old.map((p) =>
              p.id === project.id ? { ...p, progress_percentage: progress, current_phase: currentPhase } : p
            );
          });
        }
      } catch (e) {
        console.warn('[useBusinessOpening] Progress persistence failed:', e);
      }

      // Also invalidate to ensure fresh data on next navigation
      await queryClient.invalidateQueries({ queryKey: ['project-analyses', project.id] });

      toast({
        title: 'Análisis completado',
        description: `El análisis de ${PHASES.find((p) => p.id === phase)?.name} está listo.`,
      });

      await pushDebugEvent(user?.id, 'opening', 'analyze_phase_success', {
        projectId: project.id,
        phase,
        ms: Date.now() - startedAt,
      });

      return analysis as PhaseAnalysis;
    } catch (error: any) {
      console.error('Error analyzing phase:', error);

      await pushDebugEvent(user?.id, 'opening', 'analyze_phase_error', {
        projectId: project.id,
        phase,
        ms: Date.now() - startedAt,
        error: error?.message ?? String(error),
      });

      toast({
        title: 'Error en el análisis',
        description: 'No se pudo completar el análisis. Intenta de nuevo.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);

      await pushDebugEvent(user?.id, 'opening', 'analyze_phase_end', {
        projectId: project.id,
        phase,
        ms: Date.now() - startedAt,
      });
    }
  };

  // Ask a question to the assistant
  const askAssistant = async (project: BusinessProject, question: string): Promise<string | null> => {
    setIsAnalyzing(true);

    try {
      const response = await supabase.functions.invoke('business-opening-assistant', {
        body: {
          action: 'ask_question',
          projectData: {
            projectName: project.project_name,
            businessType: project.business_type,
            cuisineType: project.cuisine_type,
            description: (project as any).description,
            city: project.city,
            country: project.country,
            neighborhood: project.neighborhood,
            estimatedBudget: project.estimated_budget,
          },
          question,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || 'Query failed');
      }

      return result.analysis;
    } catch (error) {
      console.error('Error asking assistant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar tu pregunta.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate checklist
  const generateChecklist = async (project: BusinessProject) => {
    setIsAnalyzing(true);

    try {
      // First, delete existing checklist items for this project to avoid duplicates
      const { error: deleteError } = await supabase
        .from('opening_checklist_items')
        .delete()
        .eq('project_id', project.id);

      if (deleteError) {
        console.warn('Could not clear existing checklist:', deleteError);
      }

      const response = await supabase.functions.invoke('business-opening-assistant', {
        body: {
          action: 'generate_checklist',
          projectData: {
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
        throw new Error(result.error || 'Checklist generation failed');
      }

      // Parse the checklist items from the response
      let items: any[] = [];
      if (result.structured_data?.items) {
        items = result.structured_data.items;
      } else if (Array.isArray(result.structured_data)) {
        items = result.structured_data;
      }

      if (items.length > 0) {
        // Deduplicate items by title (case-insensitive)
        const seenTitles = new Set<string>();
        const uniqueItems = items.filter((item: any) => {
          const normalizedTitle = item.title?.toLowerCase().trim();
          if (seenTitles.has(normalizedTitle)) {
            return false;
          }
          seenTitles.add(normalizedTitle);
          return true;
        });

        // Save checklist items to database
        const checklistItems = uniqueItems.map((item: any, index: number) => ({
          project_id: project.id,
          phase: item.phase || 'planning',
          title: item.title,
          description: item.description,
          sort_order: item.sortOrder || index,
        }));

        const { data: savedItems, error } = await supabase
          .from('opening_checklist_items')
          .insert(checklistItems)
          .select();

        if (error) throw error;

        // Update the cache
        queryClient.setQueryData(['project-checklist', project.id], savedItems);
        
        toast({
          title: 'Checklist generado',
          description: `Se crearon ${savedItems.length} tareas para tu proyecto.`,
        });

        return savedItems;
      }

      return null;
    } catch (error) {
      console.error('Error generating checklist:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el checklist.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle checklist item
  const toggleChecklistItem = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('opening_checklist_items')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklist'] });
    },
  });

  // Update project progress
  const updateProgress = useMutation({
    mutationFn: async ({ projectId, progress, phase }: { projectId: string; progress: number; phase?: string }) => {
      const updates: Partial<BusinessProject> = { progress_percentage: progress };
      if (phase) updates.current_phase = phase;

      const { error } = await supabase
        .from('business_opening_projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-projects'] });
      queryClient.invalidateQueries({ queryKey: ['business-project'] });
    },
  });

  // Delete project
  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('business_opening_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-projects'] });
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado.',
      });
    },
  });

  return {
    projects,
    loadingProjects,
    isAnalyzing,
    createProject,
    analyzePhase,
    askAssistant,
    generateChecklist,
    toggleChecklistItem,
    updateProgress,
    deleteProject,
    PHASES,
  };
}
