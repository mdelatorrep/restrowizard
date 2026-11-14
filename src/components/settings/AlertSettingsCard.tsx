import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AlertSettings {
  email_enabled: boolean;
  sales_drop_pct: number;
  low_stock: boolean;
}

const DEFAULTS: AlertSettings = { email_enabled: true, sales_drop_pct: 25, low_stock: true };

/**
 * C-10: alertas diarias. Cada mañana a las 7 a. m. el dueño recibe por correo
 * solo lo que se salió de rango el día anterior. Antes esta pestaña tenía
 * interruptores que no guardaban nada.
 */
export function AlertSettingsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [values, setValues] = useState<AlertSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('alert_settings' as never)
      .select('email_enabled, sales_drop_pct, low_stock')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setValues(data as unknown as AlertSettings);
        setLoading(false);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('alert_settings' as never)
      .upsert({ user_id: user.id, ...values, updated_at: new Date().toISOString() } as never);
    setSaving(false);
    toast(
      error
        ? { title: 'No se pudo guardar', description: error.message, variant: 'destructive' }
        : { title: 'Alertas guardadas' },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Bell className="h-5 w-5" />
          Alertas diarias
        </CardTitle>
        <CardDescription>
          Cada mañana revisamos el día anterior y te avisamos solo si algo se salió de rango. Las alertas
          también aparecen en tu panel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Correo a las 7 a. m.</p>
                <p className="text-sm text-muted-foreground">Si no hubo nada fuera de rango, no te llega nada.</p>
              </div>
              <Switch checked={values.email_enabled} onCheckedChange={(v) => setValues((s) => ({ ...s, email_enabled: v }))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Caída de ventas</p>
                <p className="text-sm text-muted-foreground">
                  Avisar si un día vendo menos que el mismo día de las cuatro semanas anteriores, por más de:
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  min={5}
                  max={90}
                  className="w-20 text-right"
                  value={values.sales_drop_pct}
                  onChange={(e) =>
                    setValues((s) => ({ ...s, sales_drop_pct: Math.min(90, Math.max(5, Number(e.target.value) || 25)) }))
                  }
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Insumos en el mínimo</p>
                <p className="text-sm text-muted-foreground">Usa el stock mínimo de cada insumo en Inventario.</p>
              </div>
              <Switch checked={values.low_stock} onCheckedChange={(v) => setValues((s) => ({ ...s, low_stock: v }))} />
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
