import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BrandValues } from '@/lib/schemas/brand';

interface Props {
  value: BrandValues;
  onChange: (v: BrandValues) => void;
}

export const BrandTypographyTab = ({ value, onChange }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Tipografías</CardTitle>
      <CardDescription>Las fuentes definen la personalidad visual de tu marca</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label>Tipografía Principal (Títulos)</Label>
          <Input
            value={value.font_primary}
            onChange={(e) => onChange({ ...value, font_primary: e.target.value })}
            placeholder="Lato, Montserrat, Playfair Display..."
          />
          <div className="p-6 border rounded-lg" style={{ fontFamily: value.font_primary }}>
            <p className="text-3xl font-bold mb-2">Título Principal</p>
            <p className="text-xl font-semibold mb-2">Subtítulo de Sección</p>
            <p className="text-lg">Encabezado de tarjeta</p>
          </div>
        </div>
        <div className="space-y-4">
          <Label>Tipografía Secundaria (Cuerpo)</Label>
          <Input
            value={value.font_secondary}
            onChange={(e) => onChange({ ...value, font_secondary: e.target.value })}
            placeholder="Open Sans, Roboto, Source Sans Pro..."
          />
          <div className="p-6 border rounded-lg" style={{ fontFamily: value.font_secondary }}>
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
);
