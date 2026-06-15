import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BRAND_FONT_OPTIONS, loadGoogleFonts } from '@/lib/brandFonts';
import type { BrandValues } from '@/lib/schemas/brand';

interface Props {
  value: BrandValues;
  onChange: (v: BrandValues) => void;
}

const grouped = {
  sans: BRAND_FONT_OPTIONS.filter((f) => f.category === 'sans'),
  serif: BRAND_FONT_OPTIONS.filter((f) => f.category === 'serif'),
  display: BRAND_FONT_OPTIONS.filter((f) => f.category === 'display'),
  handwriting: BRAND_FONT_OPTIONS.filter((f) => f.category === 'handwriting'),
};

const FontPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger><SelectValue placeholder="Selecciona una tipografía" /></SelectTrigger>
    <SelectContent className="max-h-80">
      <SelectGroup>
        <SelectLabel>Sans-serif</SelectLabel>
        {grouped.sans.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            <span style={{ fontFamily: f.value }}>{f.label}</span>
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Serif</SelectLabel>
        {grouped.serif.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            <span style={{ fontFamily: f.value }}>{f.label}</span>
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Display</SelectLabel>
        {grouped.display.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            <span style={{ fontFamily: f.value }}>{f.label}</span>
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Manuscritas</SelectLabel>
        {grouped.handwriting.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            <span style={{ fontFamily: f.value }}>{f.label}</span>
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
);

export const BrandTypographyTab = ({ value, onChange }: Props) => {
  // Preload all catalog fonts so the dropdown previews render with the right family.
  useEffect(() => {
    loadGoogleFonts(BRAND_FONT_OPTIONS.map((f) => f.value));
  }, []);

  // Also ensure the currently selected fonts are loaded for the live preview.
  useEffect(() => {
    loadGoogleFonts([value.font_primary, value.font_secondary]);
  }, [value.font_primary, value.font_secondary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipografías</CardTitle>
        <CardDescription>
          Elige las fuentes que definen la personalidad de tu marca. Se aplicarán automáticamente en tu panel y en tu portal público.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Tipografía Principal (Títulos)</Label>
            <FontPicker
              value={value.font_primary}
              onChange={(v) => onChange({ ...value, font_primary: v })}
            />
            <div className="p-6 border rounded-lg" style={{ fontFamily: value.font_primary }}>
              <p className="text-3xl font-bold mb-2">Título Principal</p>
              <p className="text-xl font-semibold mb-2">Subtítulo de Sección</p>
              <p className="text-lg">Encabezado de tarjeta</p>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Tipografía Secundaria (Cuerpo)</Label>
            <FontPicker
              value={value.font_secondary}
              onChange={(v) => onChange({ ...value, font_secondary: v })}
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
};
