import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConsultantProfile } from '@/hooks/useConsultantProfile';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/queryKeys';
import type { TablesUpdate } from '@/integrations/supabase/types';

export interface QuotationMenuItem {
  id?: string;
  quotation_id?: string;
  menu_item_id?: string | null;
  category: string;
  item_name: string;
  item_description?: string;
  price_per_person: number;
  quantity: number;
  is_included: boolean;
  notes?: string;
}

export interface QuotationService {
  id?: string;
  quotation_id?: string;
  service_provider_id?: string | null;
  service_type: string;
  service_name: string;
  service_description?: string;
  price: number;
  duration_hours?: number;
  provider_name?: string;
  provider_contact?: string;
  notes?: string;
}

export interface QuotationGalleryItem {
  id?: string;
  quotation_id?: string;
  image_url: string;
  caption?: string;
  display_order: number;
}

export interface Quotation {
  id: string;
  consultant_id: string;
  restaurant_id?: string | null;
  zone_id?: string | null;
  client_type: string;
  client_company?: string;
  client_contact_name: string;
  client_email?: string;
  client_phone?: string;
  event_name: string;
  event_type: string;
  event_date?: string;
  event_end_date?: string;
  guest_count: number;
  event_duration_hours: number;
  event_description?: string;
  venue_cost: number;
  menu_cost_per_person: number;
  services_cost: number;
  additional_costs: number;
  discount_percentage: number;
  subtotal: number;
  total_amount: number;
  profit_margin_percentage: number;
  status: string;
  public_slug?: string;
  valid_until?: string;
  notes?: string;
  internal_notes?: string;
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  // Related data
  menu_items?: QuotationMenuItem[];
  services?: QuotationService[];
  gallery?: QuotationGalleryItem[];
  restaurant?: { id: string; name: string };
  zone?: { id: string; name: string };
}

export interface QuotationFormData {
  restaurant_id?: string | null;
  zone_id?: string | null;
  client_type: string;
  client_company?: string;
  client_contact_name: string;
  client_email?: string;
  client_phone?: string;
  event_name: string;
  event_type: string;
  event_date?: string;
  event_end_date?: string;
  guest_count: number;
  event_duration_hours: number;
  event_description?: string;
  venue_cost: number;
  menu_cost_per_person: number;
  services_cost: number;
  additional_costs: number;
  discount_percentage: number;
  profit_margin_percentage: number;
  valid_until?: string;
  notes?: string;
  internal_notes?: string;
  menu_items: QuotationMenuItem[];
  services: QuotationService[];
  gallery: QuotationGalleryItem[];
}

