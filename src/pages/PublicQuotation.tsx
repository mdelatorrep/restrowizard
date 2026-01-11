import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Utensils,
  Music,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuotationData {
  id: string;
  event_name: string;
  event_type: string;
  event_date: string | null;
  event_description: string | null;
  guest_count: number;
  event_duration_hours: number;
  client_contact_name: string;
  client_company: string | null;
  client_email: string | null;
  venue_cost: number;
  menu_cost_per_person: number;
  services_cost: number;
  additional_costs: number;
  discount_percentage: number;
  subtotal: number;
  total_amount: number;
  status: string;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  consultant: {
    company_name: string | null;
    logo_url: string | null;
  } | null;
  zone: {
    name: string;
    description: string | null;
  } | null;
  menu_items: Array<{
    category: string;
    item_name: string;
    item_description: string | null;
    price_per_person: number;
  }>;
  services: Array<{
    service_type: string;
    service_name: string;
    service_description: string | null;
    price: number;
    provider_name: string | null;
  }>;
  gallery: Array<{
    image_url: string;
    caption: string | null;
  }>;
}

const eventTypeLabels: Record<string, string> = {
  corporativo: 'Evento Corporativo',
  social: 'Evento Social',
  boda: 'Boda',
  cumpleaños: 'Cumpleaños',
  conferencia: 'Conferencia',
  otro: 'Otro',
};

const categoryLabels: Record<string, string> = {
  entrada: 'Entrada',
  plato_fuerte: 'Plato Fuerte',
  postre: 'Postre',
  bebida: 'Bebida',
  aperitivo: 'Aperitivo',
};

const serviceTypeLabels: Record<string, string> = {
  musica: 'Música',
  dj: 'DJ',
  show: 'Show',
  decoracion: 'Decoración',
  fotografia: 'Fotografía',
  otro: 'Servicio',
};

