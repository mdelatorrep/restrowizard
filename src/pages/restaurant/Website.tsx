 import { useState, useEffect } from 'react';
 import { useRestaurantWebsite, RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 import { useBrandData } from '@/hooks/useBrandData';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { 
   Globe, Eye, EyeOff, ExternalLink, Copy, Check, 
   Layout, Zap, Loader2, Save, Smartphone, Monitor
 } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 import { useMenus } from '@/hooks/useMenus';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { WebsiteEditorTabs } from '@/components/website-editor/WebsiteEditorTabs';
 import { PageHeader } from '@/components/layout';
 
 interface DeliveryZone {
   id: string;
   zone_name: string;
   min_order: number | null;
   delivery_fee: number | null;
   estimated_time_minutes: number | null;
   is_active: boolean;
 }
 
 export default function WebsitePage() {
   const { website, templates, loading, createWebsite, updateWebsite, publishWebsite, checkSlugAvailability } = useRestaurantWebsite();
   const { brand } = useBrandData();
   const { menus } = useMenus();
   const { user } = useAuth();
   const { toast } = useToast();
   
   const [newSlug, setNewSlug] = useState('');
   const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
   const [checking, setChecking] = useState(false);
   const [saving, setSaving] = useState(false);
   const [copied, setCopied] = useState(false);
   const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
   
   const [formData, setFormData] = useState<Partial<RestaurantWebsite>>({});
   const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed?: boolean }>>({});
   const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
   const [zonesLoading, setZonesLoading] = useState(false);
 
   useEffect(() => {
     if (website) {
       setFormData(website);
       setBusinessHours(website.business_hours || {});
       loadDeliveryZones();
     }
   }, [website]);
 
   const loadDeliveryZones = async () => {
     if (!user?.id) return;
     setZonesLoading(true);
     const { data } = await supabase
       .from('delivery_zones')
       .select('*')
       .eq('user_id', user.id)
       .order('zone_name');
     
     if (data) {
       setDeliveryZones(data as DeliveryZone[]);
     }
     setZonesLoading(false);
   };
 
   const addDeliveryZone = async () => {
     if (!user?.id) return;
     
     const { data, error } = await supabase
       .from('delivery_zones')
       .insert({
         user_id: user.id,
         zone_name: 'Nueva zona',
         min_order: 0,
         delivery_fee: 5000,
         estimated_time_minutes: 30,
         is_active: true,
       })
       .select()
       .single();
 
     if (data) {
       setDeliveryZones(prev => [...prev, data as DeliveryZone]);
       toast({ title: 'Zona creada', description: 'Configura los detalles de la zona' });
     }
   };
 
   const updateDeliveryZone = async (id: string, updates: Partial<DeliveryZone>) => {
     const { error } = await supabase
       .from('delivery_zones')
       .update(updates)
       .eq('id', id);
 
     if (!error) {
       setDeliveryZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
     }
   };
 
   const deleteDeliveryZone = async (id: string) => {
     const { error } = await supabase
       .from('delivery_zones')
       .delete()
       .eq('id', id);
 
     if (!error) {
       setDeliveryZones(prev => prev.filter(z => z.id !== id));
       toast({ title: 'Zona eliminada' });
     }
   };
 
  const handleCheckSlug = async () => {
    if (!newSlug) return;
    setChecking(true);
    const available = await checkSlugAvailability(newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    setSlugAvailable(available);
    setChecking(false);
    return available;
  };

  // Auto-verificar slug con debounce: el usuario no necesita pulsar "Verificar".
  useEffect(() => {
    if (!newSlug) { setSlugAvailable(null); return; }
    const t = setTimeout(() => { handleCheckSlug(); }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSlug]);

  const handleCreateWebsite = async () => {
    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    // Si por alguna razón no se ha verificado todavía, verificar antes de crear.
    if (slugAvailable === null) {
      const ok = await handleCheckSlug();
      if (!ok) return;
    }
    if (slugAvailable === false) return;
    await createWebsite(slug);
  };

 
   const handleSave = async () => {
     setSaving(true);
     await updateWebsite({
       ...formData,
       business_hours: businessHours,
     });
     setSaving(false);
   };
 
   const handlePublishToggle = async () => {
     await publishWebsite(!website?.is_published);
   };
 
   const copyUrl = () => {
     if (!website) return;
     const url = `${window.location.origin}/p/${website.slug}`;
     navigator.clipboard.writeText(url);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
   };
 
   const updateField = <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => {
     setFormData(prev => ({ ...prev, [field]: value }));
   };
 
   const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
     setBusinessHours(prev => ({
       ...prev,
       [day]: {
         ...prev[day],
         [field]: value,
       },
     }));
   };
 
   if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   // Create website flow
   if (!website) {
     return (
       <div className="space-y-6 p-4 md:p-6">
         <PageHeader
           title="Sitio Web"
           subtitle="Crea tu sitio web profesional en minutos"
           icon={Globe}
         />
 
         <div className="max-w-4xl mx-auto">
           <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20 overflow-hidden">
             <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-8 text-center">
               <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                 <Globe className="w-8 h-8 text-primary" />
               </div>
               <h2 className="text-2xl font-bold mb-2">Crea tu Sitio Web</h2>
               <p className="text-muted-foreground max-w-md mx-auto">
                 Tu restaurante merece presencia digital profesional. Menú digital, reservas online, 
                 pedidos a domicilio y más — todo sin comisiones.
               </p>
             </div>
             <CardContent className="p-6 space-y-6">
               <div className="space-y-3">
                 <label className="text-sm font-medium">URL de tu restaurante</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground whitespace-nowrap">
                      <Globe className="w-4 h-4" />
                      {window.location.origin}/p/
                    </div>
                    <Input
                      value={newSlug}
                      onChange={(e) => {
                        setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                        setSlugAvailable(null);
                      }}
                      placeholder="mi-restaurante"
                      className="flex-1 h-11"
                    />
                  </div>
                  {newSlug && (
                    <p className={`text-sm flex items-center gap-1 ${
                      checking ? 'text-muted-foreground' :
                      slugAvailable === true ? 'text-green-600' :
                      slugAvailable === false ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {checking ? 'Verificando…'
                        : slugAvailable === true ? '✓ ¡Disponible!'
                        : slugAvailable === false ? '✗ Este nombre ya está en uso'
                        : ''}
                    </p>
                  )}
               </div>
 
               {templates.length > 0 && (
                 <div className="space-y-3">
                   <label className="text-sm font-medium">Elige una plantilla</label>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {templates.map(template => (
                       <button
                         key={template.id}
                         type="button"
                         className="p-4 border-2 rounded-xl text-left hover:border-primary/50 transition-all group"
                       >
                         <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                           <Layout className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                         </div>
                         <h3 className="font-semibold text-sm">{template.name}</h3>
                         <p className="text-xs text-muted-foreground">{template.description}</p>
                       </button>
                     ))}
                   </div>
                 </div>
               )}
 
                <Button 
                  onClick={handleCreateWebsite} 
                  disabled={!newSlug || checking || slugAvailable === false}
                  className="w-full h-12 text-base gap-2"
                  size="lg"
                >
                  <Zap className="h-5 w-5" />
                  Crear mi sitio web gratis
                </Button>

 
               <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                 <div className="text-center">
                   <p className="text-2xl font-bold text-primary">0%</p>
                   <p className="text-xs text-muted-foreground">Comisión pedidos</p>
                 </div>
                 <div className="text-center">
                   <p className="text-2xl font-bold text-primary">∞</p>
                   <p className="text-xs text-muted-foreground">Pedidos ilimitados</p>
                 </div>
                 <div className="text-center">
                   <p className="text-2xl font-bold text-primary">5min</p>
                   <p className="text-xs text-muted-foreground">Para publicar</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   // Website editor
   const siteUrl = `${window.location.origin}/p/${website.slug}`;
 
   return (
     <div className="space-y-6 p-4 md:p-6">
       <PageHeader
         title="Sitio Web"
         subtitle="Personaliza y gestiona tu presencia online"
         icon={Globe}
         actions={
           <div className="flex items-center gap-2 flex-wrap justify-end">
             <Button variant="outline" size="sm" onClick={copyUrl} className="gap-2">
               {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
               <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar URL'}</span>
             </Button>
             <Button variant="outline" size="sm" asChild className="gap-2">
               <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                 <ExternalLink className="h-4 w-4" />
                 <span className="hidden sm:inline">Ver sitio</span>
               </a>
             </Button>
             <Button 
               onClick={handleSave} 
               disabled={saving}
               size="sm"
               className="gap-2"
             >
               {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               <span className="hidden sm:inline">Guardar</span>
             </Button>
             <Button 
               variant={website.is_published ? "destructive" : "default"}
               onClick={handlePublishToggle}
               size="sm"
               className="gap-2"
             >
               {website.is_published ? (
                 <>
                   <EyeOff className="h-4 w-4" />
                   <span className="hidden sm:inline">Despublicar</span>
                 </>
               ) : (
                 <>
                   <Eye className="h-4 w-4" />
                   <span className="hidden sm:inline">Publicar</span>
                 </>
               )}
             </Button>
           </div>
         }
       />
 
       {/* Status Card */}
       <Card className="border-0 shadow-lg bg-gradient-to-r from-card via-card to-primary/5">
         <CardContent className="p-4">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <Badge 
                 variant={website.is_published ? "default" : "secondary"}
                 className="h-7 px-3"
               >
                 {website.is_published ? '🟢 Publicado' : '⚪ Borrador'}
               </Badge>
               <code className="text-sm text-muted-foreground hidden sm:block">{siteUrl}</code>
             </div>
             <div className="flex items-center gap-2">
               <Button
                 variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                 size="icon"
                 className="h-8 w-8"
                 onClick={() => setPreviewMode('desktop')}
               >
                 <Monitor className="h-4 w-4" />
               </Button>
               <Button
                 variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                 size="icon"
                 className="h-8 w-8"
                 onClick={() => setPreviewMode('mobile')}
               >
                 <Smartphone className="h-4 w-4" />
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Editor Tabs */}
       <WebsiteEditorTabs
         website={website}
         formData={formData}
         updateField={updateField}
         businessHours={businessHours}
         updateHours={updateHours}
         deliveryZones={deliveryZones}
         addDeliveryZone={addDeliveryZone}
         updateDeliveryZone={updateDeliveryZone}
         deleteDeliveryZone={deleteDeliveryZone}
         zonesLoading={zonesLoading}
         menus={menus}
         brand={brand}
         onPreview={() => {}}
       />
 
       {/* Floating Save Button on Mobile */}
       <div className="fixed bottom-6 right-6 md:hidden z-50">
         <Button 
           onClick={handleSave} 
           disabled={saving}
           size="lg"
           className="h-14 w-14 rounded-full shadow-xl"
         >
           {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
         </Button>
       </div>
     </div>
   );
 }