export function useQuotations() {
  const { profile } = useConsultantProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading: loading } = useQuery({
    queryKey: qk.consultant.quotations(profile?.id),
    enabled: !!profile?.id,
    queryFn: async (): Promise<Quotation[]> => {
      const { data, error } = await supabase
        .from('event_quotations')
        .select(`
          *,
          restaurant:restaurant_businesses(id, name),
          zone:restaurant_zones(id, name)
        `)
        .eq('consultant_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotations:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las cotizaciones',
          variant: 'destructive',
        });
        throw error;
      }

      return (data || []) as Quotation[];
    },
  });

  const fetchQuotations = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.consultant.quotations(profile?.id) }),
    [queryClient, profile?.id]
  );

  const createQuotation = async (data: QuotationFormData): Promise<string | null> => {
    if (!profile?.id) return null;

    // Si falla algún hijo (menú/servicios/galería) hay que borrar la cotización
    // para no dejar un huérfano incompleto. El fix definitivo es una RPC
    // transaccional; esto es compensación del lado del cliente.
    let createdId: string | null = null;

    try {
      // Calculate totals
      const menuTotal = data.menu_cost_per_person * data.guest_count;
      const servicesTotal = data.services.reduce((sum, s) => sum + (s.price || 0), 0);
      const subtotal = data.venue_cost + menuTotal + servicesTotal + data.additional_costs;
      const discountAmount = subtotal * (data.discount_percentage / 100);
      const totalBeforeMargin = subtotal - discountAmount;
      const margin = totalBeforeMargin * (data.profit_margin_percentage / 100);
      const totalAmount = totalBeforeMargin + margin;

      const { data: quotation, error: quotationError } = await supabase
        .from('event_quotations')
        .insert({
          consultant_id: profile.id,
          restaurant_id: data.restaurant_id,
          zone_id: data.zone_id,
          client_type: data.client_type,
          client_company: data.client_company,
          client_contact_name: data.client_contact_name,
          client_email: data.client_email,
          client_phone: data.client_phone,
          event_name: data.event_name,
          event_type: data.event_type,
          event_date: data.event_date,
          event_end_date: data.event_end_date,
          guest_count: data.guest_count,
          event_duration_hours: data.event_duration_hours,
          event_description: data.event_description,
          venue_cost: data.venue_cost,
          menu_cost_per_person: data.menu_cost_per_person,
          services_cost: servicesTotal,
          additional_costs: data.additional_costs,
          discount_percentage: data.discount_percentage,
          subtotal: subtotal,
          total_amount: totalAmount,
          profit_margin_percentage: data.profit_margin_percentage,
          valid_until: data.valid_until,
          notes: data.notes,
          internal_notes: data.internal_notes,
        })
        .select()
        .single();

      if (quotationError) throw quotationError;
      createdId = quotation.id;

      // Insert menu items
      if (data.menu_items.length > 0) {
        const menuItems = data.menu_items.map((item) => ({
          quotation_id: quotation.id,
          menu_item_id: item.menu_item_id,
          category: item.category,
          item_name: item.item_name,
          item_description: item.item_description,
          price_per_person: item.price_per_person,
          quantity: item.quantity,
          is_included: item.is_included,
          notes: item.notes,
        }));

        const { error: menuError } = await supabase
          .from('quotation_menu_items')
          .insert(menuItems);

        // Una cotización sin su menú es peor que ninguna: el consultor se la
        // manda al cliente creyendo que está completa. Se aborta y se compensa.
        if (menuError) throw menuError;
      }

      // Insert services
      if (data.services.length > 0) {
        const services = data.services.map((service) => ({
          quotation_id: quotation.id,
          service_provider_id: service.service_provider_id,
          service_type: service.service_type,
          service_name: service.service_name,
          service_description: service.service_description,
          price: service.price,
          duration_hours: service.duration_hours,
          provider_name: service.provider_name,
          provider_contact: service.provider_contact,
          notes: service.notes,
        }));

        const { error: servicesError } = await supabase
          .from('quotation_services')
          .insert(services);

        if (servicesError) throw servicesError;
      }

      // Insert gallery
      if (data.gallery.length > 0) {
        const gallery = data.gallery.map((item) => ({
          quotation_id: quotation.id,
          image_url: item.image_url,
          caption: item.caption,
          display_order: item.display_order,
        }));

        const { error: galleryError } = await supabase
          .from('quotation_gallery')
          .insert(gallery);

        if (galleryError) throw galleryError;
      }

      toast({
        title: 'Cotización creada',
        description: 'La cotización se ha guardado correctamente',
      });

      await fetchQuotations();
      return quotation.id;
    } catch (error: any) {
      console.error('Error creating quotation:', error);
      if (createdId) {
        // Compensar: sin esto quedaría una cotización a medias en la lista.
        const { error: cleanupError } = await supabase
          .from('event_quotations')
          .delete()
          .eq('id', createdId);
        if (cleanupError) console.error('Cleanup failed for quotation', createdId, cleanupError);
      }
      toast({
        title: 'Error',
        description: 'No se pudo crear la cotización',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateQuotationStatus = async (id: string, status: string) => {
    try {
      const updates: TablesUpdate<'event_quotations'> = { status };
      
      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      } else if (status === 'accepted') {
        updates.accepted_at = new Date().toISOString();
        updates.responded_at = new Date().toISOString();
      } else if (status === 'rejected') {
        updates.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('event_quotations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `Cotización marcada como ${status}`,
      });

      await fetchQuotations();
    } catch (error: any) {
      console.error('Error updating quotation status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cotización eliminada',
        description: 'La cotización se ha eliminado correctamente',
      });

      await fetchQuotations();
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cotización',
        variant: 'destructive',
      });
    }
  };

  const getQuotationWithDetails = async (id: string): Promise<Quotation | null> => {
    try {
      const { data: quotation, error } = await supabase
        .from('event_quotations')
        .select(`
          *,
          restaurant:restaurant_businesses(id, name),
          zone:restaurant_zones(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch related data
      const [menuItems, services, gallery] = await Promise.all([
        supabase
          .from('quotation_menu_items')
          .select('*')
          .eq('quotation_id', id),
        supabase
          .from('quotation_services')
          .select('*')
          .eq('quotation_id', id),
        supabase
          .from('quotation_gallery')
          .select('*')
          .eq('quotation_id', id)
          .order('display_order'),
      ]);

      return {
        ...quotation,
        menu_items: menuItems.data || [],
        services: services.data || [],
        gallery: gallery.data || [],
      } as Quotation;
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      return null;
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: quotations.length,
    drafts: quotations.filter((q) => q.status === 'draft').length,
    sent: quotations.filter((q) => q.status === 'sent').length,
    accepted: quotations.filter((q) => q.status === 'accepted').length,
    rejected: quotations.filter((q) => q.status === 'rejected').length,
    totalValue: quotations
      .filter((q) => q.status === 'accepted')
      .reduce((sum, q) => sum + (q.total_amount || 0), 0),
    conversionRate:
      quotations.filter((q) => ['sent', 'accepted', 'rejected'].includes(q.status)).length > 0
        ? (quotations.filter((q) => q.status === 'accepted').length /
            quotations.filter((q) => ['sent', 'accepted', 'rejected'].includes(q.status)).length) *
          100
        : 0,
  }), [quotations]);

  return {
    quotations,
    loading,
    stats,
    createQuotation,
    updateQuotationStatus,
    deleteQuotation,
    getQuotationWithDetails,
    refetch: fetchQuotations,
  };
}
