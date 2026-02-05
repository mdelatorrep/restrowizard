 import { useParams } from 'react-router-dom';
 import { usePublicRestaurantData } from '@/hooks/usePublicRestaurantData';
 import { usePublicReservation } from '@/hooks/useReservations';
 import { PublicHeader } from '@/components/public/PublicHeader';
 import { PublicFooter } from '@/components/public/PublicFooter';
 import { PublicLoadingState, PublicErrorState } from '@/components/public/PublicLoadingState';
 import { PublicReservationWidget } from '@/components/reservations/PublicReservationWidget';
 import { CalendarDays } from 'lucide-react';
 
 export default function PublicReservationsPage() {
   const { slug } = useParams<{ slug: string }>();
   const { data, loading, error, brandStyles } = usePublicRestaurantData(slug || '');
   const { createPublicReservation, loading: reservationLoading } = usePublicReservation();
 
   if (loading) return <PublicLoadingState />;
   if (error || !data) return <PublicErrorState type={error || 'not_found'} />;
 
   const { website, brand, profile, restaurantName, userId } = data;
 
   if (!website?.show_reservations) {
     return <PublicErrorState type="not_found" message="Las reservaciones no están habilitadas para este restaurante." />;
   }
 
   const handleReservationSubmit = async (formData: {
     customer_name: string;
     customer_email?: string;
     customer_phone: string;
     party_size: number;
     reservation_date: string;
     reservation_time: string;
     special_requests?: string;
   }) => {
     if (!userId) return null;
     return await createPublicReservation(userId, formData);
   };
 
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
         currentSection="reservas"
       />
 
       {/* Hero */}
       <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
         <div className="container mx-auto px-4 text-center">
           <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
             <CalendarDays className="w-10 h-10 text-primary" />
           </div>
           <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: brand.primary_font || undefined }}>
             Reservar Mesa
           </h1>
           <p className="text-xl text-muted-foreground max-w-xl mx-auto">
             Asegura tu lugar en {restaurantName}
           </p>
         </div>
       </section>
 
       {/* Reservation Widget */}
       <main className="flex-1 py-12 bg-muted/30">
         <div className="container mx-auto px-4 max-w-2xl">
           <PublicReservationWidget
             restaurantName={restaurantName}
             restaurantLogo={brand.logo_url || undefined}
             primaryColor={brand.primary_color}
             accentColor={brand.accent_color}
             maxPartySize={website.reservation_max_party_size}
             availableTimeSlots={website.reservation_available_times.length > 0 ? website.reservation_available_times : undefined}
             onSubmit={handleReservationSubmit}
             loading={reservationLoading}
           />
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