import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Loader2 } from 'lucide-react';
import { useBusinessTaxConfig, type TaxConfig } from '@/hooks/useBusinessTaxConfig';

const TAX_PRESETS: Record<TaxConfig['type'], { label: string; rate: number }> = {
  exento: { label: 'Exento', rate: 0 },
  iva: { label: 'IVA 19%', rate: 0.19 },
  impoconsumo: { label: 'Impoconsumo 8%', rate: 0.08 },
};

const POSTaxSettings: React.FC = () => {
  const { taxConfig, allowOversell, loading, saveTaxConfig, saveAllowOversell } = useBusinessTaxConfig();
  const [draft, setDraft] = useState<TaxConfig>(taxConfig);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(taxConfig); }, [taxConfig]);

  const handleTypeChange = (type: TaxConfig['type']) => {
    const preset = TAX_PRESETS[type];
    setDraft(d => ({ ...d, type, rate: preset.rate, label: preset.label }));
  };

  const onSave = async () => {
    setSaving(true);
    await saveTaxConfig(draft);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Receipt className="h-5 w-5" />
          POS · Impuestos e inventario
        </CardTitle>
        <CardDescription>
          Configura el impuesto aplicado al cobro y el comportamiento cuando se vende sin stock.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax-type">Tipo de impuesto</Label>
                <Select value={draft.type} onValueChange={(v) => handleTypeChange(v as TaxConfig['type'])}>
                  <SelectTrigger id="tax-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exento">Exento</SelectItem>
                    <SelectItem value="iva">IVA</SelectItem>
                    <SelectItem value="impoconsumo">Impoconsumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tasa (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={(draft.rate * 100).toString()}
                  onChange={(e) => setDraft(d => ({ ...d, rate: Math.max(0, Math.min(1, Number(e.target.value) / 100 || 0)) }))}
                  disabled={draft.type === 'exento'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-label">Etiqueta</Label>
                <Input
                  id="tax-label"
                  value={draft.label}
                  onChange={(e) => setDraft(d => ({ ...d, label: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-sm">Impuesto incluido en el precio</Label>
                <p className="text-xs text-muted-foreground">
                  Si está activado, los precios del menú ya incluyen el impuesto y solo se desglosa en el ticket.
                </p>
              </div>
              <Switch
                checked={draft.included_in_price}
                onCheckedChange={(v) => setDraft(d => ({ ...d, included_in_price: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-sm">Permitir vender sin stock</Label>
                <p className="text-xs text-muted-foreground">
                  Cuando está apagado, el POS bloquea la venta de platillos con ingredientes en cero.
                </p>
              </div>
              <Switch
                checked={allowOversell}
                onCheckedChange={(v) => saveAllowOversell(v)}
              />
            </div>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar impuestos
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default POSTaxSettings;
