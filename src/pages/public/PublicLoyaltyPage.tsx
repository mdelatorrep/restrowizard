 import { useState } from 'react';
 import { useParams, Link } from 'react-router-dom';
 import { usePublicRestaurantData } from '@/hooks/usePublicRestaurantData';
 import { PublicHeader } from '@/components/public/PublicHeader';
 import { PublicFooter } from '@/components/public/PublicFooter';
 import { PublicLoadingState, PublicErrorState } from '@/components/public/PublicLoadingState';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Gift, Star, Award, Sparkles } from 'lucide-react';
 
 export default function PublicLoyaltyPage() {
   const { slug } = useParams<{ slug: string }>();
   const { data, loading, error, brandStyles } = usePublicRestaurantData(slug || '');
 
   if (loading) return <PublicLoadingState />;
   if (error || !data) return <PublicErrorState type={error || 'not_found'} />;
 
   const { website, brand, profile, restaurantName } = data;
 
   if (!website?.show_loyalty) {
     return <PublicErrorState type="not_found" message="El programa de fidelidad no está habilitado para este restaurante." />;
   }
 
   return (
     <div className="min-h-screen flex flex-col bg-background" style={brandStyles}>
       <PublicHeader
         restaurantName={restaurantName}
         logoUrl={brand.logo_url}
         primaryFont={brand.primary_font}
         showMenu={website?.show_menu}
         showReservations={website?.show_reservations}
         showDelivery={website?.show_delivery}
         showLoyalty={website?.show_loyalty}
         showFeedback={website?.show_feedback}
         currentSection="fidelidad"
       />
 
       {/* Hero */}
       <section className="bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10 py-16">
         <div className="container mx-auto px-4 text-center">
           <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
             <Gift className="w-10 h-10 text-purple-600" />
           </div>
           <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: brand.primary_font || undefined }}>
             Programa de Fidelidad
           </h1>
           <p className="text-xl text-muted-foreground max-w-xl mx-auto">
             Acumula puntos y canjea premios exclusivos en {restaurantName}
           </p>
         </div>
       </section>
 
       {/* Benefits Section */}
       <main className="flex-1 container mx-auto px-4 py-12">
         <div className="max-w-4xl mx-auto">
           <h2 className="text-2xl font-bold text-center mb-8">¿Cómo funciona?</h2>
           
           <div className="grid md:grid-cols-3 gap-6 mb-12">
             <Card className="text-center">
               <CardContent className="pt-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Sparkles className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">1. Registrate</h3>
                 <p className="text-muted-foreground text-sm">
                   Únete al programa en tu próxima visita al restaurante
                 </p>
               </CardContent>
             </Card>
 
             <Card className="text-center">
               <CardContent className="pt-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Star className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">2. Acumula puntos</h3>
                 <p className="text-muted-foreground text-sm">
                   Gana puntos con cada compra que realices
                 </p>
               </CardContent>
             </Card>
 
             <Card className="text-center">
               <CardContent className="pt-6">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <Award className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">3. Canjea premios</h3>
                 <p className="text-muted-foreground text-sm">
                   Intercambia tus puntos por descuentos y productos gratis
                 </p>
               </CardContent>
             </Card>
           </div>
 
           {/* CTA */}
           <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
             <CardHeader className="text-center">
               <CardTitle className="text-2xl">¿Ya eres miembro?</CardTitle>
               <CardDescription>
                 Consulta tus puntos en el portal de fidelidad
               </CardDescription>
             </CardHeader>
             <CardContent className="text-center pb-8">
               <Button size="lg" asChild>
                 <Link to="/mi-fidelidad">
                   <Gift className="w-5 h-5 mr-2" />
                   Ir al Portal de Fidelidad
                 </Link>
               </Button>
             </CardContent>
           </Card>
         </div>
       </main>
 
       <PublicFooter
         restaurantName={restaurantName}
         logoUrl={brand.logo_url}
         socialLinks={brand.social_links}
         phone={profile?.phone}
         showMenu={website?.show_menu}
         showReservations={website?.show_reservations}
         showDelivery={website?.show_delivery}
         showLoyalty={website?.show_loyalty}
       />
     </div>
   );
 }