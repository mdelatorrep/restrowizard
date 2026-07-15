import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';
import { qk } from '@/lib/queryKeys';

export interface CustomerFeedback {
  id: string;
  user_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  source: string;
  rating: number | null;
  food_rating: number | null;
  service_rating: number | null;
  ambiance_rating: number | null;
  value_rating: number | null;
  comment: string | null;
  sentiment_score: number | null;
  sentiment_label: string | null;
  key_topics: string[];
  ai_response_suggestion: string | null;
  responded: boolean;
  response_text: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface FeedbackCampaign {
  id: string;
  user_id: string;
  name: string;
  qr_code_url: string | null;
  short_url: string | null;
  active: boolean;
  incentive: string | null;
  responses_count: number;
  created_at: string;
}

export interface FeedbackKPIs {
  totalFeedback: number;
  avgRating: number;
  positivePercent: number;
  negativePercent: number;
  responseRate: number;
}

const calculateKPIs = (data: CustomerFeedback[]): FeedbackKPIs => {
  const total = data.length;
  if (total === 0) {
    return { totalFeedback: 0, avgRating: 0, positivePercent: 0, negativePercent: 0, responseRate: 0 };
  }
  const ratings = data.filter((f) => f.rating).map((f) => f.rating!);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const positive = data.filter((f) => f.sentiment_label === 'positive' || (f.rating && f.rating >= 4)).length;
  const negative = data.filter((f) => f.sentiment_label === 'negative' || (f.rating && f.rating <= 2)).length;
  const responded = data.filter((f) => f.responded).length;
  return {
    totalFeedback: total,
    avgRating: Math.round(avgRating * 10) / 10,
    positivePercent: Math.round((positive / total) * 100),
    negativePercent: Math.round((negative / total) * 100),
    responseRate: Math.round((responded / total) * 100),
  };
};

export const useFeedbackData = () => {
  const { toast } = useToast();
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qk.feedback.all(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const feedbackData = (data || []) as unknown as CustomerFeedback[];
      const { data: campaignsData } = await supabase
        .from('feedback_campaigns')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      return {
        feedback: feedbackData,
        campaigns: (campaignsData || []) as unknown as FeedbackCampaign[],
        kpis: calculateKPIs(feedbackData),
        hasData: feedbackData.length > 0,
      };
    },
  });

  useEffect(() => { if (error) console.error('Error fetching feedback:', error); }, [error]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.feedback.all(userId) });

  const addFeedback = async (feedbackData: Partial<CustomerFeedback>) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('customer_feedback')
        .insert([{ ...feedbackData, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Feedback registrado', description: 'El comentario ha sido guardado' });
      await invalidate();
      return data;
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast({ title: 'Error', description: 'No se pudo registrar el feedback', variant: 'destructive' });
      return null;
    }
  };

  const respondToFeedback = async (id: string, response: string) => {
    try {
      const { error } = await supabase
        .from('customer_feedback')
        .update({ responded: true, response_text: response, responded_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Respuesta enviada', description: 'El cliente ha sido notificado' });
      await invalidate();
    } catch (error) {
      console.error('Error responding to feedback:', error);
      toast({ title: 'Error', description: 'No se pudo enviar la respuesta', variant: 'destructive' });
    }
  };

  const createCampaign = async (campaignData: { name: string; [key: string]: unknown }) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('feedback_campaigns')
        .insert([{
          name: campaignData.name,
          user_id: userId,
          qr_code_url: campaignData.qr_code_url as string | undefined,
          short_url: campaignData.short_url as string | undefined,
          active: campaignData.active as boolean | undefined,
          incentive: campaignData.incentive as string | undefined,
        }])
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Campaña creada', description: 'Tu campaña de feedback está activa' });
      await invalidate();
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({ title: 'Error', description: 'No se pudo crear la campaña', variant: 'destructive' });
      return null;
    }
  };

  return {
    feedback: data?.feedback ?? [],
    campaigns: data?.campaigns ?? [],
    kpis: data?.kpis ?? null,
    loading: isLoading,
    hasData: data?.hasData ?? false,
    addFeedback,
    respondToFeedback,
    createCampaign,
    refetch,
  };
};
