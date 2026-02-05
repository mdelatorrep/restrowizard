 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Search, BarChart3, Share2, Code } from 'lucide-react';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 
 interface SEOAnalyticsTabProps {
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
   websiteSlug: string;
 }
 
 export function SEOAnalyticsTab({ formData, updateField, websiteSlug }: SEOAnalyticsTabProps) {
   const origin = typeof window !== 'undefined' ? window.location.origin : '';
   const siteUrl = `${origin}/p/${websiteSlug}`;
 
   return (
     <div className="grid gap-6">
       {/* SEO Section */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
               <Search className="w-5 h-5 text-white" />
             </div>
             <div>
               <CardTitle>SEO y Meta Tags</CardTitle>
               <CardDescription>Optimiza tu sitio para aparecer en Google y redes sociales</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="p-4 rounded-xl bg-muted/50 border">
             <p className="text-sm font-medium mb-1">Vista previa en Google</p>
             <div className="space-y-1">
               <p className="text-blue-600 text-lg truncate">
                 {(formData.site_title as string) || 'Mi Restaurante'} | Restaurante
               </p>
               <p className="text-green-700 text-sm truncate">{siteUrl}</p>
               <p className="text-sm text-muted-foreground line-clamp-2">
                 {(formData.meta_description as string) || 'Descripción de tu restaurante...'}
               </p>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label className="text-sm font-medium">Schema Type</Label>
             <Input
               value={(formData as any).schema_type || 'Restaurant'}
               onChange={e => updateField('schema_type' as keyof RestaurantWebsite, e.target.value as never)}
               placeholder="Restaurant"
               className="h-11"
             />
             <p className="text-xs text-muted-foreground">
               Tipos recomendados: Restaurant, CafeOrCoffeeShop, Bakery, BarOrPub, FastFoodRestaurant
             </p>
           </div>
         </CardContent>
       </Card>
 
       {/* Open Graph */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
               <Share2 className="w-5 h-5 text-white" />
             </div>
             <div>
               <CardTitle>Open Graph (Redes Sociales)</CardTitle>
               <CardDescription>Cómo se ve tu sitio cuando lo comparten en Facebook, Twitter, etc.</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">OG Título</Label>
               <Input
                 value={(formData as any).og_title || ''}
                 onChange={e => updateField('og_title' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder={(formData.site_title as string) || 'Título para redes'}
                 className="h-11"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">OG Imagen URL</Label>
               <Input
                 value={(formData as any).og_image_url || ''}
                 onChange={e => updateField('og_image_url' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="https://... (1200x630px recomendado)"
                 className="h-11"
               />
             </div>
           </div>
           <div className="space-y-2">
             <Label className="text-sm font-medium">OG Descripción</Label>
             <Textarea
               value={(formData as any).og_description || ''}
               onChange={e => updateField('og_description' as keyof RestaurantWebsite, e.target.value as never)}
               placeholder="Descripción para redes sociales..."
               rows={2}
               className="resize-none"
             />
           </div>
         </CardContent>
       </Card>
 
       {/* Analytics & Tracking */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
               <BarChart3 className="w-5 h-5 text-white" />
             </div>
             <div className="flex-1">
               <CardTitle>Analytics y Tracking</CardTitle>
               <CardDescription>Integra herramientas de medición para entender a tus visitantes</CardDescription>
             </div>
             <Badge variant="outline">Opcional</Badge>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Google Analytics ID</Label>
               <Input
                 value={(formData.google_analytics_id as string) || ''}
                 onChange={e => updateField('google_analytics_id', e.target.value)}
                 placeholder="G-XXXXXXXXXX"
                 className="h-11"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Google Tag Manager ID</Label>
               <Input
                 value={(formData as any).gtm_id || ''}
                 onChange={e => updateField('gtm_id' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="GTM-XXXXXXX"
                 className="h-11"
               />
             </div>
           </div>
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Facebook Pixel ID</Label>
               <Input
                 value={(formData as any).facebook_pixel_id || ''}
                 onChange={e => updateField('facebook_pixel_id' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="XXXXXXXXXXXXXXX"
                 className="h-11"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">TikTok Pixel ID</Label>
               <Input
                 value={(formData as any).tiktok_pixel_id || ''}
                 onChange={e => updateField('tiktok_pixel_id' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="XXXXXXXXXXXXXXX"
                 className="h-11"
               />
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Custom Scripts */}
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
               <Code className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <CardTitle>Scripts Personalizados</CardTitle>
               <CardDescription>Código personalizado para integraciones avanzadas</CardDescription>
             </div>
             <Badge variant="secondary">Avanzado</Badge>
           </div>
         </CardHeader>
         <CardContent>
           <div className="space-y-2">
             <Label className="text-sm font-medium">Código HTML/JS (se inyecta en el head)</Label>
             <Textarea
               value={(formData.custom_scripts as string) || ''}
               onChange={e => updateField('custom_scripts', e.target.value)}
               placeholder="<!-- Tu código aquí -->"
               rows={4}
               className="font-mono text-sm resize-none"
             />
             <p className="text-xs text-muted-foreground">
               ⚠️ Solo agrega código de fuentes confiables. Código malicioso puede afectar tu sitio.
             </p>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }