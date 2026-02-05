 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { Palette, Sparkles, Instagram } from 'lucide-react';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 import type { Tables } from '@/integrations/supabase/types';
 
 interface DesignCustomizationTabProps {
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
   brand: Tables<'restaurant_brands'> | null;
 }
 
 export function DesignCustomizationTab({ formData, updateField, brand }: DesignCustomizationTabProps) {
   const layoutVariant = (formData as any).layout_variant || 'classic';
   const colorScheme = (formData as any).color_scheme || 'auto';
 
   return (
     <div className="grid gap-6">
       {/* Layout Variants */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
               <Sparkles className="w-5 h-5 text-white" />
             </div>
             <div>
               <CardTitle>Estilo del Sitio</CardTitle>
               <CardDescription>Elige el diseño general de tu página web</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid md:grid-cols-3 gap-4">
             {[
               { value: 'classic', label: 'Clásico', desc: 'Elegante y profesional', emoji: '🏛️' },
               { value: 'modern', label: 'Moderno', desc: 'Minimalista y limpio', emoji: '✨' },
               { value: 'bold', label: 'Audaz', desc: 'Colores vibrantes', emoji: '🔥' },
             ].map(layout => (
               <button
                 key={layout.value}
                 type="button"
                 onClick={() => updateField('layout_variant' as keyof RestaurantWebsite, layout.value as never)}
                 className={`p-4 rounded-xl border-2 text-left transition-all ${
                   layoutVariant === layout.value 
                     ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                     : 'border-border hover:border-primary/50'
                 }`}
               >
                 <div className="text-2xl mb-2">{layout.emoji}</div>
                 <p className="font-semibold">{layout.label}</p>
                 <p className="text-xs text-muted-foreground">{layout.desc}</p>
               </button>
             ))}
           </div>
 
           <div>
             <Label className="text-sm font-medium mb-3 block">Esquema de colores</Label>
             <div className="grid grid-cols-3 gap-3">
               {[
                 { value: 'auto', label: 'Automático', desc: 'Según preferencia del usuario' },
                 { value: 'light', label: 'Claro', desc: 'Siempre fondo claro' },
                 { value: 'dark', label: 'Oscuro', desc: 'Siempre fondo oscuro' },
               ].map(scheme => (
                 <button
                   key={scheme.value}
                   type="button"
                   onClick={() => updateField('color_scheme' as keyof RestaurantWebsite, scheme.value as never)}
                   className={`p-3 rounded-lg border text-center transition-all ${
                     colorScheme === scheme.value 
                       ? 'border-primary bg-primary/5' 
                       : 'border-border hover:border-primary/50'
                   }`}
                 >
                   <p className="font-medium text-sm">{scheme.label}</p>
                   <p className="text-xs text-muted-foreground">{scheme.desc}</p>
                 </button>
               ))}
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Brand Colors Preview */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Palette className="w-5 h-5 text-primary" />
             </div>
             <div className="flex-1">
               <CardTitle>Colores de tu Marca</CardTitle>
               <CardDescription>Los colores se heredan de tu configuración de marca</CardDescription>
             </div>
             <Badge variant="outline">Automático</Badge>
           </div>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
               <div 
                 className="h-20 rounded-xl border-2 border-dashed flex items-center justify-center"
                 style={{ backgroundColor: brand?.primary_color || '#6366f1' }}
               >
                 <span className="text-white font-medium text-shadow">Primario</span>
               </div>
               <p className="text-xs text-center text-muted-foreground">
                 {brand?.primary_color || 'Por defecto'}
               </p>
             </div>
             <div className="space-y-2">
               <div 
                 className="h-20 rounded-xl border-2 border-dashed flex items-center justify-center"
                 style={{ backgroundColor: brand?.secondary_color || '#8b5cf6' }}
               >
                 <span className="text-white font-medium">Secundario</span>
               </div>
               <p className="text-xs text-center text-muted-foreground">
                 {brand?.secondary_color || 'Por defecto'}
               </p>
             </div>
             <div className="space-y-2">
               <div 
                 className="h-20 rounded-xl border-2 border-dashed flex items-center justify-center"
                 style={{ backgroundColor: brand?.accent_color || '#f97316' }}
               >
                 <span className="text-white font-medium">Acento</span>
               </div>
               <p className="text-xs text-center text-muted-foreground">
                 {brand?.accent_color || 'Por defecto'}
               </p>
             </div>
           </div>
           <p className="text-sm text-muted-foreground mt-4 text-center">
             Para cambiar los colores, ve al módulo de <strong>Marca</strong>
           </p>
         </CardContent>
       </Card>
 
       {/* Instagram Integration */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                 <Instagram className="w-5 h-5 text-white" />
               </div>
               <div>
                 <CardTitle>Instagram Handle</CardTitle>
                 <CardDescription>Para mostrar tu feed y botón de seguir</CardDescription>
               </div>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="space-y-2">
             <Label className="text-sm font-medium">Usuario de Instagram</Label>
             <Input
               value={(formData as any).instagram_handle || ''}
               onChange={e => updateField('instagram_handle' as keyof RestaurantWebsite, e.target.value as never)}
               placeholder="@mirestaurante"
               className="h-11"
             />
           </div>
         </CardContent>
       </Card>
 
       {/* Footer Settings */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <CardTitle>Configuración del Footer</CardTitle>
           <CardDescription>Personaliza la parte inferior de tu sitio</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center justify-between p-4 rounded-xl border">
             <div>
               <p className="font-medium">Mostrar "Powered by RestroWizard"</p>
               <p className="text-sm text-muted-foreground">Badge de crédito en el footer</p>
             </div>
             <Switch
               checked={(formData as any).show_powered_by !== false}
               onCheckedChange={(checked) => updateField('show_powered_by' as keyof RestaurantWebsite, checked as never)}
             />
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }