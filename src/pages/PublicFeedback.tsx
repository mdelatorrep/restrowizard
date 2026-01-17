import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BrandStyles {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  logo_url: string | null;
  brand_name: string;
}

interface Campaign {
  id: string;
  user_id: string;
  name: string;
  incentive: string | null;
  active: boolean;
}

const PublicFeedback = () => {
  const { campaignId } = useParams();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [brand, setBrand] = useState<BrandStyles | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    rating: 0,
    food_rating: 0,
    service_rating: 0,
    ambiance_rating: 0,
    comment: '',
  });

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const { data: campaignData, error } = await supabase
        .from('feedback_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('active', true)
        .single();

      if (error || !campaignData) {
        setLoading(false);
        return;
      }

      setCampaign(campaignData as Campaign);

      // Load brand data for styling
      const { data: brandData } = await supabase
        .from('restaurant_brands')
        .select('primary_color, secondary_color, accent_color, font_primary, font_secondary, logo_url, brand_name')
        .eq('user_id', campaignData.user_id)
        .maybeSingle();

      if (brandData) {
        setBrand(brandData as BrandStyles);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast({
        title: 'Calificación requerida',
        description: 'Por favor selecciona una calificación general',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: feedbackData, error } = await supabase
        .from('customer_feedback')
        .insert([{
          user_id: campaign?.user_id,
          customer_name: formData.customer_name || null,
          customer_email: formData.customer_email || null,
          rating: formData.rating,
          food_rating: formData.food_rating || null,
          service_rating: formData.service_rating || null,
          ambiance_rating: formData.ambiance_rating || null,
          comment: formData.comment || null,
          source: 'qr_campaign',
          campaign_id: campaignId,
        }])
        .select()
        .single();

      if (error) throw error;

      // Increment campaign responses count
      await supabase
        .from('feedback_campaigns')
        .update({ responses_count: (campaign as any).responses_count ? (campaign as any).responses_count + 1 : 1 })
        .eq('id', campaignId);

      // === LOYALTY INTEGRATION ===
      // Award bonus points for positive feedback (4-5 stars)
      if (formData.rating >= 4 && formData.customer_email && campaign?.user_id) {
        try {
          await processLoyaltyForFeedback(
            campaign.user_id,
            formData.customer_email,
            formData.customer_name || 'Cliente',
            formData.rating,
            feedbackData?.id
          );
        } catch (loyaltyError) {
          console.error('Loyalty bonus error (non-blocking):', loyaltyError);
        }
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar tu opinión. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Process loyalty bonus points for feedback
  const processLoyaltyForFeedback = async (
    restaurantUserId: string,
    customerEmail: string,
    customerName: string,
    rating: number,
    feedbackId?: string
  ) => {
    // Find existing loyalty customer by email
    const { data: loyaltyCustomer } = await supabase
      .from('loyalty_customers')
      .select('*')
      .eq('user_id', restaurantUserId)
      .eq('customer_email', customerEmail)
      .maybeSingle();

    // Calculate bonus points based on rating
    const bonusPoints = rating === 5 ? 25 : 15; // 25 for 5 stars, 15 for 4 stars

    if (loyaltyCustomer) {
      // Award bonus points to existing customer
      const newPoints = (loyaltyCustomer.current_points || 0) + bonusPoints;
      const newLifetime = (loyaltyCustomer.lifetime_points || 0) + bonusPoints;

      await supabase
        .from('loyalty_customers')
        .update({
          current_points: newPoints,
          lifetime_points: newLifetime,
        })
        .eq('id', loyaltyCustomer.id);

      // Log transaction
      await supabase
        .from('loyalty_points_transactions')
        .insert([{
          user_id: restaurantUserId,
          customer_id: loyaltyCustomer.id,
          points: bonusPoints,
          transaction_type: 'bonus',
          source: 'feedback',
          source_id: feedbackId,
          description: `+${bonusPoints} pts bonus por reseña de ${rating} estrellas`,
          balance_after: newPoints,
        }]);
    } else {
      // Create new loyalty customer with bonus points
      const { data: newCustomer } = await supabase
        .from('loyalty_customers')
        .insert([{
          user_id: restaurantUserId,
          customer_name: customerName,
          customer_email: customerEmail,
          current_points: bonusPoints,
          lifetime_points: bonusPoints,
        }])
        .select()
        .single();

      if (newCustomer) {
        await supabase
          .from('loyalty_points_transactions')
          .insert([{
            user_id: restaurantUserId,
            customer_id: newCustomer.id,
            points: bonusPoints,
            transaction_type: 'bonus',
            source: 'feedback',
            source_id: feedbackId,
            description: `+${bonusPoints} pts de bienvenida por reseña de ${rating} estrellas`,
            balance_after: bonusPoints,
          }]);
      }
    }
  };

  const StarSelector = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label style={{ color: brand?.primary_color }}>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: brand?.secondary_color || '#f8fafc' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: brand?.primary_color || '#6366f1' }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold mb-2">Encuesta no disponible</h1>
            <p className="text-muted-foreground">Esta encuesta ya no está activa o no existe.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: brand?.secondary_color || '#f8fafc',
          fontFamily: brand?.font_secondary || 'Lato, sans-serif',
        }}
      >
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: brand?.accent_color ? `${brand.accent_color}20` : '#dcfce7' }}
            >
              <CheckCircle 
                className="h-8 w-8" 
                style={{ color: brand?.accent_color || '#22c55e' }}
              />
            </div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ 
                color: brand?.primary_color || '#1e293b',
                fontFamily: brand?.font_primary || 'Montserrat, sans-serif',
              }}
            >
              ¡Gracias por tu opinión!
            </h1>
            <p className="text-muted-foreground mb-4">
              Tu feedback es muy valioso para nosotros.
            </p>
            {campaign.incentive && (
              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: brand?.accent_color ? `${brand.accent_color}15` : '#f0fdf4',
                  border: `1px solid ${brand?.accent_color || '#22c55e'}30`,
                }}
              >
                <p className="font-medium" style={{ color: brand?.accent_color || '#22c55e' }}>
                  🎁 {campaign.incentive}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{
        backgroundColor: brand?.secondary_color || '#f8fafc',
        fontFamily: brand?.font_secondary || 'Lato, sans-serif',
      }}
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {brand?.logo_url && (
            <img 
              src={brand.logo_url} 
              alt={brand.brand_name}
              className="h-12 w-auto mx-auto mb-4 object-contain"
            />
          )}
          <h1 
            className="text-2xl font-bold mb-1"
            style={{
              color: brand?.primary_color || '#1e293b',
              fontFamily: brand?.font_primary || 'Montserrat, sans-serif',
            }}
          >
            ¿Cómo fue tu experiencia?
          </h1>
          <p className="text-muted-foreground">
            Tu opinión nos ayuda a mejorar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle 
              className="text-lg"
              style={{ color: brand?.primary_color }}
            >
              {campaign.name}
            </CardTitle>
            {campaign.incentive && (
              <CardDescription>
                🎁 Al completar: {campaign.incentive}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Overall Rating - Required */}
              <StarSelector
                label="Calificación General *"
                value={formData.rating}
                onChange={(v) => setFormData({ ...formData, rating: v })}
              />

              {/* Detailed Ratings - Optional */}
              <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Calificaciones detalladas (opcional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StarSelector
                    label="Comida"
                    value={formData.food_rating}
                    onChange={(v) => setFormData({ ...formData, food_rating: v })}
                  />
                  <StarSelector
                    label="Servicio"
                    value={formData.service_rating}
                    onChange={(v) => setFormData({ ...formData, service_rating: v })}
                  />
                  <StarSelector
                    label="Ambiente"
                    value={formData.ambiance_rating}
                    onChange={(v) => setFormData({ ...formData, ambiance_rating: v })}
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label style={{ color: brand?.primary_color }}>Cuéntanos más (opcional)</Label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
                  rows={4}
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label style={{ color: brand?.primary_color }}>Nombre (opcional)</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: brand?.primary_color }}>Email (opcional)</Label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={submitting}
                style={{
                  backgroundColor: brand?.accent_color || undefined,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Opinión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {brand && (
          <p 
            className="text-center text-sm mt-6"
            style={{ color: brand.primary_color ? `${brand.primary_color}60` : '#94a3b8' }}
          >
            {brand.brand_name}
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicFeedback;
