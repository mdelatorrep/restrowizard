import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BusinessProject {
  id: string;
  user_id: string;
  project_name: string;
  business_type: string;
  cuisine_type?: string;
  city: string;
  country: string;
  neighborhood?: string;
  estimated_budget?: number;
  target_opening_date?: string;
  current_phase: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface PhaseAnalysis {
  id: string;
  project_id: string;
  phase: string;
  analysis_data: any;
  sources: string[];
  recommendations: any;
  estimated_cost?: number;
  estimated_time_days?: number;
  status: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  project_id: string;
  phase: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  sort_order: number;
  created_at: string;
}

export interface CreateProjectData {
  projectName: string;
  businessType: string;
  cuisineType?: string;
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

  // Fetch a specific project
  const useProject = (projectId: string) => {
    return useQuery({
      queryKey: ['business-project', projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('business_opening_projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        return data as BusinessProject;
      },
      enabled: !!projectId,
    });
  };

  // Fetch analyses for a project
  const useProjectAnalyses = (projectId: string) => {
    return useQuery({
      queryKey: ['project-analyses', projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('opening_phase_analyses')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as PhaseAnalysis[];
      },
      enabled: !!projectId,
    });
  };

  // Fetch checklist for a project
  const useProjectChecklist = (projectId: string) => {
    return useQuery({
      queryKey: ['project-checklist', projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('opening_checklist_items')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        return data as ChecklistItem[];
      },
      enabled: !!projectId,
    });
  };

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
    
    try {
      const response = await supabase.functions.invoke('business-opening-assistant', {
        body: {
          action: 'analyze_phase',
          projectData: {
            projectName: project.project_name,
            businessType: project.business_type,
            cuisineType: project.cuisine_type,
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

      // Save the analysis to the database
      const { data: analysis, error } = await supabase
        .from('opening_phase_analyses')
        .insert({
          project_id: project.id,
          phase,
          analysis_data: result.structured_data || { text: result.analysis },
          sources: result.sources || [],
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;

      // Force immediate refetch of analyses
      await queryClient.invalidateQueries({ queryKey: ['project-analyses', project.id] });
      await queryClient.refetchQueries({ queryKey: ['project-analyses', project.id] });
      
      toast({
        title: 'Análisis completado',
        description: `El análisis de ${PHASES.find(p => p.id === phase)?.name} está listo.`,
      });

      return analysis as PhaseAnalysis;
    } catch (error) {
      console.error('Error analyzing phase:', error);
      toast({
        title: 'Error en el análisis',
        description: 'No se pudo completar el análisis. Intenta de nuevo.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
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
  const generateChecklist = async (project: BusinessProject): Promise<ChecklistItem[] | null> => {
    setIsAnalyzing(true);

    try {
      const response = await supabase.functions.invoke('business-opening-assistant', {
        body: {
          action: 'generate_checklist',
          projectData: {
            projectName: project.project_name,
            businessType: project.business_type,
            cuisineType: project.cuisine_type,
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
        // Save checklist items to database
        const checklistItems = items.map((item: any, index: number) => ({
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

        queryClient.invalidateQueries({ queryKey: ['project-checklist', project.id] });
        
        toast({
          title: 'Checklist generado',
          description: `Se crearon ${savedItems.length} tareas para tu proyecto.`,
        });

        return savedItems as ChecklistItem[];
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
    onSuccess: (_, variables) => {
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
    useProject,
    useProjectAnalyses,
    useProjectChecklist,
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
