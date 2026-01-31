import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PreOpeningTask {
  id: string;
  title: string;
  description: string | null;
  phase: string;
  category: 'operations' | 'marketing' | 'team' | 'legal' | 'planning';
  days_before_opening: number;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

// Phase to category mapping for display purposes
const PHASE_TO_CATEGORY: Record<string, PreOpeningTask['category']> = {
  planning: 'planning',
  legal: 'legal',
  legal_requirements: 'legal',
  location: 'operations',
  location_analysis: 'operations',
  equipment: 'operations',
  equipment_setup: 'operations',
  suppliers: 'operations',
  supplier_network: 'operations',
  staffing: 'team',
  staffing_plan: 'team',
  marketing: 'marketing',
  marketing_launch: 'marketing',
  pre_opening: 'operations',
  opening: 'operations',
  financial_projection: 'planning',
};

// Default generic tasks for pre-opening phase (fallback if no AI checklist)
const DEFAULT_PRE_OPENING_TASKS: Omit<PreOpeningTask, 'id' | 'is_completed' | 'completed_at'>[] = [
  // 30 days before
  { title: 'Confirmar todos los permisos', description: 'Verificar licencias sanitarias, comerciales y de bomberos', phase: 'legal', category: 'legal', days_before_opening: 30, sort_order: 1 },
  { title: 'Contratar personal completo', description: 'Tener el equipo completo contratado y listo', phase: 'staffing', category: 'team', days_before_opening: 30, sort_order: 2 },
  { title: 'Lanzar redes sociales', description: 'Crear expectativa con contenido teaser', phase: 'marketing', category: 'marketing', days_before_opening: 30, sort_order: 3 },
  
  // 14 days before
  { title: 'Prueba de menú completo', description: 'Cocinar todo el menú y ajustar tiempos', phase: 'pre_opening', category: 'operations', days_before_opening: 14, sort_order: 4 },
  { title: 'Capacitación del equipo', description: 'Entrenar en servicio, POS y protocolos', phase: 'staffing', category: 'team', days_before_opening: 14, sort_order: 5 },
  { title: 'Invitaciones para soft opening', description: 'Enviar invitaciones a familia y amigos', phase: 'marketing', category: 'marketing', days_before_opening: 14, sort_order: 6 },
  
  // 7 days before
  { title: 'Soft opening', description: 'Prueba con invitados selectos', phase: 'pre_opening', category: 'operations', days_before_opening: 7, sort_order: 7 },
  { title: 'Ajustes finales de menú', description: 'Incorporar feedback del soft opening', phase: 'pre_opening', category: 'operations', days_before_opening: 7, sort_order: 8 },
  { title: 'Comunicado de prensa', description: 'Enviar nota de prensa a medios locales', phase: 'marketing', category: 'marketing', days_before_opening: 7, sort_order: 9 },
  
  // 3 days before
  { title: 'Inventario completo', description: 'Stock de ingredientes para primera semana', phase: 'pre_opening', category: 'operations', days_before_opening: 3, sort_order: 10 },
  { title: 'Verificación de equipos', description: 'Revisar que todo funcione correctamente', phase: 'equipment', category: 'operations', days_before_opening: 3, sort_order: 11 },
  { title: 'Horarios de apertura publicados', description: 'Anunciar horarios en todas las plataformas', phase: 'marketing', category: 'marketing', days_before_opening: 3, sort_order: 12 },
  
  // 1 day before
  { title: 'Mise en place completo', description: 'Todo preparado para el primer servicio', phase: 'pre_opening', category: 'operations', days_before_opening: 1, sort_order: 13 },
  { title: 'Reunión de equipo final', description: 'Motivar y alinear expectativas', phase: 'staffing', category: 'team', days_before_opening: 1, sort_order: 14 },
  { title: 'Decoración de inauguración', description: 'Preparar el ambiente para el gran día', phase: 'pre_opening', category: 'operations', days_before_opening: 1, sort_order: 15 },
];

/**
 * Unified hook for pre-opening tasks.
 * Uses AI-generated checklist from opening_checklist_items as primary source.
 * Falls back to generic pre-opening tasks if no AI checklist exists.
 */
export function usePreOpeningTasks(projectId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI-generated checklist items for this project
  const { data: aiChecklist, isLoading: loadingAI } = useQuery({
    queryKey: ['project-checklist', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('opening_checklist_items')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Transform AI checklist items to PreOpeningTask format
  const tasks: PreOpeningTask[] = useMemo(() => {
    if (!aiChecklist || aiChecklist.length === 0) {
      // Return default tasks with generated IDs for fallback
      return DEFAULT_PRE_OPENING_TASKS.map((task, idx) => ({
        ...task,
        id: `default-${idx}`,
        is_completed: false,
        completed_at: null,
      }));
    }

    return aiChecklist.map((item, idx) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      phase: item.phase || 'planning',
      category: PHASE_TO_CATEGORY[item.phase?.toLowerCase() || 'planning'] || 'operations',
      days_before_opening: estimateDaysBeforeOpening(item.phase, item.sort_order),
      is_completed: item.is_completed || false,
      completed_at: item.completed_at || null,
      sort_order: item.sort_order || idx,
    }));
  }, [aiChecklist]);

  // Toggle task completion
  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      // Don't allow toggling default fallback tasks
      if (taskId.startsWith('default-')) {
        throw new Error('No hay checklist generado. Ejecuta el análisis primero.');
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const newCompleted = !task.is_completed;
      const { error } = await supabase
        .from('opening_checklist_items')
        .update({ 
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null 
        })
        .eq('id', taskId);

      if (error) throw error;
      return { taskId, completed: newCompleted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklist', projectId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  // Computed values
  const completedCount = tasks.filter(t => t.is_completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const hasAIChecklist = aiChecklist && aiChecklist.length > 0;

  const getOverdueTasks = useCallback((daysUntilOpening: number) => {
    return tasks.filter(t => !t.is_completed && t.days_before_opening >= daysUntilOpening);
  }, [tasks]);

  const getUpcomingTasks = useCallback((daysUntilOpening: number) => {
    return tasks.filter(t => !t.is_completed && t.days_before_opening < daysUntilOpening);
  }, [tasks]);

  return {
    tasks,
    isLoading: loadingAI,
    toggleTask: toggleTask.mutate,
    completedCount,
    progressPercent,
    getOverdueTasks,
    getUpcomingTasks,
    hasAIChecklist,
  };
}

/**
 * Estimate days before opening based on phase and sort order
 */
function estimateDaysBeforeOpening(phase: string | null, sortOrder: number): number {
  // Map phases to approximate timeline
  const phaseTimeline: Record<string, number> = {
    planning: 60,
    legal: 45,
    legal_requirements: 45,
    location: 40,
    location_analysis: 40,
    equipment: 30,
    equipment_setup: 30,
    suppliers: 25,
    supplier_network: 25,
    staffing: 21,
    staffing_plan: 21,
    marketing: 14,
    marketing_launch: 14,
    financial_projection: 30,
    pre_opening: 7,
    opening: 1,
  };

  const baseDays = phaseTimeline[phase?.toLowerCase() || 'planning'] || 30;
  
  // Adjust based on sort order within phase (earlier items = more days)
  return Math.max(1, baseDays - Math.floor(sortOrder / 3));
}
