import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Job = Tables<'jobs'>;
export type JobInsert = TablesInsert<'jobs'>;
export type JobUpdate = TablesUpdate<'jobs'>;

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
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category as Job['category']);
      }
      
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type as Job['job_type']);
      }
      
      if (filters?.experience_level) {
        query = query.eq('experience_level', filters.experience_level as Job['experience_level']);
      }
      
      if (filters?.salary_min) {
        query = query.gte('salary_min', filters.salary_min);
      }
      
      if (filters?.salary_max) {
        query = query.lte('salary_max', filters.salary_max);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data || [];
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
      
      return data;
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

  const createJob = async (jobData: Omit<JobInsert, 'id' | 'views_count' | 'applications_count' | 'created_at' | 'updated_at'>) => {
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

      return data;
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

  const updateJob = async (jobId: string, updates: JobUpdate) => {
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

      return data;
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
      
      return data || [];
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
