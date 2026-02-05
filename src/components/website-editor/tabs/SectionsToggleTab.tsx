 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Switch } from '@/components/ui/switch';
 import { Badge } from '@/components/ui/badge';
 import { 
   Layout, Info, UtensilsCrossed, Images, CalendarDays, 
   Truck, Phone, Star, Gift, MessageSquare, Instagram
 } from 'lucide-react';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 
 interface SectionsToggleTabProps {
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
 }
 
 export function SectionsToggleTab({ formData, updateField }: SectionsToggleTabProps) {
   const sections = [
     { key: 'show_about', label: 'Acerca de', description: 'Historia y descripción del restaurante', icon: Info, color: 'bg-blue-500' },
     { key: 'show_menu', label: 'Menú', description: 'Muestra tu menú publicado', icon: UtensilsCrossed, color: 'bg-orange-500' },
     { key: 'show_gallery', label: 'Galería', description: 'Fotos de tus platos y local', icon: Images, color: 'bg-purple-500' },
     { key: 'show_reservations', label: 'Reservaciones', description: 'Permite a clientes hacer reservas online', icon: CalendarDays, color: 'bg-green-500' },
     { key: 'show_delivery', label: 'Domicilios', description: 'Pedidos a domicilio sin comisiones', icon: Truck, color: 'bg-red-500' },
     { key: 'show_contact', label: 'Contacto', description: 'Información de contacto, mapa y redes', icon: Phone, color: 'bg-cyan-500' },
     { key: 'show_reviews', label: 'Reseñas', description: 'Testimonios destacados de clientes', icon: Star, color: 'bg-yellow-500' },
     { key: 'show_loyalty', label: 'Programa de Fidelidad', description: 'Link a tu programa de puntos', icon: Gift, color: 'bg-pink-500' },
   ];
 
   const advancedSections = [
     { key: 'instagram_feed_enabled', label: 'Feed de Instagram', description: 'Muestra tu feed de Instagram en el sitio', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500', badge: 'Próximamente' },
     { key: 'newsletter_enabled', label: 'Newsletter', description: 'Captura emails de tus clientes', icon: MessageSquare, color: 'bg-indigo-500', badge: 'Próximamente' },
   ];
 
   return (
     <div className="grid gap-6">
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Layout className="w-5 h-5 text-primary" />
             </div>
             <div>
               <CardTitle>Secciones del Sitio</CardTitle>
               <CardDescription>Activa o desactiva las secciones que deseas mostrar en tu página</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="grid md:grid-cols-2 gap-4">
             {sections.map(section => {
               const isEnabled = !!formData[section.key as keyof RestaurantWebsite];
               return (
                 <div 
                   key={section.key} 
                   className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                     isEnabled 
                       ? 'bg-primary/5 border-primary/30' 
                       : 'bg-muted/30 border-transparent hover:border-border'
                   }`}
                 >
                   <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center flex-shrink-0`}>
                     <section.icon className="w-5 h-5 text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-medium truncate">{section.label}</p>
                     <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                   </div>
                   <Switch
                     checked={isEnabled}
                     onCheckedChange={(checked) => updateField(section.key as keyof RestaurantWebsite, checked as never)}
                   />
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
 
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center justify-between">
             <div>
               <CardTitle>Funciones Avanzadas</CardTitle>
               <CardDescription>Integraciones y características adicionales</CardDescription>
             </div>
             <Badge variant="secondary">Próximamente</Badge>
           </div>
         </CardHeader>
         <CardContent>
           <div className="grid md:grid-cols-2 gap-4">
             {advancedSections.map(section => (
               <div 
                 key={section.key} 
                 className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30 opacity-60"
               >
                 <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center flex-shrink-0`}>
                   <section.icon className="w-5 h-5 text-white" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <p className="font-medium">{section.label}</p>
                     <Badge variant="outline" className="text-xs">{section.badge}</Badge>
                   </div>
                   <p className="text-xs text-muted-foreground">{section.description}</p>
                 </div>
                 <Switch disabled />
               </div>
             ))}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }