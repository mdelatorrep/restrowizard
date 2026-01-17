import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBrandData } from '@/hooks/useBrandData';
import { useToast } from '@/hooks/use-toast';
import { Palette, Type, Image, FileText, Sparkles, Save, Plus, Loader2 } from 'lucide-react';

const Brand = () => {
  const { brand, assets, loading, hasData, createBrand, updateBrand, addAsset } = useBrandData();
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
    brand_voice: 'amigable',
  });

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
            <p className="text-muted-foreground">Define la identidad visual de tu restaurante</p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Palette className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Crea tu identidad de marca</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Define los colores, tipografías y estilo que representan tu restaurante
            </p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Marca
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
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
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="flex-1"
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
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="flex-1"
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
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.accent_color}
                          onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                          className="flex-1"
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
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="font_secondary">Tipografía Secundaria</Label>
                      <Input
                        id="font_secondary"
                        value={formData.font_secondary}
                        onChange={(e) => setFormData({ ...formData, font_secondary: e.target.value })}
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
          <p className="text-muted-foreground">Gestiona la identidad visual de {brand?.brand_name}</p>
        </div>
        <Button onClick={handleUpdateBrand} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="identity">
        <TabsList>
          <TabsTrigger value="identity">
            <Palette className="h-4 w-4 mr-2" />
            Identidad
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Tipografía
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Image className="h-4 w-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="manual">
            <FileText className="h-4 w-4 mr-2" />
            Manual
          </TabsTrigger>
        </TabsList>

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
                    value={formData.brand_name || brand?.brand_name || ''}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tagline</Label>
                  <Input
                    value={formData.tagline || brand?.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Tu eslogan aquí"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Voz de Marca</Label>
                  <Textarea
                    value={formData.brand_voice || brand?.brand_voice || ''}
                    onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                    placeholder="Describe el tono y personalidad de tu marca"
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
                    { key: 'primary_color' as const, label: 'Primario' },
                    { key: 'secondary_color' as const, label: 'Secundario' },
                    { key: 'accent_color' as const, label: 'Acento' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                      <Input
                        type="color"
                        value={formData[key] || brand?.[key] || '#000000'}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formData[key] || brand?.[key]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Sugerencias de IA
              </CardTitle>
              <CardDescription>
                Obtén recomendaciones personalizadas para tu marca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Paleta con IA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipografías</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Tipografía Principal</Label>
                  <Input
                    value={formData.font_primary || brand?.font_primary || ''}
                    onChange={(e) => setFormData({ ...formData, font_primary: e.target.value })}
                  />
                  <div 
                    className="p-4 border rounded-lg"
                    style={{ fontFamily: formData.font_primary || brand?.font_primary }}
                  >
                    <p className="text-2xl font-bold">Título Principal</p>
                    <p className="text-lg">Subtítulo de ejemplo</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Tipografía Secundaria</Label>
                  <Input
                    value={formData.font_secondary || brand?.font_secondary || ''}
                    onChange={(e) => setFormData({ ...formData, font_secondary: e.target.value })}
                  />
                  <div 
                    className="p-4 border rounded-lg"
                    style={{ fontFamily: formData.font_secondary || brand?.font_secondary }}
                  >
                    <p>Este es un párrafo de ejemplo usando la tipografía secundaria para cuerpo de texto.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets de Marca</CardTitle>
              <CardDescription>Logos, imágenes y recursos visuales</CardDescription>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay assets aún</p>
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Subir Asset
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-2">
                      <div className="aspect-square bg-muted rounded flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm mt-2 truncate">{asset.asset_name}</p>
                      <Badge variant="outline" className="mt-1">{asset.asset_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual de Marca</CardTitle>
              <CardDescription>Genera un documento con los lineamientos de tu marca</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Manual con IA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Brand;
