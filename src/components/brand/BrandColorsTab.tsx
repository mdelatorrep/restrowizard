import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { BrandValues } from '@/lib/schemas/brand';

interface Props {
  value: BrandValues;
  onChange: (v: BrandValues) => void;
}

const COLORS: Array<{ key: keyof BrandValues; label: string; desc: string }> = [
  { key: 'primary_color', label: 'Primario', desc: 'Color principal de tu marca' },
  { key: 'secondary_color', label: 'Secundario', desc: 'Fondos y elementos de apoyo' },
  { key: 'accent_color', label: 'Acento', desc: 'CTAs y destacados' },
];

export const BrandColorsTab = ({ value, onChange }: Props) => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Nombre de Marca</Label>
            <Input value={value.brand_name} onChange={(e) => onChange({ ...value, brand_name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Tagline</Label>
            <Input
              value={value.tagline}
              onChange={(e) => onChange({ ...value, tagline: e.target.value })}
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
            {COLORS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-4">
                <Input
                  type="color"
                  value={value[key] as string}
                  onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                  className="w-16 h-12 p-1 cursor-pointer rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                  <p className="text-xs font-mono text-muted-foreground">{value[key] as string}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Vista Previa de Colores</CardTitle>
        <CardDescription>Así se ven tus colores en acción</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 rounded-lg text-white" style={{ backgroundColor: value.primary_color }}>
            <p className="font-bold text-lg">Primario</p>
            <p className="text-sm opacity-90">Texto sobre color primario</p>
          </div>
          <div className="p-6 rounded-lg" style={{ backgroundColor: value.secondary_color }}>
            <p className="font-bold text-lg" style={{ color: value.primary_color }}>Secundario</p>
            <p className="text-sm opacity-70">Texto sobre color secundario</p>
          </div>
          <div className="p-6 rounded-lg text-white" style={{ backgroundColor: value.accent_color }}>
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
        <CardDescription>Obtén recomendaciones personalizadas para tu paleta de colores</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generar Paleta con IA
        </Button>
      </CardContent>
    </Card>
  </div>
);
