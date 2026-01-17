import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';
import type { Json } from '@/integrations/supabase/types';

export interface SocialMention {
  id: string;
  user_id: string;
  platform: string;
  external_id: string | null;
  author_name: string | null;
  author_url: string | null;
  content: string | null;
  rating: number | null;
  sentiment_score: number | null;
  sentiment_label: string | null;
  key_topics: string[];
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  responded: boolean;
  response_text: string | null;
  fetched_at: string | null;
  published_at: string | null;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  account_name: string | null;
  account_url: string | null;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SentimentReport {
  id: string;
  user_id: string;
  report_date: string;
  total_mentions: number;
  avg_sentiment: number | null;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  trending_topics: string[];
  ai_summary: string | null;
  created_at: string;
}

export interface SocialKPIs {
  totalMentions: number;
  avgSentiment: number;
  positivePercent: number;
  negativePercent: number;
  responseRate: number;
  reputationScore: number;
}

export const useSocialMentions = () => {
  const [mentions, setMentions] = useState<SocialMention[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [reports, setReports] = useState<SentimentReport[]>([]);
  const [kpis, setKpis] = useState<SocialKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const calculateKPIs = (data: SocialMention[]): SocialKPIs => {
    const total = data.length;
    if (total === 0) {
      return { totalMentions: 0, avgSentiment: 0, positivePercent: 0, negativePercent: 0, responseRate: 0, reputationScore: 0 };
    }

    const sentiments = data.filter(m => m.sentiment_score !== null).map(m => m.sentiment_score!);
    const avgSentiment = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;
    
    const positive = data.filter(m => m.sentiment_label === 'positive').length;
    const negative = data.filter(m => m.sentiment_label === 'negative').length;
    const responded = data.filter(m => m.responded).length;
    
    const positiveRatio = positive / total;
    const reputationScore = Math.round(((positiveRatio * 50) + ((avgSentiment + 1) / 2 * 50)));

    return {
      totalMentions: total,
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      positivePercent: Math.round((positive / total) * 100),
      negativePercent: Math.round((negative / total) * 100),
      responseRate: Math.round((responded / total) * 100),
      reputationScore: Math.min(100, Math.max(0, reputationScore)),
    };
  };

  const fetchMentions = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_mentions')
        .select('*')
        .eq('user_id', userId)
        .order('published_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const mentionsData = (data || []) as unknown as SocialMention[];
      setMentions(mentionsData);
      setKpis(calculateKPIs(mentionsData));
      setHasData(mentionsData.length > 0);

      const { data: accountsData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('platform');
      
      setAccounts((accountsData || []) as unknown as SocialAccount[]);

      const { data: reportsData } = await supabase
        .from('sentiment_reports')
        .select('*')
        .eq('user_id', userId)
        .order('report_date', { ascending: false })
        .limit(30);
      
      setReports((reportsData || []) as unknown as SentimentReport[]);
    } catch (error) {
      console.error('Error fetching mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMention = async (mentionData: { platform: string; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('social_mentions')
        .insert([{ 
          platform: mentionData.platform,
          user_id: userId,
          external_id: mentionData.external_id as string | undefined,
          author_name: mentionData.author_name as string | undefined,
          content: mentionData.content as string | undefined,
          rating: mentionData.rating as number | undefined,
          sentiment_score: mentionData.sentiment_score as number | undefined,
          sentiment_label: mentionData.sentiment_label as string | undefined,
          key_topics: (mentionData.key_topics ?? null) as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchMentions();
      return data;
    } catch (error) {
      console.error('Error adding mention:', error);
      toast({ title: 'Error', description: 'No se pudo agregar la mención', variant: 'destructive' });
      return null;
    }
  };

  const respondToMention = async (id: string, response: string) => {
    try {
      const { error } = await supabase
        .from('social_mentions')
        .update({ responded: true, response_text: response })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Respuesta guardada', description: 'Tu respuesta ha sido registrada' });
      await fetchMentions();
    } catch (error) {
      console.error('Error responding to mention:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la respuesta', variant: 'destructive' });
    }
  };

  const addAccount = async (accountData: { platform: string; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .insert([{ 
          platform: accountData.platform,
          user_id: userId,
          account_name: accountData.account_name as string | undefined,
          account_url: accountData.account_url as string | undefined,
          is_active: accountData.is_active as boolean | undefined,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Cuenta conectada', description: 'Tu cuenta ha sido vinculada' });
      await fetchMentions();
      return data;
    } catch (error) {
      console.error('Error adding account:', error);
      toast({ title: 'Error', description: 'No se pudo conectar la cuenta', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    fetchMentions();
  }, [userId]);

  return {
    mentions,
    accounts,
    reports,
    kpis,
    loading,
    hasData,
    addMention,
    respondToMention,
    addAccount,
    refetch: fetchMentions,
  };
};
