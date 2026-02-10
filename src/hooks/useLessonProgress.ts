import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useLessonProgress = (courseId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const progress = useQuery({
    queryKey: ['lesson-progress', courseId, user?.id],
    enabled: !!user && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('course_id', courseId!);
      if (error) throw error;
      return data;
    },
  });

  const markComplete = useMutation({
    mutationFn: async ({ lessonId, quizScore }: { lessonId: string; quizScore?: number }) => {
      if (!user || !courseId) throw new Error('Missing data');
      const { error } = await supabase.from('lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        quiz_score: quizScore ?? null,
      }, { onConflict: 'user_id,lesson_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', courseId] });
      queryClient.invalidateQueries({ queryKey: ['learn-enrollments'] });
      toast.success('¡Lección completada!');
    },
  });

  const submitReview = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      if (!user || !courseId) throw new Error('Missing data');
      const { error } = await supabase.from('course_reviews').upsert({
        user_id: user.id,
        course_id: courseId,
        rating,
        comment: comment || null,
      }, { onConflict: 'user_id,course_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('¡Gracias por tu reseña!');
    },
  });

  const isLessonCompleted = (lessonId: string) =>
    progress.data?.some(p => p.lesson_id === lessonId && p.is_completed) || false;

  const completedCount = progress.data?.filter(p => p.is_completed).length || 0;

  return {
    progress: progress.data || [],
    isLoading: progress.isLoading,
    markComplete,
    submitReview,
    isLessonCompleted,
    completedCount,
  };
};
