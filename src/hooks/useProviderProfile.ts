import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TablesUpdate } from '@/integrations/supabase/types';

export const useMyProviderProfile = () => {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['my-provider-profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });
};

export const useRegisterProvider = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      name: string; specialty?: string; category?: string; city: string;
      country?: string; description?: string; contact_email?: string;
      contact_phone?: string; website_url?: string; headline?: string;
      tags?: string[]; certifications?: string[]; service_areas?: string[];
    }) => {
      const { error } = await supabase.from('service_providers').insert({
        ...data,
        owner_id: session!.user.id,
        is_active: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      toast.success('Perfil de proveedor creado exitosamente');
    },
    onError: () => toast.error('Error al crear perfil'),
  });
};

export const useUpdateProviderProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & TablesUpdate<'service_providers'>) => {
      const { error } = await supabase.from('service_providers').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      toast.success('Perfil actualizado');
    },
    onError: () => toast.error('Error al actualizar perfil'),
  });
};

export const useCreatePortfolioItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      provider_id: string; title: string; description?: string;
      image_url?: string; client_name?: string; project_date?: string;
      category?: string;
    }) => {
      const { error } = await supabase.from('provider_portfolio').insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-portfolio'] });
      toast.success('Proyecto agregado al portafolio');
    },
    onError: () => toast.error('Error al agregar proyecto'),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      provider_id: string; request_id?: string; rating: number;
      quality_rating?: number; punctuality_rating?: number;
      communication_rating?: number; comment?: string;
    }) => {
      const { error } = await supabase.from('provider_reviews').insert({
        ...data,
        user_id: session!.user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['provider-reviews', vars.provider_id] });
      toast.success('Reseña publicada');
    },
    onError: () => toast.error('Error al publicar reseña'),
  });
};
