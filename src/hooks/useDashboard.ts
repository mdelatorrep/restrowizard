import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { qk } from '@/lib/queryKeys';

export interface DashboardStats {
  totalMenus: number;
  publishedMenus: number;
  totalJobs: number;
  activeJobs: number;
  totalEvents: number;
  upcomingEvents: number;
  totalNotifications: number;
  unreadNotifications: number;
}

export interface RecentActivity {
  type: 'menu' | 'job' | 'event' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface DashboardData {
  hasDiagnosis: boolean;
  userProfile: any;
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

const fetchDiagnosis = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('maturity_diagnoses')
    .select('id, overall_score, overall_level, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Error checking diagnosis:', error);
    return false;
  }
  return !!data;
};

const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const fetchStats = async (userId: string): Promise<DashboardStats> => {
  const [menusRes, jobsRes, eventsRes, notificationsRes] = await Promise.all([
    supabase.from('restaurant_menus').select('id, status').eq('user_id', userId),
    supabase.from('jobs').select('id, is_active').eq('employer_id', userId),
    supabase.from('events').select('id, event_date, status').eq('organizer_id', userId),
    supabase.from('notifications_log').select('id, is_read').eq('user_id', userId),
  ]);

  const menusData = menusRes.data;
  const jobsData = jobsRes.data;
  const eventsData = eventsRes.data;
  const notificationsData = notificationsRes.data;

  return {
    totalMenus: menusData?.length || 0,
    publishedMenus: menusData?.filter(m => m.status === 'published').length || 0,
    totalJobs: jobsData?.length || 0,
    activeJobs: jobsData?.filter(j => j.is_active).length || 0,
    totalEvents: eventsData?.length || 0,
    upcomingEvents: eventsData?.filter(e =>
      new Date(e.event_date) > new Date() && e.status !== 'cancelled'
    ).length || 0,
    totalNotifications: notificationsData?.length || 0,
    unreadNotifications: notificationsData?.filter(n => !n.is_read).length || 0,
  };
};

const fetchRecentActivity = async (userId: string): Promise<RecentActivity[]> => {
  const activities: RecentActivity[] = [];

  const [menusRes, jobsRes, eventsRes] = await Promise.all([
    supabase.from('restaurant_menus').select('name, status, updated_at')
      .eq('user_id', userId).order('updated_at', { ascending: false }).limit(3),
    supabase.from('jobs').select('title, is_active, created_at')
      .eq('employer_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('events').select('title, status, event_date, created_at')
      .eq('organizer_id', userId).order('created_at', { ascending: false }).limit(3),
  ]);

  menusRes.data?.forEach(menu => {
    activities.push({
      type: 'menu',
      title: `Menú: ${menu.name}`,
      description: `Estado: ${menu.status === 'published' ? 'Publicado' : 'Borrador'}`,
      timestamp: menu.updated_at,
      status: menu.status,
    });
  });

  jobsRes.data?.forEach(job => {
    activities.push({
      type: 'job',
      title: `Trabajo: ${job.title}`,
      description: `Estado: ${job.is_active ? 'Activo' : 'Inactivo'}`,
      timestamp: job.created_at,
      status: job.is_active ? 'active' : 'inactive',
    });
  });

  eventsRes.data?.forEach(event => {
    activities.push({
      type: 'event',
      title: `Evento: ${event.title}`,
      description: `Fecha: ${new Date(event.event_date).toLocaleDateString()}`,
      timestamp: event.created_at,
      status: event.status,
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, 10);
};

export const useDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.dashboard.overview(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<DashboardData> => {
      const uid = user!.id;
      const [hasDiagnosis, userProfile, stats, recentActivity] = await Promise.all([
        fetchDiagnosis(uid),
        fetchProfile(uid),
        fetchStats(uid),
        fetchRecentActivity(uid),
      ]);
      return { hasDiagnosis, userProfile, stats, recentActivity };
    },
  });

  const loadDashboardData = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.dashboard.overview(user?.id) }),
    [queryClient, user?.id]
  );

  const checkUserDiagnosis = useCallback(
    (userId: string) => fetchDiagnosis(userId),
    []
  );

  return {
    // null mientras carga (igual que antes: la UI distingue "no sé aún" de "no tiene")
    hasDiagnosis: data ? data.hasDiagnosis : null,
    loading,
    stats: data?.stats ?? null,
    recentActivity: data?.recentActivity ?? [],
    userProfile: data?.userProfile ?? null,
    checkUserDiagnosis,
    loadDashboardData,
  };
};
