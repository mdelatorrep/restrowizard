import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TRAINING_CATEGORIES } from '@/hooks/useStaffDevelopment';
import { TrainingProgramSchema } from '@/lib/schemas/talent';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
}

export const CreateTrainingDialog: React.FC<Props> = ({ open, onOpenChange, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [position, setPosition] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('1');
  const [isMandatory, setIsMandatory] = useState(false);
  const [passingScore, setPassingScore] = useState('70');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('custom');
    setPosition('');
    setEstimatedHours('1');
    setIsMandatory(false);
    setPassingScore('70');
  };

  const { toast } = useToast();

  const handleSubmit = async () => {
    const parsed = TrainingProgramSchema.safeParse({
      title: title.trim(),
      description: description.trim() || null,
      category,
      position: position.trim() || null,
      estimated_hours: estimatedHours,
      is_mandatory: isMandatory,
      is_active: true,
      passing_score: passingScore,
    });
    if (!parsed.success) {
      toast({
        title: 'Datos inválidos',
        description: parsed.error.issues[0]?.message ?? 'Revisa el formulario',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    const result = await onSubmit({ ...parsed.data, content: { modules: [] } });
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
          <DialogTitle>Nuevo Programa de Formación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Onboarding Meseros" />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el programa..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Posición Objetivo</Label>
              <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Ej: Mesero (vacío = todos)" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración Estimada (horas)</Label>
              <Input type="number" min="0.5" step="0.5" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Puntaje Mínimo (%)</Label>
              <Input type="number" min="0" max="100" value={passingScore} onChange={e => setPassingScore(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Obligatorio</Label>
              <p className="text-xs text-muted-foreground">Los empleados deben completar este programa</p>
            </div>
            <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || submitting}>
            {submitting ? 'Creando...' : 'Crear Programa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
