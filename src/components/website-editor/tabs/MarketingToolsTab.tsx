 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Megaphone, Bell, MessageSquareText, MapPin } from 'lucide-react';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 
 interface MarketingToolsTabProps {
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
 }
 
 export function MarketingToolsTab({ formData, updateField }: MarketingToolsTabProps) {
   return (
     <div className="grid gap-6">
       {/* Promo Banner */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
               <Megaphone className="w-5 h-5 text-white" />
             </div>
             <div className="flex-1">
               <CardTitle>Banner Promocional</CardTitle>
               <CardDescription>Muestra ofertas y promociones en la parte superior de tu sitio</CardDescription>
             </div>
             <Switch
               checked={!!(formData as any).promo_banner_enabled}
               onCheckedChange={(checked) => updateField('promo_banner_enabled' as keyof RestaurantWebsite, checked as never)}
             />
           </div>
         </CardHeader>
         {(formData as any).promo_banner_enabled && (
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Texto del banner</Label>
               <Input
                 value={(formData as any).promo_banner_text || ''}
                 onChange={e => updateField('promo_banner_text' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="🔥 ¡20% OFF en todos los pedidos online!"
                 className="h-11"
               />
             </div>
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Link (opcional)</Label>
                 <Input
                   value={(formData as any).promo_banner_link || ''}
                   onChange={e => updateField('promo_banner_link' as keyof RestaurantWebsite, e.target.value as never)}
                   placeholder="https://..."
                   className="h-11"
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Color de fondo</Label>
                 <div className="flex gap-2">
                   <Input
                     type="color"
                     value={(formData as any).promo_banner_bg_color || '#f97316'}
                     onChange={e => updateField('promo_banner_bg_color' as keyof RestaurantWebsite, e.target.value as never)}
                     className="w-16 h-11 p-1"
                   />
                   <Input
                     value={(formData as any).promo_banner_bg_color || '#f97316'}
                     onChange={e => updateField('promo_banner_bg_color' as keyof RestaurantWebsite, e.target.value as never)}
                     placeholder="#f97316"
                     className="h-11 flex-1"
                   />
                 </div>
               </div>
             </div>
           </CardContent>
         )}
       </Card>
 
       {/* Announcement Bar */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
               <Bell className="w-5 h-5 text-white" />
             </div>
             <div className="flex-1">
               <CardTitle>Barra de Anuncios</CardTitle>
               <CardDescription>Información importante que siempre está visible</CardDescription>
             </div>
             <Switch
               checked={!!(formData as any).announcement_bar_enabled}
               onCheckedChange={(checked) => updateField('announcement_bar_enabled' as keyof RestaurantWebsite, checked as never)}
             />
           </div>
         </CardHeader>
         {(formData as any).announcement_bar_enabled && (
           <CardContent>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Texto del anuncio</Label>
               <Input
                 value={(formData as any).announcement_bar_text || ''}
                 onChange={e => updateField('announcement_bar_text' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="📍 Abrimos nuevo local en el norte de la ciudad"
                 className="h-11"
               />
             </div>
           </CardContent>
         )}
       </Card>
 
       {/* Popup */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                 <MessageSquareText className="w-5 h-5 text-white" />
               </div>
               <div>
                 <CardTitle>Popup de Bienvenida</CardTitle>
                 <CardDescription>Captura leads o muestra ofertas especiales</CardDescription>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <Badge variant="secondary">Próximamente</Badge>
               <Switch disabled />
             </div>
           </div>
         </CardHeader>
       </Card>
 
       {/* Google Maps */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
               <MapPin className="w-5 h-5 text-white" />
             </div>
             <div>
               <CardTitle>Mapa de Ubicación</CardTitle>
               <CardDescription>Muestra tu ubicación en Google Maps</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label className="text-sm font-medium">URL de embed de Google Maps</Label>
             <Textarea
               value={(formData as any).google_maps_embed_url || ''}
               onChange={e => updateField('google_maps_embed_url' as keyof RestaurantWebsite, e.target.value as never)}
               placeholder="https://www.google.com/maps/embed?pb=..."
               rows={2}
               className="resize-none font-mono text-sm"
             />
             <p className="text-xs text-muted-foreground">
               Obtén el código de embed desde Google Maps → Compartir → Incorporar un mapa
             </p>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }