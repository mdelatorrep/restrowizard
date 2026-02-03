import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBrandData } from '@/hooks/useBrandData';
import { useDataUserId } from '@/hooks/useDataUserId';
import { useToast } from '@/hooks/use-toast';
import { LogoUploader } from '@/components/brand/LogoUploader';
import { GalleryManager } from '@/components/brand/GalleryManager';
import { SocialLinksEditor } from '@/components/brand/SocialLinksEditor';
import { BrandValuesEditor } from '@/components/brand/BrandValuesEditor';
import { 
  Palette, 
  Type, 
  Image, 
  FileText, 
  Sparkles, 
  Save, 
  Plus, 
  Loader2,
  Heart,
  Globe,
  ImageIcon
} from 'lucide-react';

const Brand = () => {
  const { brand, assets, loading, hasData, createBrand, updateBrand } = useBrandData();
  const { userId } = useDataUserId();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: '',
    tagline: '',
    primary_color: '#6B46C1',
    secondary_color: '#F7FAFC',
    accent_color: '#ED8936',
    font_primary: 'Lato',
    font_secondary: 'Montserrat',
    brand_voice: '',
  });

  // Sync form data with brand when loaded
  useEffect(() => {
    if (brand) {
      setFormData({
        brand_name: brand.brand_name || '',
        tagline: brand.tagline || '',
        primary_color: brand.primary_color || '#6B46C1',
        secondary_color: brand.secondary_color || '#F7FAFC',
        accent_color: brand.accent_color || '#ED8936',
        font_primary: brand.font_primary || 'Lato',
        font_secondary: brand.font_secondary || 'Montserrat',
        brand_voice: brand.brand_voice || '',
      });
    }
  }, [brand]);

  const handleCreateBrand = async () => {
    if (!formData.brand_name.trim()) {
      toast({ title: 'Error', description: 'El nombre de marca es requerido', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await createBrand(formData);
    setShowCreateDialog(false);
    setSaving(false);
  };

  const handleUpdateBrand = async () => {
    if (!brand) return;
    setSaving(true);
    await updateBrand(formData);
    setSaving(false);
  };

  const handleLogoUpdate = async (updates: Record<string, string | null>) => {
    await updateBrand(updates as any);
  };

  const handleGalleryUpdate = async (photos: Array<{ url: string; category: string; caption?: string; uploadedAt: string }>) => {
    await updateBrand({ gallery_photos: photos });
  };

  const handleSocialLinksUpdate = (links: Record<string, string>) => {
    updateBrand({ social_links: links });
  };

  const handleValuesUpdate = (updates: any) => {
    updateBrand(updates);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administración de Marca</h1>
            <p className="text-muted-foreground">Define la identidad visual y personalidad de tu restaurante</p>
          </div>
        </div>

        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Palette className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Crea tu identidad de marca</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-lg">
              Tu marca es más que un logo. Es la historia, los valores y la personalidad que hacen único a tu restaurante. 
              Comienza definiendo los elementos básicos.
            </p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Crear Marca
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Identidad de Marca</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brand_name">Nombre de Marca *</Label>
                    <Input
                      id="brand_name"
                      value={formData.brand_name}
                      onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                      placeholder="Nombre de tu restaurante"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tagline">Tagline / Eslogan</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="El sabor que te conecta"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="primary_color">Color Primario</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="primary_color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="secondary_color">Color Secundario</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="secondary_color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="accent_color">Color Acento</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="accent_color"
                          value={formData.accent_color}
                          onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.accent_color}
                          onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="font_primary">Tipografía Principal</Label>
                      <Input
                        id="font_primary"
                        value={formData.font_primary}
                        onChange={(e) => setFormData({ ...formData, font_primary: e.target.value })}
                        placeholder="Lato, Montserrat, etc."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="font_secondary">Tipografía Secundaria</Label>
                      <Input
                        id="font_secondary"
                        value={formData.font_secondary}
                        onChange={(e) => setFormData({ ...formData, font_secondary: e.target.value })}
                        placeholder="Open Sans, Roboto, etc."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                  <Button onClick={handleCreateBrand} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Crear Marca
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administración de Marca</h1>
          <p className="text-muted-foreground">
            Gestiona la identidad visual y personalidad de {brand?.brand_name}
          </p>
        </div>
        <Button onClick={handleUpdateBrand} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="logos" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="logos" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Logos
          </TabsTrigger>
          <TabsTrigger value="identity" className="gap-2">
            <Palette className="h-4 w-4" />
            Colores
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="h-4 w-4" />
            Tipografía
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <Image className="h-4 w-4" />
            Galería
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Globe className="h-4 w-4" />
            Redes
          </TabsTrigger>
          <TabsTrigger value="values" className="gap-2">
            <Heart className="h-4 w-4" />
            Valores
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <FileText className="h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* LOGOS TAB */}
        <TabsContent value="logos">
          {userId && (
            <LogoUploader
              userId={userId}
              logos={{
                logo_url: brand?.logo_url,
                logo_white_url: brand?.logo_white_url,
                logo_dark_url: brand?.logo_dark_url,
                logo_square_url: brand?.logo_square_url,
                favicon_url: brand?.favicon_url,
              }}
              onUpdate={handleLogoUpdate}
            />
          )}
        </TabsContent>

        {/* IDENTITY/COLORS TAB */}
        <TabsContent value="identity" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Marca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Nombre de Marca</Label>
                  <Input
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tagline</Label>
                  <Input
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Tu eslogan aquí"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paleta de Colores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {[
                    { key: 'primary_color' as const, label: 'Primario', desc: 'Color principal de tu marca' },
                    { key: 'secondary_color' as const, label: 'Secundario', desc: 'Fondos y elementos de apoyo' },
                    { key: 'accent_color' as const, label: 'Acento', desc: 'CTAs y destacados' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center gap-4">
                      <Input
                        type="color"
                        value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-16 h-12 p-1 cursor-pointer rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                        <p className="text-xs font-mono text-muted-foreground">{formData[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Color Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Colores</CardTitle>
              <CardDescription>Así se ven tus colores en acción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div 
                  className="p-6 rounded-lg text-white"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  <p className="font-bold text-lg">Primario</p>
                  <p className="text-sm opacity-90">Texto sobre color primario</p>
                </div>
                <div 
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: formData.secondary_color }}
                >
                  <p className="font-bold text-lg" style={{ color: formData.primary_color }}>Secundario</p>
                  <p className="text-sm opacity-70">Texto sobre color secundario</p>
                </div>
                <div 
                  className="p-6 rounded-lg text-white"
                  style={{ backgroundColor: formData.accent_color }}
                >
                  <p className="font-bold text-lg">Acento</p>
                  <p className="text-sm opacity-90">Botón de acción</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Sugerencias de IA
              </CardTitle>
              <CardDescription>
                Obtén recomendaciones personalizadas para tu paleta de colores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generar Paleta con IA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TYPOGRAPHY TAB */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipografías</CardTitle>
              <CardDescription>
                Las fuentes definen la personalidad visual de tu marca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Tipografía Principal (Títulos)</Label>
                  <Input
                    value={formData.font_primary}
                    onChange={(e) => setFormData({ ...formData, font_primary: e.target.value })}
                    placeholder="Lato, Montserrat, Playfair Display..."
                  />
                  <div 
                    className="p-6 border rounded-lg"
                    style={{ fontFamily: formData.font_primary }}
                  >
                    <p className="text-3xl font-bold mb-2">Título Principal</p>
                    <p className="text-xl font-semibold mb-2">Subtítulo de Sección</p>
                    <p className="text-lg">Encabezado de tarjeta</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Tipografía Secundaria (Cuerpo)</Label>
                  <Input
                    value={formData.font_secondary}
                    onChange={(e) => setFormData({ ...formData, font_secondary: e.target.value })}
                    placeholder="Open Sans, Roboto, Source Sans Pro..."
                  />
                  <div 
                    className="p-6 border rounded-lg"
                    style={{ fontFamily: formData.font_secondary }}
                  >
                    <p className="mb-2">
                      Este es un párrafo de ejemplo usando la tipografía secundaria. 
                      Es ideal para cuerpo de texto, descripciones de menú y contenido general.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Texto más pequeño para notas al pie, términos y condiciones, etc.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GALLERY TAB */}
        <TabsContent value="gallery">
          {userId && (
            <GalleryManager
              userId={userId}
              photos={brand?.gallery_photos || []}
              onUpdate={handleGalleryUpdate}
            />
          )}
        </TabsContent>

        {/* SOCIAL LINKS TAB */}
        <TabsContent value="social">
          <SocialLinksEditor
            socialLinks={brand?.social_links || {}}
            onChange={handleSocialLinksUpdate}
          />
        </TabsContent>

        {/* VALUES TAB */}
        <TabsContent value="values">
          <BrandValuesEditor
            mission={brand?.mission || ''}
            vision={brand?.vision || ''}
            story={brand?.story || ''}
            brandVoice={brand?.brand_voice || ''}
            brandValues={brand?.brand_values || []}
            differentiators={brand?.differentiators || []}
            targetAudience={brand?.target_audience || ''}
            onChange={handleValuesUpdate}
          />
        </TabsContent>

        {/* BRAND MANUAL TAB */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Manual de Marca
              </CardTitle>
              <CardDescription>
                Genera un documento PDF con todos los lineamientos de tu marca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                El manual de marca incluirá:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Uso correcto de logos y variantes</li>
                <li>Paleta de colores con códigos HEX, RGB y CMYK</li>
                <li>Tipografías y jerarquía de textos</li>
                <li>Misión, visión y valores</li>
                <li>Tono de voz y ejemplos de comunicación</li>
                <li>Aplicaciones correctas e incorrectas</li>
              </ul>
              <Button className="gap-2 mt-4">
                <Sparkles className="h-4 w-4" />
                Generar Manual con IA
              </Button>
            </CardContent>
          </Card>

          {/* Brand Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Marca</CardTitle>
              <CardDescription>Así se ve tu marca en conjunto</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="p-8 rounded-lg"
                style={{ backgroundColor: formData.secondary_color }}
              >
                <div className="flex items-center gap-4 mb-6">
                  {brand?.logo_url ? (
                    <img 
                      src={brand.logo_url} 
                      alt={brand.brand_name}
                      className="h-16 w-16 object-contain"
                    />
                  ) : (
                    <div 
                      className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                      style={{ backgroundColor: formData.primary_color }}
                    >
                      {formData.brand_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 
                      className="text-2xl font-bold"
                      style={{ fontFamily: formData.font_primary, color: formData.primary_color }}
                    >
                      {formData.brand_name}
                    </h2>
                    {formData.tagline && (
                      <p 
                        className="text-muted-foreground"
                        style={{ fontFamily: formData.font_secondary }}
                      >
                        {formData.tagline}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  className="px-6 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: formData.accent_color }}
                >
                  Botón de Ejemplo
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Brand;
