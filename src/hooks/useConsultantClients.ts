import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useConsultantProfile } from './useConsultantProfile';

interface Client {
  id: string;
  consultant_id: string;
  client_user_id: string;
  status: 'prospect' | 'active' | 'paused' | 'churned' | 'completed';
  monthly_fee: number | null;
  services_included: string[] | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  business?: {
    name: string;
    city: string | null;
    cuisine_type: string | null;
    employee_count: number | null;
  };
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  diagnosis?: {
    overall_score: number;
    overall_level: string;
  };
  alerts_count?: number;
}

export const useConsultantClients = () => {
  const { user } = useAuthContext();
  const { profile } = useConsultantProfile();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch clients with related data
      const { data: clientsData, error } = await supabase
        .from('consultant_clients')
        .select('*')
        .eq('consultant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with business data
      const enrichedClients = await Promise.all(
        (clientsData || []).map(async (client) => {
          // Get business info
          const { data: businessData } = await supabase
            .from('restaurant_businesses')
            .select('name, city, cuisine_type, employee_count')
            .eq('owner_id', client.client_user_id)
            .single();

          // Get profile info
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', client.client_user_id)
            .single();

          // Get latest diagnosis
          const { data: diagnosisData } = await supabase
            .from('maturity_diagnoses')
            .select('overall_score, overall_level')
            .eq('user_id', client.client_user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get alerts count
          const { count: alertsCount } = await supabase
            .from('copilot_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', client.client_user_id)
            .eq('is_dismissed', false);

          return {
            ...client,
            business: businessData,
            profile: profileData,
            diagnosis: diagnosisData,
            alerts_count: alertsCount || 0
          };
        })
      );

      setClients(enrichedClients);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientEmail: string, monthlyFee?: number, services?: string[]) => {
    if (!profile?.id) return { error: 'No profile found' };

    try {
      // First find user by email - we need to search profiles/auth
      // For now, we'll create a prospect with placeholder
      const { data: userData } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('full_name', `%${clientEmail}%`)
        .limit(1)
        .single();

      if (!userData) {
        toast({ 
          title: "Usuario no encontrado", 
          description: "El usuario debe registrarse primero en RestroWizard",
          variant: "destructive" 
        });
        return { error: 'User not found' };
      }

      const { data, error } = await supabase
        .from('consultant_clients')
        .insert({
          consultant_id: profile.id,
          client_user_id: userData.user_id,
          status: 'prospect',
          monthly_fee: monthlyFee || null,
          services_included: services || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Cliente agregado", description: "El cliente ha sido agregado como prospecto." });
      await fetchClients();
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
  };

  const updateClient = async (clientId: string, updates: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('consultant_clients')
        .update(updates)
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
      toast({ title: "Cliente actualizado" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('consultant_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== clientId));
      toast({ title: "Cliente eliminado" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchClients();
    }
  }, [profile?.id]);

  const activeClients = clients.filter(c => c.status === 'active');
  const prospects = clients.filter(c => c.status === 'prospect');
  const totalMonthlyRevenue = activeClients.reduce((sum, c) => sum + (c.monthly_fee || 0), 0);

  return {
    clients,
    activeClients,
    prospects,
    totalMonthlyRevenue,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
};
