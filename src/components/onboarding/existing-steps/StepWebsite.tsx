import { Globe } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DAY_KEYS, DAY_LABELS, type DayKey } from '../quickSetup';

export interface WebsiteValues {
  slug: string;
  whatsapp: string;
  openTime: string;
  closeTime: string;
  closedDays: DayKey[];
  reservations: boolean;
}

interface Props {
  values: WebsiteValues;
  onChange: (patch: Partial<WebsiteValues>) => void;
}

/** C-07, paso 3: lo mínimo para publicar el sitio con reservas. */
export function StepWebsite({ values, onChange }: Props) {
  const toggleDay = (day: DayKey) =>
    onChange({
      closedDays: values.closedDays.includes(day)
        ? values.closedDays.filter((d) => d !== day)
        : [...values.closedDays, day],
    });

  return (
    <>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Tu sitio web</CardTitle>
        <CardDescription className="font-lato-light">
          Con esto queda publicado y recibiendo reservas. Lo puedes cambiar cuando quieras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="slug">Dirección de tu sitio</Label>
          <div className="flex items-center rounded-md border bg-muted/40 pl-3 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">restrowizard.co/p/</span>
            <Input
              id="slug"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 pl-1"
              value={values.slug}
              onChange={(e) =>
                onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp del restaurante</Label>
          <Input
            id="whatsapp"
            inputMode="tel"
            placeholder="Ej: 300 123 4567"
            value={values.whatsapp}
            onChange={(e) => onChange({ whatsapp: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="open">Abre</Label>
            <Input id="open" type="time" value={values.openTime} onChange={(e) => onChange({ openTime: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="close">Cierra</Label>
            <Input id="close" type="time" value={values.closeTime} onChange={(e) => onChange({ closeTime: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Días que no abre</Label>
          <div className="flex flex-wrap gap-3">
            {DAY_KEYS.map((day) => (
              <label key={day} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox checked={values.closedDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                {DAY_LABELS[day].slice(0, 3)}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium text-sm">Recibir reservas desde el sitio</p>
            <p className="text-xs text-muted-foreground">Cada hora dentro de tu horario, hasta 10 personas.</p>
          </div>
          <Switch checked={values.reservations} onCheckedChange={(v) => onChange({ reservations: v })} />
        </div>
      </CardContent>
    </>
  );
}
