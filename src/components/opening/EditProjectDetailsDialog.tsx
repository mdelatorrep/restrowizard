import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { BusinessProject } from '@/hooks/useBusinessProject';
import { getCurrencyCode, getCurrencySymbol } from '@/data/constants';

interface EditProjectDetailsDialogProps {
  project: BusinessProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<BusinessProject>) => Promise<void>;
}

export function EditProjectDetailsDialog({
  project,
  open,
  onOpenChange,
  onSave,
}: EditProjectDetailsDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [targetOpeningDate, setTargetOpeningDate] = useState(project.target_opening_date || '');
  const [estimatedBudget, setEstimatedBudget] = useState(project.estimated_budget?.toString() || '');
  const [description, setDescription] = useState(project.description || '');

  // Reset form when project changes
  useEffect(() => {
    setTargetOpeningDate(project.target_opening_date || '');
    setEstimatedBudget(project.estimated_budget?.toString() || '');
    setDescription(project.description || '');
  }, [project]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        target_opening_date: targetOpeningDate || undefined,
        estimated_budget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
        description: description || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Detalles del Proyecto</DialogTitle>
          <DialogDescription>
            Actualiza la información de tu proyecto. Después podrás regenerar el plan con los nuevos datos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetDate">Fecha de Apertura Objetivo</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetOpeningDate}
              onChange={(e) => setTargetOpeningDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Presupuesto Estimado ({getCurrencyCode(project.country)})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {getCurrencySymbol(project.country)}
              </span>
              <Input
                id="budget"
                type="number"
                placeholder="Ej: 500000"
                className="pl-8"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción del Concepto</Label>
            <Textarea
              id="description"
              placeholder="Describe tu concepto de negocio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando…
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
