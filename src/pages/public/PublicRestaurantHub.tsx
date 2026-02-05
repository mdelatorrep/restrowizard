 import { useParams, Link } from 'react-router-dom';
 import { usePublicRestaurantData } from '@/hooks/usePublicRestaurantData';
 import { PublicHeader } from '@/components/public/PublicHeader';
 import { PublicFooter } from '@/components/public/PublicFooter';
 import { PublicLoadingState, PublicErrorState } from '@/components/public/PublicLoadingState';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { AspectRatio } from '@/components/ui/aspect-ratio';
 import {
   UtensilsCrossed, CalendarDays, Truck, Gift, MessageSquare,
   ChevronDown, Clock, Phone, MapPin, ArrowRight, Star, Play, 
   Instagram, Facebook, ExternalLink
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
   const basePath = `/p/${slug}`;
 
   // Get additional data from the extended website fields
   const heroStyle = (website as any)?.hero_style || 'fullscreen';
   const heroVideoUrl = (website as any)?.hero_video_url;
   const promoBannerEnabled = (website as any)?.promo_banner_enabled;
   const promoBannerText = (website as any)?.promo_banner_text;
   const promoBannerBgColor = (website as any)?.promo_banner_bg_color || '#f97316';
   const featuredItems = (website as any)?.featured_items || [];
   const testimonials = (website as any)?.testimonials || [];
   const instagramHandle = (website as any)?.instagram_handle;
   const googleMapsEmbedUrl = (website as any)?.google_maps_embed_url;
   const whatsappNumber = (website as any)?.whatsapp_number;
 
   const quickLinks = [
     { key: 'menu', label: 'Ver Menú', description: 'Explora nuestros platos', icon: UtensilsCrossed, path: `${basePath}/menu`, show: website?.show_menu, color: 'bg-orange-500' },
     { key: 'reservas', label: 'Reservar Mesa', description: 'Encuentra tu horario ideal', icon: CalendarDays, path: `${basePath}/reservas`, show: website?.show_reservations, color: 'bg-blue-500' },
     { key: 'domicilios', label: 'Pedir a Domicilio', description: 'Entrega a tu puerta', icon: Truck, path: `${basePath}/domicilios`, show: website?.show_delivery, color: 'bg-green-500' },
     { key: 'fidelidad', label: 'Programa de Fidelidad', description: 'Acumula puntos y premia tu preferencia', icon: Gift, path: `${basePath}/fidelidad`, show: website?.show_loyalty, color: 'bg-purple-500' },
     { key: 'experiencia', label: 'Calificar Experiencia', description: 'Tu opinión nos importa', icon: MessageSquare, path: `${basePath}/experiencia`, show: website?.show_feedback, color: 'bg-pink-500' },
   ];
 
   return (
     <div className="min-h-screen flex flex-col bg-background" style={brandStyles}>
       {/* Promo Banner */}
       {promoBannerEnabled && promoBannerText && (
         <div 
           className="py-2 px-4 text-center text-white text-sm font-medium"
           style={{ backgroundColor: promoBannerBgColor }}
         >
           {promoBannerText}
         </div>
       )}
 
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
       <section className={`relative flex items-center justify-center ${
         heroStyle === 'fullscreen' ? 'min-h-[85vh]' : heroStyle === 'split' ? 'min-h-[60vh]' : 'min-h-[50vh]'
       }`}>
         {/* Video Background */}
         {heroVideoUrl ? (
           <div className="absolute inset-0 overflow-hidden">
             <video
               autoPlay
               muted
               loop
               playsInline
               className="w-full h-full object-cover"
             >
               <source src={heroVideoUrl} type="video/mp4" />
             </video>
             <div className="absolute inset-0 bg-black/50" />
           </div>
         ) : website?.hero_image_url ? (
           <div
             className="absolute inset-0 bg-cover bg-center bg-fixed"
             style={{ backgroundImage: `url(${website.hero_image_url})` }}
           >
             <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
           </div>
         ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
         )}
 
         <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
           {/* Animated Badge */}
           {brand.tagline && (
             <Badge 
               variant="secondary" 
               className="mb-6 px-4 py-1.5 text-sm bg-white/20 backdrop-blur-sm text-white border-white/20 animate-fade-in"
             >
               ✨ {brand.tagline}
             </Badge>
           )}
 
           <h1
             className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white drop-shadow-2xl tracking-tight"
             style={{ fontFamily: brand.primary_font || undefined }}
           >
             {website?.hero_title || restaurantName}
           </h1>
           {website?.hero_subtitle && (
             <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto" style={{ fontFamily: brand.secondary_font || undefined }}>
               {website.hero_subtitle}
             </p>
           )}
           <div className="flex flex-wrap gap-4 justify-center items-center">
             {website?.hero_cta_text && (
               <Button size="lg" className="text-lg px-8 h-14 shadow-2xl gap-2" asChild>
                 <a href={website.hero_cta_link || '#servicios'}>{website.hero_cta_text}</a>
               </Button>
             )}
             {website?.show_reservations && (
               <Button size="lg" variant="secondary" className="text-lg px-8 h-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20" asChild>
                 <Link to={`${basePath}/reservas`}>
                   <CalendarDays className="w-5 h-5 mr-2" />
                   Reservar mesa
                 </Link>
               </Button>
             )}
             {website?.show_delivery && (
               <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/30" asChild>
                 <Link to={`${basePath}/domicilios`}>
                   <Truck className="w-5 h-5 mr-2" />
                   Pedir ahora
                 </Link>
               </Button>
             )}
           </div>
         </div>
 
         <a href="#servicios" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-80 hover:opacity-100 transition-opacity">
           <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
             <ChevronDown className="h-6 w-6 text-white" />
           </div>
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
           <div className="text-center mb-12">
             <Badge variant="outline" className="mb-4">Nuestros servicios</Badge>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: brand.primary_font || undefined }}>
             Nuestros Servicios
             </h2>
             <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
             Todo lo que necesitas para disfrutar de nuestra experiencia gastronómica
             </p>
           </div>
 
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
             {quickLinks.filter(link => link.show).map(link => (
               <Link key={link.key} to={link.path}>
                 <Card className="group h-full hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-card to-muted/30">
                   <CardContent className="p-6 md:p-8">
                     <div className={`w-16 h-16 rounded-2xl ${link.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                       <link.icon className="w-7 h-7 text-white" />
                     </div>
                     <h3 className="text-xl font-bold mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                       {link.label}
                       <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                     </h3>
                     <p className="text-muted-foreground leading-relaxed">{link.description}</p>
                   </CardContent>
                 </Card>
               </Link>
             ))}
           </div>
         </div>
       </section>
 
       {/* Featured Items Section */}
       {featuredItems.length > 0 && (
         <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
           <div className="container mx-auto px-4">
             <div className="text-center mb-12">
               <Badge variant="outline" className="mb-4">⭐ Destacados</Badge>
               <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: brand.primary_font || undefined }}>
                 Platos Favoritos
               </h2>
             </div>
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
               {featuredItems.map((item: any, index: number) => (
                 <Card key={index} className="overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300">
                   <AspectRatio ratio={4/3}>
                     <img 
                       src={item.image_url || '/placeholder.svg'} 
                       alt={item.name}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                   </AspectRatio>
                   <CardContent className="p-5">
                     <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-lg">{item.name}</h3>
                       <Badge variant="secondary" className="font-bold">
                         ${item.price?.toLocaleString()}
                       </Badge>
                     </div>
                     <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                   </CardContent>
                 </Card>
               ))}
             </div>
             {website?.show_menu && (
               <div className="text-center mt-10">
                 <Button size="lg" variant="outline" asChild className="gap-2">
                   <Link to={`${basePath}/menu`}>
                     Ver menú completo <ArrowRight className="w-4 h-4" />
                   </Link>
                 </Button>
               </div>
             )}
           </div>
         </section>
       )}
 
       {/* Testimonials Section */}
       {testimonials.length > 0 && (
         <section className="py-20">
           <div className="container mx-auto px-4">
             <div className="text-center mb-12">
               <Badge variant="outline" className="mb-4">💬 Testimonios</Badge>
               <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: brand.primary_font || undefined }}>
                 Lo que dicen nuestros clientes
               </h2>
             </div>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
               {testimonials.map((testimonial: any, index: number) => (
                 <Card key={index} className="p-6 bg-gradient-to-br from-card to-muted/20 border-0">
                   <div className="flex gap-1 mb-4">
                     {[...Array(5)].map((_, i) => (
                       <Star 
                         key={i} 
                         className={`w-5 h-5 ${i < (testimonial.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} 
                       />
                     ))}
                   </div>
                   <p className="text-muted-foreground mb-4 italic">"{testimonial.comment}"</p>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                       <span className="font-bold text-primary">{testimonial.name?.[0] || 'C'}</span>
                     </div>
                     <div>
                       <p className="font-semibold">{testimonial.name || 'Cliente'}</p>
                       <p className="text-sm text-muted-foreground">{testimonial.date || ''}</p>
                     </div>
                   </div>
                 </Card>
               ))}
             </div>
           </div>
         </section>
       )}
 
       {/* Gallery Section */}
       {website?.show_gallery && website.gallery_images.length > 0 && (
         <section className="py-20 bg-muted/30">
           <div className="container mx-auto px-4">
             <div className="text-center mb-12">
               <Badge variant="outline" className="mb-4">📸 Galería</Badge>
               <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: brand.primary_font || undefined }}>
               Galería
               </h2>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
               {website.gallery_images.map((img, i) => (
                 <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-lg group cursor-pointer">
                   <img 
                     src={img} 
                     alt={`Galería ${i + 1}`} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                   />
                 </div>
               ))}
             </div>
           </div>
         </section>
       )}
 
       {/* Map Section */}
       {googleMapsEmbedUrl && website?.show_contact && (
         <section className="py-20">
           <div className="container mx-auto px-4">
             <div className="text-center mb-12">
               <Badge variant="outline" className="mb-4">📍 Ubicación</Badge>
               <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: brand.primary_font || undefined }}>
                 Encuéntranos
               </h2>
             </div>
             <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
               <iframe
                 src={googleMapsEmbedUrl}
                 width="100%"
                 height="400"
                 style={{ border: 0 }}
                 allowFullScreen
                 loading="lazy"
                 referrerPolicy="no-referrer-when-downgrade"
               />
             </div>
           </div>
         </section>
       )}
 
       {/* Hours & Contact Section */}
       {website?.show_contact && (
         <section className="py-20 bg-muted/30">
           <div className="container mx-auto px-4">
             <div className="text-center mb-12">
               <Badge variant="outline" className="mb-4">📞 Contacto</Badge>
               <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: brand.primary_font || undefined }}>
                 Información de Contacto
               </h2>
             </div>
             <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
               {/* Hours */}
               {Object.keys(website.business_hours).length > 0 && (
                 <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
                   <CardContent className="p-6 md:p-8">
                     <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                       <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                       <Clock className="w-6 h-6" style={{ color: brand.accent_color }} />
                       </div>
                       Horarios
                     </h3>
                     <div className="space-y-3">
                       {DAYS.map(day => {
                         const hours = website.business_hours[day];
                         return (
                           <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                             <span className="font-medium">{DAY_NAMES[day]}</span>
                             <span className={hours?.closed ? 'text-destructive' : 'text-muted-foreground'}>
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
               <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
                 <CardContent className="p-6 md:p-8">
                   <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                     <Phone className="w-6 h-6" style={{ color: brand.accent_color }} />
                     </div>
                     Contacto
                   </h3>
                   <div className="space-y-5">
                     {profile?.phone && (
                       <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                         <Phone className="w-5 h-5 text-muted-foreground" />
                         <span className="font-medium">{profile.phone}</span>
                       </a>
                     )}
                     {whatsappNumber && (
                       <a 
                         href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors text-green-600"
                       >
                         <MessageSquare className="w-5 h-5" />
                         <span className="font-medium">WhatsApp</span>
                       </a>
                     )}
                     {profile?.address && (
                       <div className="flex items-center gap-3 p-3">
                         <MapPin className="w-5 h-5 text-muted-foreground" />
                         <span>{profile.address}</span>
                       </div>
                     )}
                     {instagramHandle && (
                       <a 
                         href={`https://instagram.com/${instagramHandle.replace('@', '')}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                       >
                         <Instagram className="w-5 h-5 text-pink-500" />
                         <span className="font-medium">{instagramHandle}</span>
                       </a>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>
         </section>
       )}
 
       {/* CTA Section */}
       {(website?.show_reservations || website?.show_delivery) && (
         <section className="py-20 bg-gradient-to-r from-primary via-primary/95 to-secondary text-primary-foreground">
           <div className="container mx-auto px-4 text-center">
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
               ¿Listo para disfrutar?
             </h2>
             <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
               Reserva tu mesa o pide a domicilio y disfruta de la mejor experiencia gastronómica
             </p>
             <div className="flex flex-wrap gap-4 justify-center">
               {website?.show_reservations && (
                 <Button size="lg" variant="secondary" className="text-lg px-8 h-14 bg-white text-primary hover:bg-white/90" asChild>
                   <Link to={`${basePath}/reservas`}>
                     <CalendarDays className="w-5 h-5 mr-2" />
                     Reservar ahora
                   </Link>
                 </Button>
               )}
               {website?.show_delivery && (
                 <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-white/10 hover:bg-white/20 border-white/30" asChild>
                   <Link to={`${basePath}/domicilios`}>
                     <Truck className="w-5 h-5 mr-2" />
                     Pedir a domicilio
                   </Link>
                 </Button>
               )}
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