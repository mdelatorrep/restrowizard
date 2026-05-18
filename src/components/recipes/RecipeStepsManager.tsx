import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RecipeStep } from '@/hooks/useRecipes';
import { RecipeStepSchema } from '@/lib/schemas/recipeStep';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Edit, Clock, Thermometer, ChefHat, 
  AlertTriangle, GripVertical, Image 
} from 'lucide-react';

interface Props {
  steps: RecipeStep[];
  onAdd: (data: Partial<RecipeStep>) => void;
  onUpdate: (id: string, data: Partial<RecipeStep>) => void;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export const RecipeStepsManager = ({ steps, onAdd, onUpdate, onRemove }: Props) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    instruction: '',
    duration_minutes: 0,
    temperature_celsius: 0,
    technique: '',
    equipment: '',
    tips: '',
    critical_point: false,
    photo_url: ''
  });

  const resetForm = () => {
    setForm({
      title: '',
      instruction: '',
      duration_minutes: 0,
      temperature_celsius: 0,
      technique: '',
      equipment: '',
      tips: '',
      critical_point: false,
      photo_url: ''
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    const parsed = RecipeStepSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    if (editingId) {
      onUpdate(editingId, form);
    } else {
      onAdd({
        ...form,
        step_number: steps.length + 1
      });
    }

    setShowAddDialog(false);
    resetForm();
  };

  const handleEdit = (step: RecipeStep) => {
    setForm({
      title: step.title || '',
      instruction: step.instruction,
      duration_minutes: step.duration_minutes || 0,
      temperature_celsius: step.temperature_celsius || 0,
      technique: step.technique || '',
      equipment: step.equipment || '',
      tips: step.tips || '',
      critical_point: step.critical_point,
      photo_url: step.photo_url || ''
    });
    setEditingId(step.id);
    setShowAddDialog(true);
  };

  const techniques = [
    'saltear', 'freír', 'hornear', 'asar', 'hervir', 'pochar',
    'blanquear', 'brasear', 'estofar', 'gratinar', 'glasear',
    'marinar', 'flamear', 'reducir', 'emulsionar', 'montar'
  ];

  const totalTime = steps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Pasos de Preparación</CardTitle>
          {totalTime > 0 && (
            <p className="text-sm text-muted-foreground">
              Tiempo total: {totalTime} minutos
            </p>
          )}
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Agregar Paso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Paso' : `Agregar Paso ${steps.length + 1}`}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Title */}
              <div className="grid gap-2">
                <Label>Título del Paso (opcional)</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Preparar la base"
                />
              </div>

              {/* Instruction */}
              <div className="grid gap-2">
                <Label>Instrucción *</Label>
                <Textarea
                  value={form.instruction}
                  onChange={(e) => setForm({ ...form, instruction: e.target.value })}
                  placeholder="Describe el paso detalladamente..."
                  rows={4}
                />
              </div>

              {/* Time & Temperature */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Duración (minutos)
                  </Label>
                  <Input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">
                    <Thermometer className="h-4 w-4" />
                    Temperatura (°C)
                  </Label>
                  <Input
                    type="number"
                    value={form.temperature_celsius}
                    onChange={(e) => setForm({ ...form, temperature_celsius: parseInt(e.target.value) || 0 })}
                    placeholder="Ej: 180"
                  />
                </div>
              </div>

              {/* Technique & Equipment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">
                    <ChefHat className="h-4 w-4" />
                    Técnica
                  </Label>
                  <Select value={form.technique} onValueChange={(v) => setForm({ ...form, technique: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {techniques.map(t => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Equipo Necesario</Label>
                  <Input
                    value={form.equipment}
                    onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    placeholder="Ej: Sartén antiadherente"
                  />
                </div>
              </div>

              {/* Tips */}
              <div className="grid gap-2">
                <Label>Tips / Notas</Label>
                <Textarea
                  value={form.tips}
                  onChange={(e) => setForm({ ...form, tips: e.target.value })}
                  placeholder="Consejos para este paso..."
                  rows={2}
                />
              </div>

              {/* Photo URL */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  URL de Foto
                </Label>
                <Input
                  value={form.photo_url}
                  onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Critical Point */}
              <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <Switch
                  checked={form.critical_point}
                  onCheckedChange={(checked) => setForm({ ...form, critical_point: checked })}
                />
                <div>
                  <Label className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Punto Crítico de Control (HACCP)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marcar si este paso es crítico para la seguridad alimentaria
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? 'Guardar Cambios' : 'Agregar Paso'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay pasos de preparación agregados
          </p>
        ) : (
          <div className="space-y-4">
            {steps.sort((a, b) => a.step_number - b.step_number).map((step) => (
              <div 
                key={step.id} 
                className={`border rounded-lg p-4 ${step.critical_point ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {step.step_number}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {step.title && (
                      <h4 className="font-semibold mb-1">{step.title}</h4>
                    )}
                    <p className="text-sm">{step.instruction}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {step.duration_minutes && step.duration_minutes > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {step.duration_minutes} min
                        </Badge>
                      )}
                      {step.temperature_celsius && step.temperature_celsius > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Thermometer className="h-3 w-3" />
                          {step.temperature_celsius}°C
                        </Badge>
                      )}
                      {step.technique && (
                        <Badge variant="secondary" className="capitalize">
                          {step.technique}
                        </Badge>
                      )}
                      {step.equipment && (
                        <Badge variant="outline">{step.equipment}</Badge>
                      )}
                      {step.critical_point && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          HACCP
                        </Badge>
                      )}
                    </div>
                    
                    {step.tips && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        💡 {step.tips}
                      </p>
                    )}
                  </div>

                  {step.photo_url && (
                    <img 
                      src={step.photo_url} 
                      alt={`Paso ${step.step_number}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}

                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(step)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(step.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
