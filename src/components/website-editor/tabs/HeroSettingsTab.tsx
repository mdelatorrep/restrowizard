 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Badge } from '@/components/ui/badge';
 import { Image, Film, Sparkles } from 'lucide-react';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 import type { Tables } from '@/integrations/supabase/types';
 
 interface HeroSettingsTabProps {
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
   brand: Tables<'restaurant_brands'> | null;
 }
 
 export function HeroSettingsTab({ formData, updateField, brand }: HeroSettingsTabProps) {
   const heroStyle = (formData as any).hero_style || 'fullscreen';
   
   return (
     <div className="grid gap-6">
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
               <Sparkles className="w-5 h-5 text-white" />
             </div>
             <div>
               <CardTitle>Estilo del Hero</CardTitle>
               <CardDescription>Elige cómo se verá la sección principal de tu sitio</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid md:grid-cols-3 gap-4">
             {[
               { value: 'fullscreen', label: 'Pantalla Completa', desc: 'Impacto visual máximo', icon: '🖼️' },
               { value: 'split', label: 'Dividido', desc: 'Imagen + contenido lado a lado', icon: '◧' },
               { value: 'minimal', label: 'Minimalista', desc: 'Elegante y limpio', icon: '○' },
             ].map(style => (
               <button
                 key={style.value}
                 type="button"
                 onClick={() => updateField('hero_style' as keyof RestaurantWebsite, style.value as never)}
                 className={`p-4 rounded-xl border-2 text-left transition-all ${
                   heroStyle === style.value 
                     ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                     : 'border-border hover:border-primary/50'
                 }`}
               >
                 <div className="text-2xl mb-2">{style.icon}</div>
                 <p className="font-semibold">{style.label}</p>
                 <p className="text-xs text-muted-foreground">{style.desc}</p>
               </button>
             ))}
           </div>
         </CardContent>
       </Card>
 
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Image className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <CardTitle>Contenido del Hero</CardTitle>
                 <CardDescription>La primera impresión de tu restaurante</CardDescription>
               </div>
             </div>
             <Badge variant="outline" className="gap-1">
               <Film className="w-3 h-3" /> Soporta video
             </Badge>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Imagen de fondo URL</Label>
               <Input
                 value={(formData.hero_image_url as string) || ''}
                 onChange={e => updateField('hero_image_url', e.target.value)}
                 placeholder="https://..."
                 className="h-11"
               />
               <p className="text-xs text-muted-foreground">Recomendado: 1920x1080px mínimo, formato JPG/WebP</p>
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium flex items-center gap-2">
                 Video de fondo URL
                 <Badge variant="secondary" className="text-xs">Opcional</Badge>
               </Label>
               <Input
                 value={(formData as any).hero_video_url || ''}
                 onChange={e => updateField('hero_video_url' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="https://... (MP4 o YouTube)"
                 className="h-11"
               />
               <p className="text-xs text-muted-foreground">El video reemplaza la imagen cuando está presente</p>
             </div>
           </div>
 
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Título principal</Label>
               <Input
                 value={(formData.hero_title as string) || ''}
                 onChange={e => updateField('hero_title', e.target.value)}
                 placeholder={brand?.brand_name || 'Bienvenidos'}
                 className="h-11"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Subtítulo</Label>
               <Input
                 value={(formData.hero_subtitle as string) || ''}
                 onChange={e => updateField('hero_subtitle', e.target.value)}
                 placeholder={brand?.tagline || 'Una experiencia culinaria única'}
                 className="h-11"
               />
             </div>
           </div>
 
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Texto del botón (CTA)</Label>
               <Input
                 value={(formData.hero_cta_text as string) || ''}
                 onChange={e => updateField('hero_cta_text', e.target.value)}
                 placeholder="Ver Menú"
                 className="h-11"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Link del botón</Label>
               <Input
                 value={(formData.hero_cta_link as string) || ''}
                 onChange={e => updateField('hero_cta_link', e.target.value)}
                 placeholder="#menu o /p/mi-restaurante/menu"
                 className="h-11"
               />
             </div>
           </div>
 
           {/* Preview hint */}
           <div className="p-4 bg-muted/50 rounded-xl border border-dashed">
             <p className="text-sm text-muted-foreground">
               💡 <strong>Tip:</strong> Usa imágenes de alta calidad de tus platos o del interior del restaurante. 
               Los videos de fondo crean un impacto visual mayor pero pueden afectar la velocidad de carga.
             </p>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }