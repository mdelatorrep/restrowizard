import { useState, useEffect } from 'react';
import { useRestaurantWebsite, WebsiteTemplate, RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
import { useBrandData } from '@/hooks/useBrandData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, Eye, EyeOff, ExternalLink, Copy, Check, 
  Palette, Layout, Image, Clock, Settings, Zap,
  Calendar, Truck, Save, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function WebsitePage() {
  const { website, templates, loading, createWebsite, updateWebsite, publishWebsite, checkSlugAvailability } = useRestaurantWebsite();
  const { brand } = useBrandData();
  const { toast } = useToast();
  
  const [newSlug, setNewSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState<Partial<RestaurantWebsite>>({});
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed?: boolean }>>({});

  useEffect(() => {
    if (website) {
      setFormData(website);
      setBusinessHours(website.business_hours || {});
    }
  }, [website]);

  const handleCheckSlug = async () => {
    if (!newSlug) return;
    
    setChecking(true);
    const available = await checkSlugAvailability(newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    setSlugAvailable(available);
    setChecking(false);
  };

  const handleCreateWebsite = async () => {
    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
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
    const url = `${window.location.origin}/restaurante/${website?.slug}`;
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sitio Web</h1>
          <p className="text-muted-foreground">Crea tu sitio web personalizado para tu restaurante</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Crear tu sitio web
            </CardTitle>
            <CardDescription>
              Elige un nombre único para la URL de tu restaurante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>URL de tu restaurante</Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {window.location.origin}/restaurante/
                </span>
                <Input
                  value={newSlug}
                  onChange={(e) => {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                    setSlugAvailable(null);
                  }}
                  placeholder="mi-restaurante"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleCheckSlug} disabled={!newSlug || checking}>
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
                </Button>
              </div>
              {slugAvailable !== null && (
                <p className={`text-sm mt-2 ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {slugAvailable ? '✓ Disponible' : '✗ Este nombre ya está en uso'}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-3 block">Elige una plantilla</Label>
              <div className="grid grid-cols-2 gap-4">
                {templates.map(template => (
                  <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                        <Layout className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleCreateWebsite} 
              disabled={!slugAvailable}
              className="w-full"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Crear sitio web
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Website editor
  const siteUrl = `${window.location.origin}/restaurante/${website.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sitio Web</h1>
          <p className="text-muted-foreground">Personaliza tu sitio web público</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={copyUrl}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copiado' : 'Copiar URL'}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver sitio
            </a>
          </Button>
          <Button 
            variant={website.is_published ? "destructive" : "default"}
            onClick={handlePublishToggle}
          >
            {website.is_published ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Despublicar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={website.is_published ? "default" : "secondary"}>
              {website.is_published ? 'Publicado' : 'Borrador'}
            </Badge>
            <span className="text-sm text-muted-foreground">{siteUrl}</span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="hero">
            <Image className="h-4 w-4 mr-2" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="sections">
            <Layout className="h-4 w-4 mr-2" />
            Secciones
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="reservations">
            <Calendar className="h-4 w-4 mr-2" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="delivery">
            <Truck className="h-4 w-4 mr-2" />
            Delivery
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Información básica de tu sitio web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Título del sitio</Label>
                  <Input
                    value={formData.site_title || ''}
                    onChange={e => updateField('site_title', e.target.value)}
                    placeholder={brand?.brand_name || 'Mi Restaurante'}
                  />
                  <p className="text-xs text-muted-foreground">Aparece en la pestaña del navegador</p>
                </div>
                <div className="space-y-2">
                  <Label>URL del sitio</Label>
                  <Input value={website.slug} disabled />
                  <p className="text-xs text-muted-foreground">No se puede cambiar después de creado</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Meta descripción</Label>
                <Textarea
                  value={formData.meta_description || ''}
                  onChange={e => updateField('meta_description', e.target.value)}
                  placeholder="Descripción de tu restaurante para motores de búsqueda..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Aparece en resultados de Google (máx. 160 caracteres)</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Acerca de - Título</Label>
                <Input
                  value={formData.about_title || ''}
                  onChange={e => updateField('about_title', e.target.value)}
                  placeholder="Nuestra Historia"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Acerca de - Descripción</Label>
                <Textarea
                  value={formData.about_description || ''}
                  onChange={e => updateField('about_description', e.target.value)}
                  placeholder="Cuenta la historia de tu restaurante..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Acerca de - Imagen URL</Label>
                <Input
                  value={formData.about_image_url || ''}
                  onChange={e => updateField('about_image_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Sección Hero</CardTitle>
              <CardDescription>La primera impresión de tu restaurante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Imagen de fondo URL</Label>
                <Input
                  value={formData.hero_image_url || ''}
                  onChange={e => updateField('hero_image_url', e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Recomendado: 1920x1080px mínimo</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Título principal</Label>
                  <Input
                    value={formData.hero_title || ''}
                    onChange={e => updateField('hero_title', e.target.value)}
                    placeholder={brand?.brand_name || 'Bienvenidos'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    value={formData.hero_subtitle || ''}
                    onChange={e => updateField('hero_subtitle', e.target.value)}
                    placeholder={brand?.tagline || 'Una experiencia culinaria única'}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Texto del botón (CTA)</Label>
                  <Input
                    value={formData.hero_cta_text || ''}
                    onChange={e => updateField('hero_cta_text', e.target.value)}
                    placeholder="Ver Menú"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link del botón</Label>
                  <Input
                    value={formData.hero_cta_link || ''}
                    onChange={e => updateField('hero_cta_link', e.target.value)}
                    placeholder="#menu"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Secciones del sitio</CardTitle>
              <CardDescription>Activa o desactiva las secciones que deseas mostrar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'show_about', label: 'Acerca de', description: 'Historia y descripción del restaurante' },
                { key: 'show_menu', label: 'Menú', description: 'Muestra tu menú publicado' },
                { key: 'show_gallery', label: 'Galería', description: 'Fotos de tus platos y local' },
                { key: 'show_reservations', label: 'Reservaciones', description: 'Permite a clientes hacer reservas' },
                { key: 'show_delivery', label: 'Domicilios', description: 'Pedidos a domicilio desde el sitio' },
                { key: 'show_contact', label: 'Contacto', description: 'Información de contacto y redes' },
                { key: 'show_reviews', label: 'Reseñas', description: 'Testimonios de clientes' },
                { key: 'show_loyalty', label: 'Programa de lealtad', description: 'Link a tu programa de fidelización' },
              ].map(section => (
                <div key={section.key} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{section.label}</p>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <Switch
                    checked={!!formData[section.key as keyof RestaurantWebsite]}
                    onCheckedChange={(checked) => updateField(section.key as keyof RestaurantWebsite, checked as never)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Horarios de atención</CardTitle>
              <CardDescription>Define los horarios de tu restaurante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className="w-32">
                    <p className="font-medium">{DAY_NAMES[day]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!businessHours[day]?.closed}
                      onCheckedChange={(checked) => updateHours(day, 'closed', !checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {businessHours[day]?.closed ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                  {!businessHours[day]?.closed && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="time"
                        value={businessHours[day]?.open || '09:00'}
                        onChange={e => updateHours(day, 'open', e.target.value)}
                        className="w-32"
                      />
                      <span>a</span>
                      <Input
                        type="time"
                        value={businessHours[day]?.close || '22:00'}
                        onChange={e => updateHours(day, 'close', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de reservas</CardTitle>
              <CardDescription>Define cómo funcionan las reservaciones en línea</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Reservas habilitadas</p>
                  <p className="text-sm text-muted-foreground">Permite que los clientes hagan reservas desde tu sitio</p>
                </div>
                <Switch
                  checked={!!formData.show_reservations}
                  onCheckedChange={(checked) => updateField('show_reservations', checked)}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Máximo de personas</Label>
                  <Input
                    type="number"
                    value={formData.reservation_max_party_size || 10}
                    onChange={e => updateField('reservation_max_party_size', parseInt(e.target.value))}
                    min={1}
                    max={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Días de anticipación</Label>
                  <Input
                    type="number"
                    value={formData.reservation_advance_days || 30}
                    onChange={e => updateField('reservation_advance_days', parseInt(e.target.value))}
                    min={1}
                    max={90}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duración (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.reservation_slot_duration || 60}
                    onChange={e => updateField('reservation_slot_duration', parseInt(e.target.value))}
                    min={30}
                    max={180}
                    step={15}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de domicilios</CardTitle>
              <CardDescription>Configura tu servicio de delivery en línea</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Domicilios habilitados</p>
                  <p className="text-sm text-muted-foreground">Permite que los clientes pidan desde tu sitio</p>
                </div>
                <Switch
                  checked={!!formData.show_delivery}
                  onCheckedChange={(checked) => updateField('show_delivery', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Pedido mínimo</Label>
                <Input
                  type="number"
                  value={formData.delivery_min_order || 0}
                  onChange={e => updateField('delivery_min_order', parseFloat(e.target.value))}
                  min={0}
                  step={1000}
                />
                <p className="text-xs text-muted-foreground">Valor mínimo de pedido para domicilios</p>
              </div>

              <div className="space-y-2">
                <Label>Mensaje para clientes</Label>
                <Textarea
                  value={formData.delivery_message || ''}
                  onChange={e => updateField('delivery_message', e.target.value)}
                  placeholder="Ej: Hacemos envíos a toda la ciudad. Tiempo estimado: 30-45 min"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
