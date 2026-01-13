import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useConsultantProfile } from './useConsultantProfile';

interface Client {
  id: string;
  consultant_id: string;
  client_user_id: string | null;
  status: 'prospect' | 'active' | 'paused' | 'churned' | 'completed';
  monthly_fee: number | null;
  services_included: string[] | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Direct restaurant info (for consultant-managed clients)
  restaurant_name: string | null;
  restaurant_city: string | null;
  restaurant_cuisine_type: string | null;
  restaurant_phone: string | null;
  restaurant_email: string | null;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  claimed_at: string | null;
  // Joined data (for claimed clients)
  business?: {
    name: string;
    city: string | null;
    cuisine_type: string | null;
    employee_count: number | null;
  } | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  diagnosis?: {
    overall_score: number;
    overall_level: string;
  } | null;
  alerts_count?: number;
}

interface CreateClientData {
  restaurant_name: string;
  restaurant_city?: string;
  restaurant_cuisine_type?: string;
  restaurant_phone?: string;
  restaurant_email?: string;
  monthly_fee?: number;
  services_included?: string[];
  notes?: string;
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
      // Fetch clients
      const { data: clientsData, error } = await supabase
        .from('consultant_clients')
        .select('*')
        .eq('consultant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich claimed clients with additional data
      const enrichedClients = await Promise.all(
        (clientsData || []).map(async (client) => {
          // If client has a linked user, get their data
          if (client.client_user_id) {
            const [businessResult, profileResult, diagnosisResult, alertsResult] = await Promise.all([
              supabase
                .from('restaurant_businesses')
                .select('name, city, cuisine_type, employee_count')
                .eq('owner_id', client.client_user_id)
                .maybeSingle(),
              supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('user_id', client.client_user_id)
                .maybeSingle(),
              supabase
                .from('maturity_diagnoses')
                .select('overall_score, overall_level')
                .eq('user_id', client.client_user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
              supabase
                .from('copilot_alerts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', client.client_user_id)
                .eq('is_dismissed', false)
            ]);

            return {
              ...client,
              business: businessResult.data,
              profile: profileResult.data,
              diagnosis: diagnosisResult.data,
              alerts_count: alertsResult.count || 0
            };
          }

          // For non-claimed clients, use direct restaurant info
          return {
            ...client,
            business: client.restaurant_name ? {
              name: client.restaurant_name,
              city: client.restaurant_city,
              cuisine_type: client.restaurant_cuisine_type,
              employee_count: null
            } : null,
            profile: null,
            diagnosis: null,
            alerts_count: 0
          };
        })
      );

      setClients(enrichedClients as Client[]);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Create a new client (consultant-managed, no user account needed)
  const createClient = async (data: CreateClientData) => {
    if (!profile?.id) return { error: 'No profile found' };

    try {
      const { data: newClient, error } = await supabase
        .from('consultant_clients')
        .insert({
          consultant_id: profile.id,
          restaurant_name: data.restaurant_name,
          restaurant_city: data.restaurant_city || null,
          restaurant_cuisine_type: data.restaurant_cuisine_type || null,
          restaurant_phone: data.restaurant_phone || null,
          restaurant_email: data.restaurant_email || null,
          monthly_fee: data.monthly_fee || null,
          services_included: data.services_included || null,
          notes: data.notes || null,
          status: 'prospect',
          client_user_id: null
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: "Cliente creado", 
        description: `${data.restaurant_name} ha sido agregado a tu portafolio.` 
      });
      
      await fetchClients();
      return { data: newClient, error: null };
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
  };

  // Send invitation to a client
  const sendInvitation = async (clientId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('consultant_clients')
        .update({ 
          restaurant_email: email,
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      // TODO: Actually send email via edge function
      toast({ 
        title: "Invitación enviada", 
        description: `Se envió la invitación a ${email}` 
      });
      
      await fetchClients();
      return { error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
  };

  // Get invitation link for a client
  const getInvitationLink = (client: Client) => {
    if (!client.invitation_token) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?invite=${client.invitation_token}`;
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
  const claimedClients = clients.filter(c => c.client_user_id !== null);
  const pendingClients = clients.filter(c => c.client_user_id === null);
  const totalMonthlyRevenue = activeClients.reduce((sum, c) => sum + (c.monthly_fee || 0), 0);

  return {
    clients,
    activeClients,
    prospects,
    claimedClients,
    pendingClients,
    totalMonthlyRevenue,
    loading,
    createClient,
    sendInvitation,
    getInvitationLink,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
};
