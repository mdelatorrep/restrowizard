import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PreOpeningTask {
  id: string;
  task_key: string;
  title: string;
  description: string | null;
  category: 'operations' | 'marketing' | 'team' | 'legal';
  days_before_opening: number;
  is_completed: boolean;
  completed_at: string | null;
}

const DEFAULT_TASKS: Omit<PreOpeningTask, 'id' | 'is_completed' | 'completed_at'>[] = [
  // 30 days before
  { task_key: 'permits', title: 'Confirmar todos los permisos', description: 'Verificar licencias sanitarias, comerciales y de bomberos', category: 'legal', days_before_opening: 30 },
  { task_key: 'hire_team', title: 'Contratar personal completo', description: 'Tener el equipo completo contratado y listo', category: 'team', days_before_opening: 30 },
  { task_key: 'social_launch', title: 'Lanzar redes sociales', description: 'Crear expectativa con contenido teaser', category: 'marketing', days_before_opening: 30 },
  
  // 14 days before
  { task_key: 'menu_test', title: 'Prueba de menú completo', description: 'Cocinar todo el menú y ajustar tiempos', category: 'operations', days_before_opening: 14 },
  { task_key: 'team_training', title: 'Capacitación del equipo', description: 'Entrenar en servicio, POS y protocolos', category: 'team', days_before_opening: 14 },
  { task_key: 'soft_opening_invites', title: 'Invitaciones para soft opening', description: 'Enviar invitaciones a familia y amigos', category: 'marketing', days_before_opening: 14 },
  
  // 7 days before
  { task_key: 'soft_opening', title: 'Soft opening', description: 'Prueba con invitados selectos', category: 'operations', days_before_opening: 7 },
  { task_key: 'menu_adjustments', title: 'Ajustes finales de menú', description: 'Incorporar feedback del soft opening', category: 'operations', days_before_opening: 7 },
  { task_key: 'press_release', title: 'Comunicado de prensa', description: 'Enviar nota de prensa a medios locales', category: 'marketing', days_before_opening: 7 },
  
  // 3 days before
  { task_key: 'inventory', title: 'Inventario completo', description: 'Stock de ingredientes para primera semana', category: 'operations', days_before_opening: 3 },
  { task_key: 'equipment_check', title: 'Verificación de equipos', description: 'Revisar que todo funcione correctamente', category: 'operations', days_before_opening: 3 },
  { task_key: 'publish_hours', title: 'Horarios de apertura publicados', description: 'Anunciar horarios en todas las plataformas', category: 'marketing', days_before_opening: 3 },
  
  // 1 day before
  { task_key: 'mise_en_place', title: 'Mise en place completo', description: 'Todo preparado para el primer servicio', category: 'operations', days_before_opening: 1 },
  { task_key: 'team_meeting', title: 'Reunión de equipo final', description: 'Motivar y alinear expectativas', category: 'team', days_before_opening: 1 },
  { task_key: 'decoration', title: 'Decoración de inauguración', description: 'Preparar el ambiente para el gran día', category: 'operations', days_before_opening: 1 },
];

export function usePreOpeningTasks(projectId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks from database
  const { data: savedTasks, isLoading } = useQuery({
    queryKey: ['pre-opening-tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_opening_tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('days_before_opening', { ascending: false });
      
      if (error) throw error;
      return data as PreOpeningTask[];
    },
    enabled: !!user,
  });

  // Initialize default tasks if none exist
  useEffect(() => {
    const initializeTasks = async () => {
      if (!user || isLoading || (savedTasks && savedTasks.length > 0)) return;

      const tasksToInsert = DEFAULT_TASKS.map(task => ({
        user_id: user.id,
        project_id: projectId || null,
        task_key: task.task_key,
        title: task.title,
        description: task.description,
        category: task.category,
        days_before_opening: task.days_before_opening,
        is_completed: false,
      }));

      const { error } = await supabase
        .from('pre_opening_tasks')
        .insert(tasksToInsert);

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['pre-opening-tasks', user.id] });
      }
    };

    initializeTasks();
  }, [user, savedTasks, isLoading, projectId, queryClient]);

  // Toggle task completion
  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      const task = savedTasks?.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const newCompleted = !task.is_completed;
      const { error } = await supabase
        .from('pre_opening_tasks')
        .update({ 
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null 
        })
        .eq('id', taskId);

      if (error) throw error;
      return { taskId, completed: newCompleted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-opening-tasks', user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  // Computed values
  const tasks = savedTasks || [];
  const completedCount = tasks.filter(t => t.is_completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const getOverdueTasks = useCallback((daysUntilOpening: number) => {
    return tasks.filter(t => !t.is_completed && t.days_before_opening >= daysUntilOpening);
  }, [tasks]);

  const getUpcomingTasks = useCallback((daysUntilOpening: number) => {
    return tasks.filter(t => !t.is_completed && t.days_before_opening < daysUntilOpening);
  }, [tasks]);

  return {
    tasks,
    isLoading,
    toggleTask: toggleTask.mutate,
    completedCount,
    progressPercent,
    getOverdueTasks,
    getUpcomingTasks,
  };
}
