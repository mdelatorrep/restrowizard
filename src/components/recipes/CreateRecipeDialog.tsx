import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Lock } from 'lucide-react';
import { CreateRecipeSchema } from '@/lib/schemas/recipe';
import { toast } from 'sonner';

const INITIAL = {
  name: '',
  category: 'plato_fuerte',
  portions: 1,
  preparation_time_minutes: 30,
  difficulty: 'media' as 'facil' | 'media' | 'dificil',
  instructions: '',
  tips: '',
  is_secret: false,
  is_sub_recipe: false,
  yield_quantity: 1,
  yield_unit: 'porciones',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: typeof INITIAL) => unknown;
}

export const CreateRecipeDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [form, setForm] = useState(INITIAL);

  const handleSubmit = async () => {
    const parsed = CreateRecipeSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    await Promise.resolve(onCreate(form));
    setForm(INITIAL);
    onOpenChange(false);
  };

  const set = (patch: Partial<typeof INITIAL>) => setForm({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Receta</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nombre de la Receta *</Label>
            <Input value={form.name} onChange={e => set({ name: e.target.value })} placeholder="Ej: Pasta Carbonara" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={v => set({ category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="plato_fuerte">Plato Fuerte</SelectItem>
                  <SelectItem value="postre">Postre</SelectItem>
                  <SelectItem value="bebida">Bebida</SelectItem>
                  <SelectItem value="salsa">Salsa</SelectItem>
                  <SelectItem value="base">Base/Preparación</SelectItem>
                  <SelectItem value="guarnicion">Guarnición</SelectItem>
                  <SelectItem value="aderezo">Aderezo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Dificultad</Label>
              <Select value={form.difficulty} onValueChange={v => set({ difficulty: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Porciones/Rendimiento</Label>
              <Input type="number" value={form.portions} onChange={e => set({ portions: parseInt(e.target.value) || 1 })} min={1} />
            </div>
            <div className="grid gap-2">
              <Label>Unidad de Rendimiento</Label>
              <Select value={form.yield_unit} onValueChange={v => set({ yield_unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porciones">Porciones</SelectItem>
                  <SelectItem value="litros">Litros</SelectItem>
                  <SelectItem value="kg">Kilogramos</SelectItem>
                  <SelectItem value="unidades">Unidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tiempo Prep. (min)</Label>
              <Input
                type="number"
                value={form.preparation_time_minutes}
                onChange={e => set({ preparation_time_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Instrucciones Básicas</Label>
            <Textarea
              value={form.instructions}
              onChange={e => set({ instructions: e.target.value })}
              placeholder="Descripción general (los pasos detallados se agregan después)"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_sub_recipe} onCheckedChange={c => set({ is_sub_recipe: c })} />
              <Label>Sub-receta (base para otras recetas)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_secret} onCheckedChange={c => set({ is_secret: c })} />
              <Label className="flex items-center gap-1"><Lock className="h-4 w-4" />Receta Secreta</Label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Crear Receta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
