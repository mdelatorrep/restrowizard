import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIP_GROUP_LABEL, type TipGroup, type TipPolicy, type TipRoleWeight } from '@/hooks/tips/tipsData';

type WeightRow = Pick<TipRoleWeight, 'position' | 'tip_group' | 'weight' | 'earns_table_tips'>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: { policy: TipPolicy | null; weights: TipRoleWeight[] };
  saving: boolean;
  onSave: (input: { policy: Omit<TipPolicy, 'user_id'>; weights: WeightRow[] }) => void;
}

export const TipSettingsDialog = ({ open, onOpenChange, settings, saving, onSave }: Props) => {
  const [share, setShare] = useState('70');
  const [basis, setBasis] = useState<'days' | 'hours'>('days');
  const [weights, setWeights] = useState<WeightRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setShare(String(settings?.policy?.table_share_pct ?? 70));
    setBasis(settings?.policy?.pool_basis ?? 'days');
    setWeights((settings?.weights || []).map(w => ({ position: w.position, tip_group: w.tip_group, weight: w.weight, earns_table_tips: w.earns_table_tips })));
  }, [open, settings]);

  const update = (i: number, patch: Partial<WeightRow>) =>
    setWeights(ws => ws.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));

  const shareNum = Math.min(100, Math.max(0, Number(share) || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reglas de reparto</DialogTitle>
          <DialogDescription>
            Así se reparte cada peso de propina. Cambiarlas no toca las quincenas cerradas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>% que conserva el mesero de sus propias mesas</Label>
            <Input inputMode="numeric" value={share} onChange={e => setShare(e.target.value)} />
            <p className="text-xs text-muted-foreground">El {100 - shareNum}% restante va al fondo común.</p>
          </div>
          <div className="space-y-2">
            <Label>El fondo común se reparte por</Label>
            <Select value={basis} onValueChange={v => setBasis(v as 'days' | 'hours')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Días trabajados</SelectItem>
                <SelectItem value="hours">Horas trabajadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Peso por cargo</Label>
          <div className="rounded-lg border divide-y">
            {weights.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Sin reglas por cargo: todos pesan 1. Se crean automáticamente cuando hay personal con cargo.
              </p>
            )}
            {weights.map((w, i) => (
              <div key={w.position} className="grid grid-cols-12 items-center gap-2 p-2.5">
                <span className="col-span-4 text-sm font-medium">{w.position}</span>
                <div className="col-span-3">
                  <Select value={w.tip_group} onValueChange={v => update(i, { tip_group: v as TipGroup })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TIP_GROUP_LABEL) as TipGroup[]).map(g => <SelectItem key={g} value={g}>{TIP_GROUP_LABEL[g]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Input className="col-span-2 h-8" inputMode="decimal" value={String(w.weight)}
                  onChange={e => update(i, { weight: Number(e.target.value.replace(',', '.')) || 0 })} />
                <label className="col-span-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={w.earns_table_tips} onCheckedChange={c => update(i, { earns_table_tips: c })} />
                  Atiende mesas
                </label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={() => onSave({
            policy: { table_share_pct: shareNum, pool_basis: basis, rounding: settings?.policy?.rounding ?? 100 },
            weights: weights.map(w => ({ ...w, weight: Math.min(10, Math.max(0, w.weight)) })),
          })}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar reglas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
