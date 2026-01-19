import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

/**
 * Hook to fetch a single business project by ID
 */
export function useBusinessProject(projectId: string | null) {
  return useQuery({
    queryKey: ['business-project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('business_opening_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as BusinessProject;
    },
    enabled: !!projectId && projectId.length > 0,
  });
}

/**
 * Hook to fetch all analyses for a project
 */
export function useProjectAnalyses(projectId: string | null) {
  return useQuery({
    queryKey: ['project-analyses', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      console.log('[useProjectAnalyses] Fetching analyses for project:', projectId);
      const { data, error } = await supabase
        .from('opening_phase_analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('[useProjectAnalyses] Fetched analyses:', data?.length);
      return data as PhaseAnalysis[];
    },
    enabled: !!projectId && projectId.length > 0,
    staleTime: 0,
    refetchOnMount: true,
  });
}

/**
 * Hook to fetch the checklist for a project
 */
export function useProjectChecklist(projectId: string | null) {
  return useQuery({
    queryKey: ['project-checklist', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('opening_checklist_items')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!projectId && projectId.length > 0,
  });
}
