import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

export interface CustomerProfile {
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  total_orders: number;
  total_spent: number;
  avg_ticket: number;
  last_visit: string | null;
  loyalty_points: number;
  loyalty_tier: string;
  total_reservations: number;
  avg_rating: number;
  feedback_count: number;
}

export interface CustomerOrder {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: any[];
  guests_count: number | null;
}

export interface CustomerFeedback {
  id: string;
  created_at: string;
  rating: number | null;
  comment: string | null;
  food_rating: number | null;
  service_rating: number | null;
  sentiment_label: string | null;
}

export interface CustomerReservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  special_requests: string | null;
}

export interface CustomerFullProfile extends CustomerProfile {
  orders: CustomerOrder[];
  feedback: CustomerFeedback[];
  reservations: CustomerReservation[];
  favoriteItems: { name: string; count: number }[];
  visitFrequency: 'new' | 'occasional' | 'regular' | 'vip';
}

export const useCustomerProfile = () => {
  const { userId } = useDataUserId();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<CustomerFullProfile | null>(null);

  const getCustomerProfile = useCallback(async (email: string): Promise<CustomerFullProfile | null> => {
    if (!userId || !email) return null;

    setLoading(true);

    try {
      // Get base profile from the database function
      const { data: profileData, error: profileError } = await supabase.rpc('get_customer_profile', {
        p_email: email,
        p_user_id: userId
      });

      if (profileError) throw profileError;

      const baseProfile = profileData?.[0] as CustomerProfile | undefined;

      if (!baseProfile) {
        setCurrentProfile(null);
        return null;
      }

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('restaurant_orders')
        .select('id, created_at, total, status, items, guests_count')
        .eq('user_id', userId)
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersError) console.error('Error fetching orders:', ordersError);

      // Fetch feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('customer_feedback')
        .select('id, created_at, rating, comment, food_rating, service_rating, sentiment_label')
        .eq('user_id', userId)
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(10);

      if (feedbackError) console.error('Error fetching feedback:', feedbackError);

      // Fetch reservations
      const { data: reservations, error: reservationsError } = await supabase
        .from('table_reservations')
        .select('id, reservation_date, reservation_time, party_size, status, special_requests')
        .eq('user_id', userId)
        .eq('customer_email', email)
        .order('reservation_date', { ascending: false })
        .limit(10);

      if (reservationsError) console.error('Error fetching reservations:', reservationsError);

      // Calculate favorite items from orders
      const itemCounts: Record<string, { name: string; count: number }> = {};
      if (orders) {
        for (const order of orders) {
          const orderItems = order.items as any[];
          if (Array.isArray(orderItems)) {
            for (const item of orderItems) {
              const key = item.name || item.menu_item_id;
              if (key) {
                if (!itemCounts[key]) {
                  itemCounts[key] = { name: item.name || key, count: 0 };
                }
                itemCounts[key].count += item.quantity || 1;
              }
            }
          }
        }
      }
      const favoriteItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Determine visit frequency
      let visitFrequency: 'new' | 'occasional' | 'regular' | 'vip' = 'new';
      if (baseProfile.total_orders >= 20) visitFrequency = 'vip';
      else if (baseProfile.total_orders >= 10) visitFrequency = 'regular';
      else if (baseProfile.total_orders >= 3) visitFrequency = 'occasional';

      const fullProfile: CustomerFullProfile = {
        ...baseProfile,
        orders: (orders || []).map(o => ({
          ...o,
          items: o.items as any[]
        })),
        feedback: feedback || [],
        reservations: reservations || [],
        favoriteItems,
        visitFrequency
      };

      setCurrentProfile(fullProfile);
      return fullProfile;
    } catch (error: any) {
      console.error('Error fetching customer profile:', error);
      toast({
        title: "Error al cargar perfil del cliente",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const searchCustomers = useCallback(async (query: string): Promise<{ email: string; name: string | null }[]> => {
    if (!userId || !query || query.length < 2) return [];

    try {
      // Search in multiple tables
      const [ordersResult, loyaltyResult, feedbackResult] = await Promise.all([
        supabase
          .from('restaurant_orders')
          .select('customer_email, customer_name')
          .eq('user_id', userId)
          .or(`customer_email.ilike.%${query}%,customer_name.ilike.%${query}%`)
          .limit(10),
        supabase
          .from('loyalty_customers')
          .select('customer_email, customer_name')
          .eq('user_id', userId)
          .or(`customer_email.ilike.%${query}%,customer_name.ilike.%${query}%`)
          .limit(10),
        supabase
          .from('customer_feedback')
          .select('customer_email, customer_name')
          .eq('user_id', userId)
          .or(`customer_email.ilike.%${query}%,customer_name.ilike.%${query}%`)
          .limit(10)
      ]);

      // Merge and dedupe results
      const customers = new Map<string, string | null>();

      ordersResult.data?.forEach(o => {
        if (o.customer_email && !customers.has(o.customer_email)) {
          customers.set(o.customer_email, o.customer_name);
        }
      });

      loyaltyResult.data?.forEach(l => {
        if (l.customer_email && !customers.has(l.customer_email)) {
          customers.set(l.customer_email, l.customer_name);
        }
      });

      feedbackResult.data?.forEach(f => {
        if (f.customer_email && !customers.has(f.customer_email)) {
          customers.set(f.customer_email, f.customer_name);
        }
      });

      return Array.from(customers.entries()).map(([email, name]) => ({ email, name }));
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }, [userId]);

  const clearProfile = useCallback(() => {
    setCurrentProfile(null);
  }, []);

  return {
    loading,
    currentProfile,
    getCustomerProfile,
    searchCustomers,
    clearProfile
  };
};
