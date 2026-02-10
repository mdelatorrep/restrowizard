import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useServiceRequests = (filters?: { category?: string; city?: string; status?: string }) => {
  return useQuery({
    queryKey: ['service-requests', filters],
    queryFn: async () => {
      let query = supabase.from('service_requests').select('*').order('created_at', { ascending: false });
      if (filters?.category && filters.category !== 'all') query = query.eq('category', filters.category as any);
      if (filters?.city && filters.city !== 'all') query = query.eq('city', filters.city);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useMyServiceRequests = () => {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['my-service-requests', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });
};

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      title: string; description?: string; category?: string;
      budget_min?: number; budget_max?: number; city?: string;
      urgency?: string; deadline?: string; requirements?: string[];
    }) => {
      const { error } = await supabase.from('service_requests').insert({
        ...data,
        user_id: session!.user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-service-requests'] });
      toast.success('Solicitud publicada exitosamente');
    },
    onError: () => toast.error('Error al publicar solicitud'),
  });
};

export const useServiceProposals = (requestId?: string) => {
  return useQuery({
    queryKey: ['service-proposals', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const { data, error } = await supabase
        .from('service_proposals')
        .select('*, service_providers(name, logo_url, average_rating, city, is_verified)')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
};

export const useCreateProposal = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      request_id: string; provider_id: string; message: string;
      price?: number; estimated_delivery_days?: number;
    }) => {
      const { error } = await supabase.from('service_proposals').insert({
        ...data,
        user_id: session!.user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['service-proposals', vars.request_id] });
      toast.success('Propuesta enviada exitosamente');
    },
    onError: () => toast.error('Error al enviar propuesta'),
  });
};

export const useProviderReviews = (providerId?: string) => {
  return useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('provider_reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
};

export const useProviderPortfolio = (providerId?: string) => {
  return useQuery({
    queryKey: ['provider-portfolio', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('provider_portfolio')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
};

export const useProviders = (filters?: { category?: string; city?: string; search?: string }) => {
  return useQuery({
    queryKey: ['service-providers-marketplace', filters],
    queryFn: async () => {
      let query = supabase.from('service_providers').select('*').eq('is_active', true).order('average_rating', { ascending: false });
      if (filters?.category && filters.category !== 'all') query = query.eq('category', filters.category as any);
      if (filters?.city && filters.city !== 'all') query = query.eq('city', filters.city);
      const { data, error } = await query;
      if (error) throw error;
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        return data.filter((p: any) =>
          p.name.toLowerCase().includes(s) || (p.specialty || '').toLowerCase().includes(s) || (p.headline || '').toLowerCase().includes(s)
        );
      }
      return data;
    },
  });
};

export const useProviderDetail = (providerId?: string) => {
  return useQuery({
    queryKey: ['provider-detail', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', providerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
};
