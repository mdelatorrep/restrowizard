import { useParams } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Clock, Briefcase, Globe, Mail, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PortfolioGallery from '@/components/services/PortfolioGallery';
import ReviewForm from '@/components/services/ReviewForm';
import { useProviderDetail, useProviderReviews, useProviderPortfolio } from '@/hooks/useServiceMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProviderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: provider, isLoading } = useProviderDetail(id);
  const { data: reviews = [] } = useProviderReviews(id);
  const { data: portfolio = [] } = useProviderPortfolio(id);

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Cargando...</div></div>;
  if (!provider) return <div className="min-h-screen bg-background"><Header /><div className="pt-28 text-center text-muted-foreground">Proveedor no encontrado</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover */}
      <div className="pt-20">
        {provider.cover_image_url ? (
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary to-secondary relative">
            <img src={provider.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary to-secondary relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl font-headline mb-1">{provider.name}</h2>
                <p className="text-white/80 font-lato-regular">{provider.specialty}</p>
                {provider.city && <p className="text-white/60 text-sm mt-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{provider.city}, {provider.country}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-6 -mt-16 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/services')} className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                </Button>

                <div className="flex items-start gap-4">
                  {provider.logo_url && (
                    <img src={provider.logo_url} alt={provider.name} className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h1 className="text-2xl font-headline flex items-center gap-2">
                      {provider.name}
                      {provider.is_verified && (
                        <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle className="h-3 w-3 mr-0.5" /> Verificado</Badge>
                      )}
                    </h1>
                    {provider.headline && <p className="text-muted-foreground mt-1">{provider.headline}</p>}
                    <p className="text-sm text-primary font-medium">{provider.specialty}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{provider.city}, {provider.country}</span>
                  {provider.average_rating && (
                    <span className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4 fill-current" />{provider.average_rating.toFixed(1)} ({provider.reviews_count} reseñas)</span>
                  )}
                  {provider.completed_projects > 0 && (
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{provider.completed_projects} proyectos</span>
                  )}
                  {provider.response_time_hours && (
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Responde en {provider.response_time_hours}h</span>
                  )}
                </div>

                {provider.description && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{provider.description}</p>
                  </>
                )}

                {provider.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {provider.tags.map((tag: string) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                  </div>
                )}

                {provider.certifications?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Certificaciones</h4>
                    <div className="flex flex-wrap gap-1">
                      {provider.certifications.map((c: string) => <Badge key={c} className="text-xs">{c}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Portafolio</CardTitle></CardHeader>
                <CardContent>
                  <PortfolioGallery items={portfolio} />
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reseñas ({reviews.length})</CardTitle>
                {session && <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>Escribir Reseña</Button>}
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay reseñas</p>}
                {reviews.map((review: any) => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex text-yellow-400">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-current' : 'text-muted-foreground/20'}`} />)}
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {review.quality_rating && <span>Calidad: {review.quality_rating}/5</span>}
                      {review.punctuality_rating && <span>Puntualidad: {review.punctuality_rating}/5</span>}
                      {review.communication_rating && <span>Comunicación: {review.communication_rating}/5</span>}
                    </div>
                    {review.response && (
                      <div className="mt-2 ml-4 p-2 bg-muted rounded text-xs text-muted-foreground">
                        <strong>Respuesta del proveedor:</strong> {review.response}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button className="w-full" onClick={() => window.open(`mailto:${provider.contact_email}`)}>
                  <Mail className="h-4 w-4 mr-2" /> Contactar
                </Button>
                {provider.contact_phone && (
                  <Button variant="outline" className="w-full" onClick={() => window.open(`tel:${provider.contact_phone}`)}>
                    <Phone className="h-4 w-4 mr-2" /> Llamar
                  </Button>
                )}
                {provider.website_url && (
                  <Button variant="outline" className="w-full" onClick={() => window.open(provider.website_url, '_blank')}>
                    <Globe className="h-4 w-4 mr-2" /> Sitio Web
                  </Button>
                )}
              </CardContent>
            </Card>

            {provider.service_areas?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Áreas de Servicio</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {provider.service_areas.map((area: string) => <Badge key={area} variant="outline" className="text-xs">{area}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}

            {provider.years_in_business && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-headline text-primary">{provider.years_in_business}</p>
                  <p className="text-xs text-muted-foreground">Años en el mercado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
      {id && <ReviewForm open={reviewOpen} onOpenChange={setReviewOpen} providerId={id} />}
    </div>
  );
};

export default ProviderDetail;
