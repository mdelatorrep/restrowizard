 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import { Label } from '@/components/ui/label';
 import { Building2 } from 'lucide-react';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 import type { Tables } from '@/integrations/supabase/types';
 
 const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
 const DAY_NAMES: Record<string, string> = {
   monday: 'Lunes',
   tuesday: 'Martes',
   wednesday: 'Miércoles',
   thursday: 'Jueves',
   friday: 'Viernes',
   saturday: 'Sábado',
   sunday: 'Domingo',
 };
 
 interface GeneralSettingsTabProps {
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
   businessHours: Record<string, { open: string; close: string; closed?: boolean }>;
   updateHours: (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => void;
   brand: Tables<'restaurant_brands'> | null;
   websiteSlug: string;
 }
 
 export function GeneralSettingsTab({
   formData,
   updateField,
   businessHours,
   updateHours,
   brand,
   websiteSlug,
 }: GeneralSettingsTabProps) {
   return (
     <div className="grid gap-6">
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Building2 className="w-5 h-5 text-primary" />
             </div>
             <div>
               <CardTitle>Configuración General</CardTitle>
               <CardDescription>Información básica y metadatos de tu sitio web</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Título del sitio</Label>
               <Input
                 value={(formData.site_title as string) || ''}
                 onChange={e => updateField('site_title', e.target.value)}
                 placeholder={brand?.brand_name || 'Mi Restaurante'}
                 className="h-11"
               />
               <p className="text-xs text-muted-foreground">Aparece en la pestaña del navegador y resultados de Google</p>
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">URL del sitio</Label>
               <Input value={websiteSlug} disabled className="h-11 bg-muted" />
               <p className="text-xs text-muted-foreground">No se puede cambiar después de creado</p>
             </div>
           </div>
           
           <div className="space-y-2">
             <Label className="text-sm font-medium">Meta descripción</Label>
             <Textarea
               value={(formData.meta_description as string) || ''}
               onChange={e => updateField('meta_description', e.target.value)}
               placeholder="Descripción de tu restaurante para motores de búsqueda..."
               rows={3}
               className="resize-none"
             />
             <div className="flex justify-between">
               <p className="text-xs text-muted-foreground">Aparece en resultados de Google</p>
               <p className="text-xs text-muted-foreground">
                 {((formData.meta_description as string) || '').length}/160
               </p>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label className="text-sm font-medium">Texto del footer</Label>
             <Input
               value={(formData as any).footer_text || ''}
               onChange={e => updateField('footer_text' as keyof RestaurantWebsite, e.target.value as never)}
               placeholder={`© ${new Date().getFullYear()} ${brand?.brand_name || (formData.site_title as string) || 'Mi Restaurante'}. Todos los derechos reservados.`}
               className="h-11"
             />
           </div>
         </CardContent>
       </Card>
 
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <CardTitle>Acerca de</CardTitle>
           <CardDescription>Historia y descripción de tu restaurante</CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="space-y-2">
             <Label className="text-sm font-medium">Título de la sección</Label>
             <Input
               value={(formData.about_title as string) || ''}
               onChange={e => updateField('about_title', e.target.value)}
               placeholder="Nuestra Historia"
               className="h-11"
             />
           </div>
           
           <div className="space-y-2">
             <Label className="text-sm font-medium">Descripción</Label>
             <Textarea
               value={(formData.about_description as string) || ''}
               onChange={e => updateField('about_description', e.target.value)}
               placeholder="Cuenta la historia de tu restaurante..."
               rows={4}
               className="resize-none"
             />
           </div>
 
           <div className="space-y-2">
             <Label className="text-sm font-medium">URL de imagen</Label>
             <Input
               value={(formData.about_image_url as string) || ''}
               onChange={e => updateField('about_image_url', e.target.value)}
               placeholder="https://..."
               className="h-11"
             />
           </div>
         </CardContent>
       </Card>
 
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <CardTitle>Horarios de atención</CardTitle>
           <CardDescription>Define los horarios de tu restaurante</CardDescription>
         </CardHeader>
         <CardContent className="space-y-2">
           {DAYS.map(day => (
             <div key={day} className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-0">
               <div className="w-28">
                 <p className="font-medium text-sm">{DAY_NAMES[day]}</p>
               </div>
               <div className="flex items-center gap-2">
                 <Switch
                   checked={!businessHours[day]?.closed}
                   onCheckedChange={(checked) => updateHours(day, 'closed', !checked)}
                 />
                 <span className={`text-sm ${businessHours[day]?.closed ? 'text-destructive' : 'text-green-600'}`}>
                   {businessHours[day]?.closed ? 'Cerrado' : 'Abierto'}
                 </span>
               </div>
               {!businessHours[day]?.closed && (
                 <div className="flex items-center gap-2 ml-auto">
                   <Input
                     type="time"
                     value={businessHours[day]?.open || '09:00'}
                     onChange={e => updateHours(day, 'open', e.target.value)}
                     className="w-28 h-9"
                   />
                   <span className="text-muted-foreground">a</span>
                   <Input
                     type="time"
                     value={businessHours[day]?.close || '22:00'}
                     onChange={e => updateHours(day, 'close', e.target.value)}
                     className="w-28 h-9"
                   />
                 </div>
               )}
             </div>
           ))}
         </CardContent>
       </Card>
     </div>
   );
 }