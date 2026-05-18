import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Palette, Plus, Save } from 'lucide-react';
import type { BrandValues } from '@/lib/schemas/brand';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: BrandValues;
  onChange: (v: BrandValues) => void;
  onSubmit: () => void;
  saving: boolean;
}

const COLOR_FIELDS: Array<{ key: keyof BrandValues; label: string }> = [
  { key: 'primary_color', label: 'Color Primario' },
  { key: 'secondary_color', label: 'Color Secundario' },
  { key: 'accent_color', label: 'Color Acento' },
];

export const CreateBrandEmptyState = ({ open, onOpenChange, value, onChange, onSubmit, saving }: Props) => (
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
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                <Label>Nombre de Marca *</Label>
                <Input
                  value={value.brand_name}
                  onChange={(e) => onChange({ ...value, brand_name: e.target.value })}
                  placeholder="Nombre de tu restaurante"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tagline / Eslogan</Label>
                <Input
                  value={value.tagline}
                  onChange={(e) => onChange({ ...value, tagline: e.target.value })}
                  placeholder="El sabor que te conecta"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {COLOR_FIELDS.map(({ key, label }) => (
                  <div key={key} className="grid gap-2">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={value[key] as string}
                        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={value[key] as string}
                        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipografía Principal</Label>
                  <Input
                    value={value.font_primary}
                    onChange={(e) => onChange({ ...value, font_primary: e.target.value })}
                    placeholder="Lato, Montserrat, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipografía Secundaria</Label>
                  <Input
                    value={value.font_secondary}
                    onChange={(e) => onChange({ ...value, font_secondary: e.target.value })}
                    placeholder="Open Sans, Roboto, etc."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={onSubmit} disabled={saving}>
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
