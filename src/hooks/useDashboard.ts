import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useDashboard = () => {
  const [hasDiagnosis, setHasDiagnosis] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  const checkUserDiagnosis = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('maturity_diagnoses')
        .select('id, overall_score, overall_level, created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking diagnosis:', error);
        setHasDiagnosis(false);
        return false;
      }

      const hasCompletedDiagnosis = !!data;
      setHasDiagnosis(hasCompletedDiagnosis);
      return hasCompletedDiagnosis;
    } catch (error) {
      console.error('Error in checkUserDiagnosis:', error);
      setHasDiagnosis(false);
      return false;
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadDashboardStats = async (userId: string) => {
    try {
      // Get menus stats
      const { data: menusData } = await supabase
        .from('restaurant_menus')
        .select('id, status')
        .eq('restaurant_id', userId);

      // Get jobs stats
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, is_active')
        .eq('employer_id', userId);

      // Get events stats
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, event_date, status')
        .eq('organizer_id', userId);

      // Get notifications stats
      const { data: notificationsData } = await supabase
        .from('notifications_log')
        .select('id, clicked_at')
        .eq('user_id', userId);

      const totalMenus = menusData?.length || 0;
      const publishedMenus = menusData?.filter(m => m.status === 'published').length || 0;
      const totalJobs = jobsData?.length || 0;
      const activeJobs = jobsData?.filter(j => j.is_active).length || 0;
      const totalEvents = eventsData?.length || 0;
      const upcomingEvents = eventsData?.filter(e => 
        new Date(e.event_date) > new Date() && e.status !== 'cancelled'
      ).length || 0;
      const totalNotifications = notificationsData?.length || 0;
      const unreadNotifications = notificationsData?.filter(n => !n.clicked_at).length || 0;

      setStats({
        totalMenus,
        publishedMenus,
        totalJobs,
        activeJobs,
        totalEvents,
        upcomingEvents,
        totalNotifications,
        unreadNotifications,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
        variant: 'destructive',
      });
    }
  };

  const loadRecentActivity = async (userId: string) => {
    try {
      const activities: RecentActivity[] = [];

      // Get recent menus
      const { data: recentMenus } = await supabase
        .from('restaurant_menus')
        .select('name, status, updated_at')
        .eq('restaurant_id', userId)
        .order('updated_at', { ascending: false })
        .limit(3);

      recentMenus?.forEach(menu => {
        activities.push({
          type: 'menu',
          title: `Menú: ${menu.name}`,
          description: `Estado: ${menu.status === 'published' ? 'Publicado' : 'Borrador'}`,
          timestamp: menu.updated_at,
          status: menu.status,
        });
      });

      // Get recent jobs
      const { data: recentJobs } = await supabase
        .from('jobs')
        .select('title, is_active, created_at')
        .eq('employer_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      recentJobs?.forEach(job => {
        activities.push({
          type: 'job',
          title: `Trabajo: ${job.title}`,
          description: `Estado: ${job.is_active ? 'Activo' : 'Inactivo'}`,
          timestamp: job.created_at,
          status: job.is_active ? 'active' : 'inactive',
        });
      });

      // Get recent events
      const { data: recentEvents } = await supabase
        .from('events')
        .select('title, status, event_date, created_at')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      recentEvents?.forEach(event => {
        activities.push({
          type: 'event',
          title: `Evento: ${event.title}`,
          description: `Fecha: ${new Date(event.event_date).toLocaleDateString()}`,
          timestamp: event.created_at,
          status: event.status,
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      await Promise.all([
        checkUserDiagnosis(user.id),
        loadUserProfile(user.id),
        loadDashboardStats(user.id),
        loadRecentActivity(user.id),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    hasDiagnosis,
    loading,
    stats,
    recentActivity,
    userProfile,
    checkUserDiagnosis,
    loadDashboardData,
  };
};