import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useLearnData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tracks = useQuery({
    queryKey: ['learn-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_tracks')
        .select('*')
        .eq('is_published', true)
        .order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const courses = useQuery({
    queryKey: ['learn-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('is_published', true)
        .order('enrollments_count', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const myEnrollments = useQuery({
    queryKey: ['learn-enrollments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, training_courses(*)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  });

  const myCertificates = useQuery({
    queryKey: ['learn-certificates', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select('*, training_courses(*), learning_tracks(*)')
        .eq('user_id', user!.id)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const enrollInCourse = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Debes iniciar sesión');
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (existing) throw new Error('Ya estás inscrito en este curso');
      
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('course_id', courseId);
      
      const { error } = await supabase.from('course_enrollments').insert({
        user_id: user.id,
        course_id: courseId,
        total_lessons: lessons?.length || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learn-enrollments'] });
      toast.success('¡Te has inscrito exitosamente!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getTrackCourses = async (trackId: string) => {
    const { data, error } = await supabase
      .from('learning_track_courses')
      .select('*, training_courses(*)')
      .eq('track_id', trackId)
      .order('order_index');
    if (error) throw error;
    return data;
  };

  const getCourseLessons = async (courseId: string) => {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (error) throw error;
    return data || [];
  };

  const getCourseReviews = async (courseId: string) => {
    const { data, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  return {
    tracks: tracks.data || [],
    courses: courses.data || [],
    myEnrollments: myEnrollments.data || [],
    myCertificates: myCertificates.data || [],
    isLoading: tracks.isLoading || courses.isLoading,
    enrollInCourse,
    getTrackCourses,
    getCourseLessons,
    getCourseReviews,
  };
};
