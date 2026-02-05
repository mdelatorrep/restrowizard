 import { useParams, Link } from 'react-router-dom';
 import { usePublicRestaurantData } from '@/hooks/usePublicRestaurantData';
 import { PublicHeader } from '@/components/public/PublicHeader';
 import { PublicFooter } from '@/components/public/PublicFooter';
 import { PublicLoadingState, PublicErrorState } from '@/components/public/PublicLoadingState';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   UtensilsCrossed, CalendarDays, Truck, Gift, MessageSquare,
   ChevronDown, Clock, Phone, MapPin, ArrowRight
 } from 'lucide-react';
 
 const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
 const DAY_NAMES: Record<string, string> = {
   monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
   friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
 };
 
 export default function PublicRestaurantHub() {
   const { slug } = useParams<{ slug: string }>();
   const { data, loading, error, brandStyles } = usePublicRestaurantData(slug || '');
 
   if (loading) return <PublicLoadingState />;
   if (error || !data) return <PublicErrorState type={error || 'not_found'} />;
 
   const { website, brand, profile, restaurantName } = data;
   const basePath = `/r/${slug}`;
 
   const quickLinks = [
     { key: 'menu', label: 'Ver Menú', description: 'Explora nuestros platos', icon: UtensilsCrossed, path: `${basePath}/menu`, show: website?.show_menu, color: 'bg-orange-500' },
     { key: 'reservas', label: 'Reservar Mesa', description: 'Encuentra tu horario ideal', icon: CalendarDays, path: `${basePath}/reservas`, show: website?.show_reservations, color: 'bg-blue-500' },
     { key: 'domicilios', label: 'Pedir a Domicilio', description: 'Entrega a tu puerta', icon: Truck, path: `${basePath}/domicilios`, show: website?.show_delivery, color: 'bg-green-500' },
     { key: 'fidelidad', label: 'Programa de Fidelidad', description: 'Acumula puntos y premia tu preferencia', icon: Gift, path: `${basePath}/fidelidad`, show: website?.show_loyalty, color: 'bg-purple-500' },
     { key: 'experiencia', label: 'Calificar Experiencia', description: 'Tu opinión nos importa', icon: MessageSquare, path: `${basePath}/experiencia`, show: website?.show_feedback, color: 'bg-pink-500' },
   ];
 
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
         currentSection="home"
       />
 
       {/* Hero Section */}
       <section className="relative min-h-[70vh] flex items-center justify-center">
         {website?.hero_image_url ? (
           <div
             className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: `url(${website.hero_image_url})` }}
           >
             <div className="absolute inset-0 bg-black/50" />
           </div>
         ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
         )}
 
         <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
           <h1
             className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg"
             style={{ fontFamily: brand.primary_font || undefined }}
           >
             {website?.hero_title || restaurantName}
           </h1>
           {(website?.hero_subtitle || brand.tagline) && (
             <p className="text-xl md:text-2xl text-white/90 mb-8" style={{ fontFamily: brand.secondary_font || undefined }}>
               {website?.hero_subtitle || brand.tagline}
             </p>
           )}
           <div className="flex flex-wrap gap-4 justify-center">
             {website?.hero_cta_text && (
               <Button size="lg" className="text-lg px-8" asChild>
                 <a href={website.hero_cta_link || '#servicios'}>{website.hero_cta_text}</a>
               </Button>
             )}
             {website?.show_reservations && (
               <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                 <Link to={`${basePath}/reservas`}>
                   <CalendarDays className="w-5 h-5 mr-2" />
                   Reservar mesa
                 </Link>
               </Button>
             )}
           </div>
         </div>
 
         <a href="#servicios" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
           <ChevronDown className="h-8 w-8 text-white" />
         </a>
       </section>
 
       {/* About Section */}
       {website?.show_about && (
         <section className="py-20 bg-muted/30">
           <div className="container mx-auto px-4">
             <div className="grid md:grid-cols-2 gap-12 items-center">
               <div>
                 <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: brand.primary_font || undefined }}>
                   {website.about_title || 'Nuestra Historia'}
                 </h2>
                 <p className="text-lg text-muted-foreground leading-relaxed">
                   {website.about_description || 'Bienvenidos a nuestro restaurante.'}
                 </p>
               </div>
               {website.about_image_url && (
                 <div className="rounded-lg overflow-hidden shadow-xl">
                   <img src={website.about_image_url} alt="Sobre nosotros" className="w-full h-80 object-cover" />
                 </div>
               )}
             </div>
           </div>
         </section>
       )}
 
       {/* Quick Links Section */}
       <section id="servicios" className="py-20">
         <div className="container mx-auto px-4">
           <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: brand.primary_font || undefined }}>
             Nuestros Servicios
           </h2>
           <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
             Todo lo que necesitas para disfrutar de nuestra experiencia gastronómica
           </p>
 
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
             {quickLinks.filter(link => link.show).map(link => (
               <Link key={link.key} to={link.path}>
                 <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                   <CardContent className="p-6">
                     <div className={`w-14 h-14 rounded-xl ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                       <link.icon className="w-7 h-7 text-white" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                       {link.label}
                       <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                     </h3>
                     <p className="text-muted-foreground">{link.description}</p>
                   </CardContent>
                 </Card>
               </Link>
             ))}
           </div>
         </div>
       </section>
 
       {/* Gallery Section */}
       {website?.show_gallery && website.gallery_images.length > 0 && (
         <section className="py-20 bg-muted/30">
           <div className="container mx-auto px-4">
             <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand.primary_font || undefined }}>
               Galería
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {website.gallery_images.map((img, i) => (
                 <div key={i} className="aspect-square rounded-lg overflow-hidden shadow-lg">
                   <img src={img} alt={`Galería ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                 </div>
               ))}
             </div>
           </div>
         </section>
       )}
 
       {/* Hours & Contact Section */}
       {website?.show_contact && (
         <section className="py-20">
           <div className="container mx-auto px-4">
             <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
               {/* Hours */}
               {Object.keys(website.business_hours).length > 0 && (
                 <Card>
                   <CardContent className="p-6">
                     <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                       <Clock className="w-6 h-6" style={{ color: brand.accent_color }} />
                       Horarios
                     </h3>
                     <div className="space-y-3">
                       {DAYS.map(day => {
                         const hours = website.business_hours[day];
                         return (
                           <div key={day} className="flex justify-between items-center">
                             <span className="font-medium">{DAY_NAMES[day]}</span>
                             <span className="text-muted-foreground">
                               {hours?.closed ? 'Cerrado' : hours ? `${hours.open} - ${hours.close}` : '-'}
                             </span>
                           </div>
                         );
                       })}
                     </div>
                   </CardContent>
                 </Card>
               )}
 
               {/* Contact */}
               <Card>
                 <CardContent className="p-6">
                   <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                     <Phone className="w-6 h-6" style={{ color: brand.accent_color }} />
                     Contacto
                   </h3>
                   <div className="space-y-4">
                     {profile?.phone && (
                       <div className="flex items-center gap-3">
                         <Phone className="w-5 h-5 text-muted-foreground" />
                         <a href={`tel:${profile.phone}`} className="hover:underline">{profile.phone}</a>
                       </div>
                     )}
                     {profile?.address && (
                       <div className="flex items-center gap-3">
                         <MapPin className="w-5 h-5 text-muted-foreground" />
                         <span>{profile.address}</span>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>
         </section>
       )}
 
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