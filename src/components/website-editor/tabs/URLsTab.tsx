 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { 
   Globe, Layout, Calendar, Truck, Gift, MessageSquare,
   Copy, ExternalLink, Check, QrCode
 } from 'lucide-react';
 import { useState } from 'react';
 import { useToast } from '@/hooks/use-toast';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 
 interface URLsTabProps {
   website: RestaurantWebsite;
   formData: Partial<RestaurantWebsite>;
   menus: any[];
 }
 
 export function URLsTab({ website, formData, menus }: URLsTabProps) {
   const { toast } = useToast();
   const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
   const origin = typeof window !== 'undefined' ? window.location.origin : '';
 
   const copyUrl = (url: string, label: string) => {
     navigator.clipboard.writeText(url);
     setCopiedUrl(url);
     toast({ title: 'URL copiada', description: label });
     setTimeout(() => setCopiedUrl(null), 2000);
   };
 
   const urls = [
     {
       key: 'website',
       label: 'Sitio Web Principal',
       description: 'Página completa con todas las secciones',
       url: `${origin}/p/${website.slug}`,
       icon: Globe,
       color: 'bg-gradient-to-br from-primary to-primary/80',
       active: website.is_published,
     },
     {
       key: 'menu',
       label: 'Menú Digital',
       description: 'Sección de menú del sitio',
       url: `${origin}/p/${website.slug}/menu`,
       icon: Layout,
       color: 'bg-gradient-to-br from-orange-500 to-orange-600',
       active: formData.show_menu,
     },
     {
       key: 'reservations',
       label: 'Reservaciones',
       description: 'Widget de reservas online',
       url: `${origin}/p/${website.slug}/reservas`,
       icon: Calendar,
       color: 'bg-gradient-to-br from-blue-500 to-blue-600',
       active: formData.show_reservations,
     },
     {
       key: 'delivery',
       label: 'Pedidos a Domicilio',
       description: 'Tienda online sin comisiones',
       url: `${origin}/p/${website.slug}/domicilios`,
       icon: Truck,
       color: 'bg-gradient-to-br from-green-500 to-green-600',
       active: formData.show_delivery,
     },
     {
       key: 'loyalty',
       label: 'Programa de Fidelidad',
       description: 'Portal de puntos para clientes',
       url: `${origin}/p/${website.slug}/fidelidad`,
       icon: Gift,
       color: 'bg-gradient-to-br from-purple-500 to-purple-600',
       active: formData.show_loyalty,
     },
     {
       key: 'feedback',
       label: 'Experiencia / Feedback',
       description: 'Formulario de calificación',
       url: `${origin}/p/${website.slug}/experiencia`,
       icon: MessageSquare,
       color: 'bg-gradient-to-br from-pink-500 to-pink-600',
       active: true,
     },
   ];
 
   return (
     <div className="grid gap-6">
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Globe className="w-5 h-5 text-primary" />
             </div>
             <div>
               <CardTitle>URLs Públicas de tu Restaurante</CardTitle>
               <CardDescription>Todas las direcciones web donde tus clientes pueden encontrarte</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-4">
           {urls.map(item => (
             <div 
               key={item.key}
               className={`p-4 rounded-xl border transition-all ${
                 item.active 
                   ? 'bg-card hover:shadow-md' 
                   : 'bg-muted/30 opacity-60'
               }`}
             >
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                     <item.icon className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <p className="font-semibold">{item.label}</p>
                     <p className="text-sm text-muted-foreground">{item.description}</p>
                   </div>
                 </div>
                 <Badge variant={item.active ? 'default' : 'secondary'}>
                   {item.active ? 'Activo' : 'Inactivo'}
                 </Badge>
               </div>
               <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                 <code className="flex-1 text-sm break-all font-mono">{item.url}</code>
                 <Button 
                   variant="ghost" 
                   size="icon"
                   onClick={() => copyUrl(item.url, item.label)}
                   disabled={!item.active}
                 >
                   {copiedUrl === item.url ? (
                     <Check className="h-4 w-4 text-green-500" />
                   ) : (
                     <Copy className="h-4 w-4" />
                   )}
                 </Button>
                 <Button variant="ghost" size="icon" asChild disabled={!item.active}>
                   <a href={item.url} target="_blank" rel="noopener noreferrer">
                     <ExternalLink className="h-4 w-4" />
                   </a>
                 </Button>
               </div>
             </div>
           ))}
 
           {/* Published Menus */}
           {menus.filter(m => m.status === 'published').length > 0 && (
             <div className="mt-6 pt-6 border-t">
               <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                 Menús Independientes con QR
               </h3>
               {menus.filter(m => m.status === 'published').map(menu => (
                 <div 
                   key={menu.id}
                   className="p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                 >
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                         <QrCode className="w-5 h-5 text-accent-foreground" />
                       </div>
                       <div>
                         <p className="font-semibold">{menu.name}</p>
                         <p className="text-sm text-muted-foreground">Menú digital con código QR</p>
                       </div>
                     </div>
                     <Badge variant="default">Publicado</Badge>
                   </div>
                   <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                     <code className="flex-1 text-sm break-all font-mono">
                       {origin}/menu/{menu.public_url_slug}
                     </code>
                     <Button 
                       variant="ghost" 
                       size="icon"
                       onClick={() => copyUrl(`${origin}/menu/${menu.public_url_slug}`, menu.name)}
                     >
                       {copiedUrl === `${origin}/menu/${menu.public_url_slug}` ? (
                         <Check className="h-4 w-4 text-green-500" />
                       ) : (
                         <Copy className="h-4 w-4" />
                       )}
                     </Button>
                     <Button variant="ghost" size="icon" asChild>
                       <a href={`/menu/${menu.public_url_slug}`} target="_blank" rel="noopener noreferrer">
                         <ExternalLink className="h-4 w-4" />
                       </a>
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           )}
 
           {/* Tip */}
           <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mt-4">
             <p className="text-sm">
               💡 <strong>Tip:</strong> Comparte estas URLs en tus redes sociales, Google Business Profile 
               y materiales impresos. Los menús tienen códigos QR integrados perfectos para tus mesas.
             </p>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }