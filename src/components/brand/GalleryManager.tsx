import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Plus, X, Loader2, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryPhoto {
  url: string;
  category: string;
  caption?: string;
  uploadedAt: string;
}

interface GalleryManagerProps {
  userId: string;
  photos: GalleryPhoto[];
  onUpdate: (photos: GalleryPhoto[]) => Promise<void>;
}

const PHOTO_CATEGORIES = [
  { value: 'platos', label: 'Platos', icon: '🍽️' },
  { value: 'interior', label: 'Interior', icon: '🏠' },
  { value: 'exterior', label: 'Exterior', icon: '🏢' },
  { value: 'equipo', label: 'Equipo', icon: '👨‍🍳' },
  { value: 'eventos', label: 'Eventos', icon: '🎉' },
  { value: 'ambiente', label: 'Ambiente', icon: '✨' },
];

export const GalleryManager: React.FC<GalleryManagerProps> = ({ userId, photos, onUpdate }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadCategory, setUploadCategory] = useState<string>('platos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    if (!userId || files.length === 0) return;

    setUploading(true);
    const newPhotos: GalleryPhoto[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/gallery/${uploadCategory}-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(fileName);

        newPhotos.push({
          url: publicUrl,
          category: uploadCategory,
          uploadedAt: new Date().toISOString(),
        });
      }

      await onUpdate([...photos, ...newPhotos]);

      toast({
        title: 'Fotos subidas',
        description: `Se subieron ${newPhotos.length} fotos correctamente`,
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron subir algunas fotos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    await onUpdate(updatedPhotos);
    toast({
      title: 'Foto eliminada',
      description: 'La foto se ha eliminado de la galería',
    });
  };

  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter(p => p.category === selectedCategory);

  const photosCountByCategory = PHOTO_CATEGORIES.map(cat => ({
    ...cat,
    count: photos.filter(p => p.category === cat.value).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Galería de Fotos
        </CardTitle>
        <CardDescription>
          Sube fotos de tu restaurante organizadas por categoría
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}
          >
            <Grid3X3 className="h-3 w-3 mr-1" />
            Todas ({photos.length})
          </Badge>
          {photosCountByCategory.map(cat => (
            <Badge
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.icon} {cat.label} ({cat.count})
            </Badge>
          ))}
        </div>

        {/* Upload Section */}
        <div className="flex gap-4 items-end p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Categoría para nuevas fotos</label>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHOTO_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) handleUpload(e.target.files);
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Subir Fotos
            </Button>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay fotos en esta categoría</p>
            <p className="text-sm">Sube fotos para mostrar tu restaurante</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo, index) => {
              const originalIndex = photos.findIndex(p => p.url === photo.url);
              const category = PHOTO_CATEGORIES.find(c => c.value === photo.category);
              
              return (
                <div
                  key={photo.url}
                  className="relative group aspect-square rounded-lg overflow-hidden border"
                >
                  <img
                    src={photo.url}
                    alt={`Foto de ${category?.label || photo.category}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleRemove(originalIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge className="absolute bottom-2 left-2 text-xs">
                    {category?.icon} {category?.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
