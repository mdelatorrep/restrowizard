import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Sparkles } from 'lucide-react';
import type { BrandValues } from '@/lib/schemas/brand';

interface Props {
  value: BrandValues;
  logoUrl?: string | null;
  brandName?: string;
}

export const BrandManualTab = ({ value, logoUrl, brandName }: Props) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Manual de Marca
        </CardTitle>
        <CardDescription>Genera un documento PDF con todos los lineamientos de tu marca</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">El manual de marca incluirá:</p>
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

    <Card>
      <CardHeader>
        <CardTitle>Vista Previa de Marca</CardTitle>
        <CardDescription>Así se ve tu marca en conjunto</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-8 rounded-lg" style={{ backgroundColor: value.secondary_color }}>
          <div className="flex items-center gap-4 mb-6">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-16 w-16 object-contain" />
            ) : (
              <div
                className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: value.primary_color }}
              >
                {value.brand_name.charAt(0)}
              </div>
            )}
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: value.font_primary, color: value.primary_color }}
              >
                {value.brand_name}
              </h2>
              {value.tagline && (
                <p className="text-muted-foreground" style={{ fontFamily: value.font_secondary }}>
                  {value.tagline}
                </p>
              )}
            </div>
          </div>
          <button
            className="px-6 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: value.accent_color }}
          >
            Botón de Ejemplo
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
);
