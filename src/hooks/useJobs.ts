import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  job_category: 'kitchen' | 'service' | 'management' | 'administration' | 'marketing' | 'finance' | 'maintenance';
  experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
  location: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  benefits?: string[];
  skills_required?: string[];
  restaurant_name: string;
  application_deadline?: string;
  start_date?: string;
  is_active: boolean;
  is_featured: boolean;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobFilters {
  search?: string;
  location?: string;
  category?: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
}

export const useJobs = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getJobs = async (filters?: JobFilters) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,restaurant_name.ilike.%${filters.search}%`);
      }
      
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters?.category) {
        query = query.eq('job_category', filters.category as any);
      }
      
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type as any);
      }
      
      if (filters?.experience_level) {
        query = query.eq('experience_level', filters.experience_level as any);
      }
      
      if (filters?.salary_min) {
        query = query.gte('salary_min', filters.salary_min);
      }
      
      if (filters?.salary_max) {
        query = query.lte('salary_max', filters.salary_max);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as Job[];
    } catch (error: any) {
      toast({
        title: "Error al cargar empleos",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getJobById = async (jobId: string) => {
    try {
      setLoading(true);
      
      // Increment view count
      await supabase.rpc('increment_job_views', { job_id: jobId });
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      return data as Job;
    } catch (error: any) {
      toast({
        title: "Error al cargar empleo",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: Omit<Job, 'id' | 'views_count' | 'applications_count' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "¡Empleo publicado!",
        description: "Tu oferta de empleo ha sido publicada exitosamente.",
      });

      return data as Job;
    } catch (error: any) {
      toast({
        title: "Error al publicar empleo",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Empleo actualizado",
        description: "La oferta de empleo ha sido actualizada correctamente.",
      });

      return data as Job;
    } catch (error: any) {
      toast({
        title: "Error al actualizar empleo",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Empleo eliminado",
        description: "La oferta de empleo ha sido eliminada correctamente.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error al eliminar empleo",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getMyJobs = async (employerId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', employerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Job[];
    } catch (error: any) {
      toast({
        title: "Error al cargar mis empleos",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getMyJobs,
  };
};