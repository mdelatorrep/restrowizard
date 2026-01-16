import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';

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

export const useFeedbackData = () => {
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [campaigns, setCampaigns] = useState<FeedbackCampaign[]>([]);
  const [kpis, setKpis] = useState<FeedbackKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const calculateKPIs = (data: CustomerFeedback[]): FeedbackKPIs => {
    const total = data.length;
    if (total === 0) {
      return { totalFeedback: 0, avgRating: 0, positivePercent: 0, negativePercent: 0, responseRate: 0 };
    }

    const ratings = data.filter(f => f.rating).map(f => f.rating!);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    
    const positive = data.filter(f => f.sentiment_label === 'positive' || (f.rating && f.rating >= 4)).length;
    const negative = data.filter(f => f.sentiment_label === 'negative' || (f.rating && f.rating <= 2)).length;
    const responded = data.filter(f => f.responded).length;

    return {
      totalFeedback: total,
      avgRating: Math.round(avgRating * 10) / 10,
      positivePercent: Math.round((positive / total) * 100),
      negativePercent: Math.round((negative / total) * 100),
      responseRate: Math.round((responded / total) * 100),
    };
  };

  const fetchFeedback = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const feedbackData = (data || []) as unknown as CustomerFeedback[];
      setFeedback(feedbackData);
      setKpis(calculateKPIs(feedbackData));
      setHasData(feedbackData.length > 0);

      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('feedback_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setCampaigns((campaignsData || []) as unknown as FeedbackCampaign[]);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

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
      await fetchFeedback();
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
        .update({ 
          responded: true, 
          response_text: response, 
          responded_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Respuesta enviada', description: 'El cliente ha sido notificado' });
      await fetchFeedback();
    } catch (error) {
      console.error('Error responding to feedback:', error);
      toast({ title: 'Error', description: 'No se pudo enviar la respuesta', variant: 'destructive' });
    }
  };

  const createCampaign = async (campaign: Partial<FeedbackCampaign>) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('feedback_campaigns')
        .insert([{ ...campaign, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Campaña creada', description: 'Tu campaña de feedback está activa' });
      await fetchFeedback();
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({ title: 'Error', description: 'No se pudo crear la campaña', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [userId]);

  return {
    feedback,
    campaigns,
    kpis,
    loading,
    hasData,
    addFeedback,
    respondToFeedback,
    createCampaign,
    refetch: fetchFeedback,
  };
};
