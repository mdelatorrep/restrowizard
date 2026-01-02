import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConsultantProfile } from './useConsultantProfile';

interface Invoice {
  id: string;
  consultant_id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_at: string | null;
  created_at: string;
  // Joined data
  client_name?: string;
  business_name?: string;
}

export const useConsultantBilling = () => {
  const { profile } = useConsultantProfile();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('consulting_invoices')
        .select(`
          *,
          consultant_clients!inner (
            client_user_id
          )
        `)
        .eq('consultant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with client names
      const enrichedInvoices = await Promise.all(
        (data || []).map(async (invoice: any) => {
          const clientUserId = invoice.consultant_clients?.client_user_id;
          
          const { data: businessData } = await supabase
            .from('restaurant_businesses')
            .select('name')
            .eq('owner_id', clientUserId)
            .single();

          // Check if overdue
          let status = invoice.status;
          if (status === 'pending' && invoice.due_date && new Date(invoice.due_date) < new Date()) {
            status = 'overdue';
          }

          return {
            ...invoice,
            status,
            business_name: businessData?.name || 'Cliente'
          };
        })
      );

      setInvoices(enrichedInvoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (data: {
    client_id: string;
    amount: number;
    description?: string;
    due_date?: string;
  }) => {
    if (!profile?.id) return { error: 'No profile found' };

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      const { data: invoice, error } = await supabase
        .from('consulting_invoices')
        .insert({
          consultant_id: profile.id,
          client_id: data.client_id,
          invoice_number: invoiceNumber,
          amount: data.amount,
          description: data.description || null,
          due_date: data.due_date || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Factura creada", description: `Número: ${invoiceNumber}` });
      await fetchInvoices();
      return { data: invoice, error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
  };

  const markAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('consulting_invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prev => prev.map(i => 
        i.id === invoiceId ? { ...i, status: 'paid' as const, paid_at: new Date().toISOString() } : i
      ));
      toast({ title: "Factura marcada como pagada" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const cancelInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('consulting_invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prev => prev.map(i => 
        i.id === invoiceId ? { ...i, status: 'cancelled' as const } : i
      ));
      toast({ title: "Factura cancelada" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchInvoices();
    }
  }, [profile?.id]);

  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPending = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
  const thisMonthPaid = paidInvoices
    .filter(i => {
      const paidDate = i.paid_at ? new Date(i.paid_at) : null;
      const now = new Date();
      return paidDate && paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + i.amount, 0);

  return {
    invoices,
    pendingInvoices,
    overdueInvoices,
    paidInvoices,
    totalPending,
    totalOverdue,
    thisMonthPaid,
    loading,
    createInvoice,
    markAsPaid,
    cancelInvoice,
    refetch: fetchInvoices
  };
};
