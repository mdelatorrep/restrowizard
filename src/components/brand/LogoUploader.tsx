import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, ImageIcon, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoVariant {
  key: string;
  label: string;
  description: string;
  recommended: string;
  currentUrl?: string | null;
}

interface LogoUploaderProps {
  userId: string;
  logos: {
    logo_url?: string | null;
    logo_white_url?: string | null;
    logo_dark_url?: string | null;
    logo_square_url?: string | null;
    favicon_url?: string | null;
  };
  onUpdate: (updates: Record<string, string | null>) => Promise<void>;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ userId, logos, onUpdate }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const logoVariants: LogoVariant[] = [
    {
      key: 'logo_url',
      label: 'Logo Principal',
      description: 'Logo a todo color para uso general',
      recommended: 'PNG transparente, mínimo 500x500px',
      currentUrl: logos.logo_url,
    },
    {
      key: 'logo_white_url',
      label: 'Logo Blanco',
      description: 'Para fondos oscuros',
      recommended: 'PNG transparente con logo en blanco',
      currentUrl: logos.logo_white_url,
    },
    {
      key: 'logo_dark_url',
      label: 'Logo Oscuro',
      description: 'Para fondos claros',
      recommended: 'PNG transparente con logo en negro/oscuro',
      currentUrl: logos.logo_dark_url,
    },
    {
      key: 'logo_square_url',
      label: 'Logo Cuadrado',
      description: 'Para avatares y perfiles de redes sociales',
      recommended: 'Cuadrado 1:1, mínimo 400x400px',
      currentUrl: logos.logo_square_url,
    },
    {
      key: 'favicon_url',
      label: 'Favicon',
      description: 'Icono del navegador',
      recommended: 'ICO o PNG 32x32px / 64x64px',
      currentUrl: logos.favicon_url,
    },
  ];

  const handleUpload = async (key: string, file: File) => {
    if (!userId) return;

    setUploading(key);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${key}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(fileName);

      await onUpdate({ [key]: publicUrl });

      toast({
        title: 'Logo subido',
        description: 'El logo se ha actualizado correctamente',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el logo',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (key: string) => {
    try {
      await onUpdate({ [key]: null });
      toast({
        title: 'Logo eliminado',
        description: 'El logo se ha eliminado correctamente',
      });
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Gestión de Logos
        </CardTitle>
        <CardDescription>
          Sube todas las variantes de tu logo para diferentes usos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {logoVariants.map((variant) => (
            <div
              key={variant.key}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-4 transition-all",
                variant.currentUrl
                  ? "border-primary/50 bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { fileInputRefs.current[variant.key] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(variant.key, file);
                }}
              />

              {variant.currentUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={variant.currentUrl}
                      alt={variant.label}
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => fileInputRefs.current[variant.key]?.click()}
                        disabled={uploading === variant.key}
                      >
                        {uploading === variant.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        onClick={() => handleRemove(variant.key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">{variant.label}</Label>
                    <p className="text-xs text-muted-foreground">{variant.description}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.current[variant.key]?.click()}
                  disabled={uploading === variant.key}
                  className="w-full text-left"
                >
                  <div className="aspect-square bg-muted/50 rounded-lg flex flex-col items-center justify-center mb-3">
                    {uploading === variant.key ? (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <Label className="font-semibold cursor-pointer">{variant.label}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{variant.description}</p>
                  <p className="text-xs text-primary mt-1">{variant.recommended}</p>
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
