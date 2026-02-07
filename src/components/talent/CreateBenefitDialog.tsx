import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BENEFIT_TYPES } from '@/hooks/useStaffDevelopment';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
}

const TEMPLATES = [
  { name: 'Descuento Comida 50%', type: 'meal_discount', value: 50, valueType: 'percentage', months: 0, desc: '50% descuento en comidas durante turno' },
  { name: 'Bono por Rendimiento', type: 'bonus', value: 200, valueType: 'fixed', months: 3, desc: 'Bono mensual para score > 85%' },
  { name: 'Programa de Referidos', type: 'referral', value: 500, valueType: 'fixed', months: 6, desc: 'Bono por referir candidato contratado' },
  { name: 'Día de Cumpleaños', type: 'wellness', value: 0, valueType: 'unlimited', months: 0, desc: 'Día libre adicional en cumpleaños' },
  { name: 'Desarrollo Profesional', type: 'education', value: 300, valueType: 'fixed', months: 6, desc: 'Presupuesto mensual para cursos externos' },
];

export const CreateBenefitDialog: React.FC<Props> = ({ open, onOpenChange, onSubmit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('0');
  const [valueType, setValueType] = useState('fixed');
  const [eligibilityMonths, setEligibilityMonths] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName(''); setType('other'); setDescription(''); setValue('0'); setValueType('fixed'); setEligibilityMonths('0');
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setName(template.name);
    setType(template.type);
    setDescription(template.desc);
    setValue(String(template.value));
    setValueType(template.valueType);
    setEligibilityMonths(String(template.months));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const result = await onSubmit({
      benefit_name: name.trim(),
      benefit_type: type,
      description: description.trim() || null,
      value: parseFloat(value) || 0,
      value_type: valueType,
      eligibility_months: parseInt(eligibilityMonths) || 0,
      is_active: true,
      applicable_positions: null,
    });
    setSubmitting(false);
    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Beneficio</DialogTitle>
        </DialogHeader>

        {/* Templates */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Plantillas rápidas</Label>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t, i) => (
              <Button key={i} variant="outline" size="sm" className="text-xs h-7" onClick={() => applyTemplate(t)}>
                {BENEFIT_TYPES.find(bt => bt.value === t.type)?.icon} {t.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Descuento en Comidas" />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el beneficio..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BENEFIT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Valor</Label>
              <Select value={valueType} onValueChange={setValueType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                  <SelectItem value="unlimited">Ilimitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{valueType === 'percentage' ? 'Porcentaje' : 'Valor ($)'}</Label>
              <Input type="number" min="0" value={value} onChange={e => setValue(e.target.value)} disabled={valueType === 'unlimited'} />
            </div>
            <div className="space-y-2">
              <Label>Antigüedad Mínima (meses)</Label>
              <Input type="number" min="0" value={eligibilityMonths} onChange={e => setEligibilityMonths(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? 'Creando...' : 'Crear Beneficio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
