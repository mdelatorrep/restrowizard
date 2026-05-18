import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandData } from '@/hooks/useBrandData';
import { useDataUserId } from '@/hooks/useDataUserId';
import { useToast } from '@/hooks/use-toast';
import { LogoUploader } from '@/components/brand/LogoUploader';
import { GalleryManager } from '@/components/brand/GalleryManager';
import { SocialLinksEditor } from '@/components/brand/SocialLinksEditor';
import { BrandValuesEditor } from '@/components/brand/BrandValuesEditor';
import { CreateBrandEmptyState } from '@/components/brand/CreateBrandEmptyState';
import { BrandColorsTab } from '@/components/brand/BrandColorsTab';
import { BrandTypographyTab } from '@/components/brand/BrandTypographyTab';
import { BrandManualTab } from '@/components/brand/BrandManualTab';
import { BrandSchema, type BrandValues } from '@/lib/schemas/brand';
import { Palette, Type, Image, FileText, Save, Loader2, Heart, Globe, ImageIcon } from 'lucide-react';

const DEFAULTS: BrandValues = {
  brand_name: '',
  tagline: '',
  primary_color: '#6B46C1',
  secondary_color: '#F7FAFC',
  accent_color: '#ED8936',
  font_primary: 'Lato',
  font_secondary: 'Montserrat',
  brand_voice: '',
};

const Brand = () => {
  const { brand, loading, hasData, createBrand, updateBrand } = useBrandData();
  const { userId } = useDataUserId();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BrandValues>(DEFAULTS);

  useEffect(() => {
    if (brand) {
      setFormData({
        brand_name: brand.brand_name || '',
        tagline: brand.tagline || '',
        primary_color: brand.primary_color || DEFAULTS.primary_color,
        secondary_color: brand.secondary_color || DEFAULTS.secondary_color,
        accent_color: brand.accent_color || DEFAULTS.accent_color,
        font_primary: brand.font_primary || DEFAULTS.font_primary,
        font_secondary: brand.font_secondary || DEFAULTS.font_secondary,
        brand_voice: brand.brand_voice || '',
      });
    }
  }, [brand]);

  const validateOrToast = (): boolean => {
    const parsed = BrandSchema.safeParse(formData);
    if (!parsed.success) {
      toast({
        title: 'Datos inválidos',
        description: parsed.error.issues[0]?.message || 'Revisa los campos',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleCreateBrand = async () => {
    if (!validateOrToast()) return;
    setSaving(true);
    await createBrand(formData);
    setShowCreateDialog(false);
    setSaving(false);
  };

  const handleUpdateBrand = async () => {
    if (!brand || !validateOrToast()) return;
    setSaving(true);
    await updateBrand(formData);
    setSaving(false);
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
      <CreateBrandEmptyState
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        value={formData}
        onChange={setFormData}
        onSubmit={handleCreateBrand}
        saving={saving}
      />
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
          <TabsTrigger value="logos" className="gap-2"><ImageIcon className="h-4 w-4" />Logos</TabsTrigger>
          <TabsTrigger value="identity" className="gap-2"><Palette className="h-4 w-4" />Colores</TabsTrigger>
          <TabsTrigger value="typography" className="gap-2"><Type className="h-4 w-4" />Tipografía</TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2"><Image className="h-4 w-4" />Galería</TabsTrigger>
          <TabsTrigger value="social" className="gap-2"><Globe className="h-4 w-4" />Redes</TabsTrigger>
          <TabsTrigger value="values" className="gap-2"><Heart className="h-4 w-4" />Valores</TabsTrigger>
          <TabsTrigger value="manual" className="gap-2"><FileText className="h-4 w-4" />Manual</TabsTrigger>
        </TabsList>

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
              onUpdate={(updates) => updateBrand(updates as any)}
            />
          )}
        </TabsContent>

        <TabsContent value="identity">
          <BrandColorsTab value={formData} onChange={setFormData} />
        </TabsContent>

        <TabsContent value="typography">
          <BrandTypographyTab value={formData} onChange={setFormData} />
        </TabsContent>

        <TabsContent value="gallery">
          {userId && (
            <GalleryManager
              userId={userId}
              photos={brand?.gallery_photos || []}
              onUpdate={(photos) => updateBrand({ gallery_photos: photos })}
            />
          )}
        </TabsContent>

        <TabsContent value="social">
          <SocialLinksEditor
            socialLinks={brand?.social_links || {}}
            onChange={(links) => updateBrand({ social_links: links })}
          />
        </TabsContent>

        <TabsContent value="values">
          <BrandValuesEditor
            mission={brand?.mission || ''}
            vision={brand?.vision || ''}
            story={brand?.story || ''}
            brandVoice={brand?.brand_voice || ''}
            brandValues={brand?.brand_values || []}
            differentiators={brand?.differentiators || []}
            targetAudience={brand?.target_audience || ''}
            onChange={(updates) => updateBrand(updates)}
          />
        </TabsContent>

        <TabsContent value="manual">
          <BrandManualTab value={formData} logoUrl={brand?.logo_url} brandName={brand?.brand_name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Brand;
