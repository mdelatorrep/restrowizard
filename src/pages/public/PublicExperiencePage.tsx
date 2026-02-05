 import { useState, useEffect } from 'react';
 import { useParams } from 'react-router-dom';
 import { usePublicRestaurantData } from '@/hooks/usePublicRestaurantData';
 import { PublicHeader } from '@/components/public/PublicHeader';
 import { PublicFooter } from '@/components/public/PublicFooter';
 import { PublicLoadingState, PublicErrorState } from '@/components/public/PublicLoadingState';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Label } from '@/components/ui/label';
 import { MessageSquare, Star, Send, CheckCircle, Loader2 } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 
 export default function PublicExperiencePage() {
   const { slug } = useParams<{ slug: string }>();
   const { data, loading, error, brandStyles } = usePublicRestaurantData(slug || '');
   const { toast } = useToast();
 
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
 
   const handleRating = (field: 'rating' | 'food_rating' | 'service_rating' | 'ambiance_rating', value: number) => {
     setFormData(prev => ({ ...prev, [field]: value }));
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!data?.userId || formData.rating === 0) return;
 
     setSubmitting(true);
 
     try {
       const { error: submitError } = await supabase
         .from('customer_feedback')
         .insert({
           user_id: data.userId,
           customer_name: formData.customer_name || null,
           customer_email: formData.customer_email || null,
           rating: formData.rating,
           food_rating: formData.food_rating || null,
           service_rating: formData.service_rating || null,
           ambiance_rating: formData.ambiance_rating || null,
           comment: formData.comment || null,
           source: 'website',
         });
 
       if (submitError) throw submitError;
 
       setSubmitted(true);
       toast({
         title: '¡Gracias!',
         description: 'Tu opinión nos ayuda a mejorar',
       });
     } catch (err) {
       console.error('Error submitting feedback:', err);
       toast({
         title: 'Error',
         description: 'No se pudo enviar tu calificación',
         variant: 'destructive',
       });
     } finally {
       setSubmitting(false);
     }
   };
 
   if (loading) return <PublicLoadingState />;
   if (error || !data) return <PublicErrorState type={error || 'not_found'} />;
 
   const { website, brand, profile, restaurantName } = data;
 
   if (!website?.show_feedback) {
     return <PublicErrorState type="not_found" message="La sección de calificaciones no está habilitada." />;
   }
 
   const RatingStars = ({ value, onChange, size = 'lg' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'lg' }) => (
     <div className="flex gap-1">
       {[1, 2, 3, 4, 5].map(star => (
         <button
           key={star}
           type="button"
           onClick={() => onChange(star)}
           className="transition-transform hover:scale-110"
         >
           <Star
             className={`${size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} ${
               star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
             }`}
           />
         </button>
       ))}
     </div>
   );
 
   if (submitted) {
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
           currentSection="experiencia"
         />
 
         <main className="flex-1 flex items-center justify-center p-4">
           <Card className="max-w-md text-center">
             <CardContent className="py-12">
               <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                 <CheckCircle className="w-10 h-10 text-green-600" />
               </div>
               <h2 className="text-2xl font-bold mb-4">¡Gracias por tu opinión!</h2>
               <p className="text-muted-foreground">
                 Tu feedback es muy valioso para nosotros y nos ayuda a mejorar constantemente.
               </p>
             </CardContent>
           </Card>
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
         currentSection="experiencia"
       />
 
       {/* Hero */}
       <section className="bg-gradient-to-br from-pink-500/10 via-background to-orange-500/10 py-16">
         <div className="container mx-auto px-4 text-center">
           <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-6">
             <MessageSquare className="w-10 h-10 text-pink-600" />
           </div>
           <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: brand.primary_font || undefined }}>
             Califica tu Experiencia
           </h1>
           <p className="text-xl text-muted-foreground max-w-xl mx-auto">
             Tu opinión nos ayuda a mejorar en {restaurantName}
           </p>
         </div>
       </section>
 
       {/* Form */}
       <main className="flex-1 container mx-auto px-4 py-12">
         <Card className="max-w-lg mx-auto">
           <CardHeader>
             <CardTitle>¿Cómo fue tu visita?</CardTitle>
             <CardDescription>
               Cuéntanos sobre tu experiencia
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-6">
               {/* Overall Rating */}
               <div className="text-center space-y-3">
                 <Label className="text-base">Calificación general *</Label>
                 <div className="flex justify-center">
                   <RatingStars value={formData.rating} onChange={(v) => handleRating('rating', v)} />
                 </div>
               </div>
 
               {/* Detailed Ratings */}
               <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t">
                 <div className="text-center space-y-2">
                   <Label className="text-sm">Comida</Label>
                   <div className="flex justify-center">
                     <RatingStars value={formData.food_rating} onChange={(v) => handleRating('food_rating', v)} size="sm" />
                   </div>
                 </div>
                 <div className="text-center space-y-2">
                   <Label className="text-sm">Servicio</Label>
                   <div className="flex justify-center">
                     <RatingStars value={formData.service_rating} onChange={(v) => handleRating('service_rating', v)} size="sm" />
                   </div>
                 </div>
                 <div className="text-center space-y-2">
                   <Label className="text-sm">Ambiente</Label>
                   <div className="flex justify-center">
                     <RatingStars value={formData.ambiance_rating} onChange={(v) => handleRating('ambiance_rating', v)} size="sm" />
                   </div>
                 </div>
               </div>
 
               {/* Comment */}
               <div className="space-y-2">
                 <Label>Comentarios (opcional)</Label>
                 <Textarea
                   placeholder="Cuéntanos más sobre tu experiencia..."
                   value={formData.comment}
                   onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                   rows={4}
                 />
               </div>
 
               {/* Contact Info */}
               <div className="grid sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Nombre (opcional)</Label>
                   <Input
                     placeholder="Tu nombre"
                     value={formData.customer_name}
                     onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Email (opcional)</Label>
                   <Input
                     type="email"
                     placeholder="tu@email.com"
                     value={formData.customer_email}
                     onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                   />
                 </div>
               </div>
 
               <Button
                 type="submit"
                 size="lg"
                 className="w-full"
                 disabled={submitting || formData.rating === 0}
               >
                 {submitting ? (
                   <Loader2 className="w-5 h-5 animate-spin mr-2" />
                 ) : (
                   <Send className="w-5 h-5 mr-2" />
                 )}
                 Enviar Calificación
               </Button>
             </form>
           </CardContent>
         </Card>
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