export default function PublicQuotation() {
  const { slug } = useParams<{ slug: string }>();
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      if (!slug) return;

      try {
        // Mark as viewed
        await supabase
          .from('event_quotations')
          .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
          .eq('public_slug', slug)
          .eq('status', 'sent');

        // Fetch quotation with related data
        const { data: quotationData, error: quotationError } = await supabase
          .from('event_quotations')
          .select(`
            *,
            consultant:consultant_profiles(company_name, logo_url),
            zone:restaurant_zones(name, description)
          `)
          .eq('public_slug', slug)
          .single();

        if (quotationError) throw quotationError;

        // Fetch related items
        const [menuItems, services, gallery] = await Promise.all([
          supabase
            .from('quotation_menu_items')
            .select('*')
            .eq('quotation_id', quotationData.id),
          supabase
            .from('quotation_services')
            .select('*')
            .eq('quotation_id', quotationData.id),
          supabase
            .from('quotation_gallery')
            .select('*')
            .eq('quotation_id', quotationData.id)
            .order('display_order'),
        ]);

        setQuotation({
          ...quotationData,
          consultant: quotationData.consultant as QuotationData['consultant'],
          zone: quotationData.zone as QuotationData['zone'],
          menu_items: menuItems.data || [],
          services: services.data || [],
          gallery: gallery.data || [],
        });
      } catch (err: any) {
        console.error('Error fetching quotation:', err);
        setError('No se pudo cargar la propuesta');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [slug]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-medium">Propuesta no encontrada</h2>
            <p className="text-muted-foreground mt-2">
              El enlace puede haber expirado o la propuesta no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired =
    quotation.valid_until && new Date(quotation.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          {quotation.consultant?.logo_url && (
            <img
              src={quotation.consultant.logo_url}
              alt="Logo"
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-headline font-bold text-foreground">
            Propuesta de Evento
          </h1>
          {quotation.consultant?.company_name && (
            <p className="text-muted-foreground mt-1">
              Por {quotation.consultant.company_name}
            </p>
          )}
        </div>

        {/* Status Banner */}
        {isExpired && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
            <p className="font-medium">Esta propuesta ha expirado</p>
          </div>
        )}

        {quotation.status === 'accepted' && (
          <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-lg text-center flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Propuesta Aceptada</p>
          </div>
        )}

        {/* Event Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{quotation.event_name}</CardTitle>
                <Badge variant="secondary" className="mt-2">
                  {eventTypeLabels[quotation.event_type] || quotation.event_type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotation.event_description && (
              <p className="text-muted-foreground">{quotation.event_description}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {quotation.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(new Date(quotation.event_date), "d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Invitados</p>
                  <p className="font-medium">{quotation.guest_count} personas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duración</p>
                  <p className="font-medium">{quotation.event_duration_hours} horas</p>
                </div>
              </div>
              {quotation.zone && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{quotation.zone.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gallery */}
        {quotation.gallery.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Galería del Espacio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {quotation.gallery.map((item, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.caption || 'Imagen del espacio'}
                      className="w-full h-full object-cover"
                    />
                    {item.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <p className="text-white text-sm">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu */}
        {quotation.menu_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Propuesta de Menú
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['entrada', 'plato_fuerte', 'postre', 'bebida', 'aperitivo'].map((category) => {
                  const items = quotation.menu_items.filter((item) => item.category === category);
                  if (items.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              {item.item_description && (
                                <p className="text-sm text-muted-foreground">
                                  {item.item_description}
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-medium">
                              {formatCurrency(item.price_per_person)}/persona
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {quotation.services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Servicios Incluidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quotation.services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {serviceTypeLabels[service.service_type] || service.service_type}
                        </Badge>
                        <p className="font-medium">{service.service_name}</p>
                      </div>
                      {service.service_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.service_description}
                        </p>
                      )}
                      {service.provider_name && (
                        <p className="text-sm text-muted-foreground">
                          Proveedor: {service.provider_name}
                        </p>
                      )}
                    </div>
                    <span className="font-medium">{formatCurrency(service.price)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Inversión Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quotation.venue_cost > 0 && (
                <div className="flex items-center justify-between">
                  <span>Espacio</span>
                  <span>{formatCurrency(quotation.venue_cost)}</span>
                </div>
              )}
              {quotation.menu_cost_per_person > 0 && (
                <div className="flex items-center justify-between">
                  <span>
                    Menú ({formatCurrency(quotation.menu_cost_per_person)}/persona x{' '}
                    {quotation.guest_count})
                  </span>
                  <span>
                    {formatCurrency(quotation.menu_cost_per_person * quotation.guest_count)}
                  </span>
                </div>
              )}
              {quotation.services_cost > 0 && (
                <div className="flex items-center justify-between">
                  <span>Servicios</span>
                  <span>{formatCurrency(quotation.services_cost)}</span>
                </div>
              )}
              {quotation.additional_costs > 0 && (
                <div className="flex items-center justify-between">
                  <span>Adicionales</span>
                  <span>{formatCurrency(quotation.additional_costs)}</span>
                </div>
              )}
              {quotation.discount_percentage > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Descuento ({quotation.discount_percentage}%)</span>
                  <span>
                    -{formatCurrency(quotation.subtotal * (quotation.discount_percentage / 100))}
                  </span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(quotation.total_amount)}</span>
                </div>
              </div>
            </div>

            {quotation.valid_until && !isExpired && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Propuesta válida hasta{' '}
                {format(new Date(quotation.valid_until), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {quotation.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact Actions */}
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">¿Te interesa esta propuesta?</h3>
              <p className="text-muted-foreground">
                Contacta a {quotation.consultant?.company_name || 'nuestro equipo'} para confirmar
                o solicitar ajustes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {quotation.client_email && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${quotation.client_email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Email
                    </a>
                  </Button>
                )}
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Me Interesa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>Propuesta generada con RestroWizard</p>
          <p className="text-xs mt-1">
            Creada el{' '}
            {format(new Date(quotation.created_at), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>
    </div>
  );
}
