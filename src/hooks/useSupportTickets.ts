import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: number;
  type: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  order_id: string | null;
  assigned_to: string | null;
  resolution: string | null;
  satisfaction_rating: number | null;
  ai_category: string | null;
  ai_priority_suggestion: string | null;
  ai_response_draft: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  message: string;
  attachments: unknown[];
  created_at: string;
}

export interface SupportTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  subject_template: string | null;
  body_template: string;
  is_active: boolean;
  created_at: string;
}

export interface SupportKPIs {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: number;
  resolutionRate: number;
  satisfactionScore: number;
  urgentTickets: number;
}

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [templates, setTemplates] = useState<SupportTemplate[]>([]);
  const [kpis, setKpis] = useState<SupportKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const calculateKPIs = (data: SupportTicket[]): SupportKPIs => {
    const total = data.length;
    if (total === 0) {
      return { totalTickets: 0, openTickets: 0, avgResponseTime: 0, resolutionRate: 0, satisfactionScore: 0, urgentTickets: 0 };
    }

    const open = data.filter(t => ['open', 'in_progress', 'pending_customer'].includes(t.status)).length;
    const resolved = data.filter(t => ['resolved', 'closed'].includes(t.status)).length;
    const urgent = data.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    
    const ratings = data.filter(t => t.satisfaction_rating).map(t => t.satisfaction_rating!);
    const avgSatisfaction = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    
    const respondedTickets = data.filter(t => t.first_response_at);
    let avgResponseHours = 0;
    if (respondedTickets.length > 0) {
      const totalHours = respondedTickets.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const responded = new Date(t.first_response_at!).getTime();
        return sum + (responded - created) / (1000 * 60 * 60);
      }, 0);
      avgResponseHours = totalHours / respondedTickets.length;
    }

    return {
      totalTickets: total,
      openTickets: open,
      avgResponseTime: Math.round(avgResponseHours * 10) / 10,
      resolutionRate: Math.round((resolved / total) * 100),
      satisfactionScore: Math.round(avgSatisfaction * 10) / 10,
      urgentTickets: urgent,
    };
  };

  const fetchTickets = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const ticketsData = (data || []) as unknown as SupportTicket[];
      setTickets(ticketsData);
      setKpis(calculateKPIs(ticketsData));
      setHasData(ticketsData.length > 0);

      const { data: templatesData } = await supabase
        .from('support_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name');
      
      setTemplates((templatesData || []) as unknown as SupportTemplate[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: { type: string; subject: string; description: string; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([{ 
          type: ticketData.type,
          subject: ticketData.subject,
          description: ticketData.description,
          user_id: userId,
          priority: ticketData.priority as string | undefined,
          customer_name: ticketData.customer_name as string | undefined,
          customer_email: ticketData.customer_email as string | undefined,
          customer_phone: ticketData.customer_phone as string | undefined,
          order_id: ticketData.order_id as string | undefined,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Ticket creado', description: `Ticket #${data.ticket_number} registrado` });
      await fetchTickets();
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({ title: 'Error', description: 'No se pudo crear el ticket', variant: 'destructive' });
      return null;
    }
  };

  const updateTicket = async (id: string, updates: Partial<SupportTicket>) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Ticket actualizado', description: 'Los cambios han sido guardados' });
      await fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el ticket', variant: 'destructive' });
    }
  };

  const addMessage = async (ticketId: string, message: string, senderType: string = 'staff') => {
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert([{ ticket_id: ticketId, message, sender_type: senderType }]);

      if (error) throw error;

      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket && !ticket.first_response_at && senderType === 'staff') {
        await supabase
          .from('support_tickets')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', ticketId);
      }
      
      await fetchTickets();
    } catch (error) {
      console.error('Error adding message:', error);
      toast({ title: 'Error', description: 'No se pudo enviar el mensaje', variant: 'destructive' });
    }
  };

  const getTicketMessages = async (ticketId: string): Promise<TicketMessage[]> => {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return (data || []) as unknown as TicketMessage[];
  };

  const createTemplate = async (templateData: { name: string; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('support_templates')
        .insert([{ 
          name: templateData.name,
          user_id: userId,
          category: templateData.category as string | undefined,
          subject_template: templateData.subject_template as string | undefined,
          body_template: templateData.body_template as string | undefined,
          is_active: templateData.is_active as boolean | undefined,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Plantilla creada', description: 'La plantilla ha sido guardada' });
      await fetchTickets();
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({ title: 'Error', description: 'No se pudo crear la plantilla', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [userId]);

  return {
    tickets,
    templates,
    kpis,
    loading,
    hasData,
    createTicket,
    updateTicket,
    addMessage,
    getTicketMessages,
    createTemplate,
    refetch: fetchTickets,
  };
};
