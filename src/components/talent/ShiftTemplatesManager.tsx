 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { 
   LayoutTemplate, Plus, Trash2, Clock, Copy, 
   Palette
 } from 'lucide-react';
import { ShiftTemplate } from '@/hooks/useTalentAdvanced';
import { ShiftTemplateSchema } from '@/lib/schemas/shiftTemplate';
import { toast } from 'sonner';
 
 interface Props {
   templates: ShiftTemplate[];
   onCreate: (data: Omit<ShiftTemplate, 'id' | 'is_active'>) => Promise<any>;
   onDelete: (id: string) => Promise<void>;
   onApply?: (template: ShiftTemplate) => void;
 }
 
 const COLORS = [
   { value: '#3b82f6', label: 'Azul' },
   { value: '#22c55e', label: 'Verde' },
   { value: '#f59e0b', label: 'Naranja' },
   { value: '#ef4444', label: 'Rojo' },
   { value: '#8b5cf6', label: 'Violeta' },
   { value: '#ec4899', label: 'Rosa' },
   { value: '#06b6d4', label: 'Cyan' },
   { value: '#64748b', label: 'Gris' }
 ];
 
 const POSITIONS = [
   'chef', 'cocinero', 'ayudante_cocina', 'mesero', 
   'barista', 'cajero', 'gerente', 'host', 'bartender'
 ];
 
 export const ShiftTemplatesManager = ({ templates, onCreate, onDelete, onApply }: Props) => {
   const [showCreate, setShowCreate] = useState(false);
   const [formData, setFormData] = useState({
     template_name: '',
     position: '',
     start_time: '09:00',
     end_time: '17:00',
     break_minutes: 30,
     color: '#3b82f6',
     description: ''
   });
 
  const handleCreate = async () => {
    const parsed = ShiftTemplateSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    await onCreate({
      template_name: formData.template_name,
      position: formData.position || null,
      start_time: formData.start_time,
      end_time: formData.end_time,
      break_minutes: formData.break_minutes,
      color: formData.color,
      description: formData.description || null
    });
    setShowCreate(false);
    setFormData({
      template_name: '',
      position: '',
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 30,
      color: '#3b82f6',
      description: ''
    });
  };
 
   const calculateHours = (start: string, end: string, breakMin: number) => {
     const [sh, sm] = start.split(':').map(Number);
     const [eh, em] = end.split(':').map(Number);
     const totalMinutes = (eh * 60 + em) - (sh * 60 + sm) - breakMin;
     return (totalMinutes / 60).toFixed(1);
   };
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold flex items-center gap-2">
           <LayoutTemplate className="h-5 w-5 text-primary" />
           Plantillas de Turno
         </h3>
         <Dialog open={showCreate} onOpenChange={setShowCreate}>
           <DialogTrigger asChild>
             <Button size="sm">
               <Plus className="h-4 w-4 mr-2" />
               Nueva Plantilla
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Crear Plantilla de Turno</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div>
                 <Label>Nombre de la Plantilla *</Label>
                 <Input 
                   placeholder="Ej: Turno Mañana"
                   value={formData.template_name}
                   onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                 />
               </div>
               <div>
                 <Label>Posición (opcional)</Label>
                 <Select 
                   value={formData.position} 
                   onValueChange={(v) => setFormData({ ...formData, position: v })}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Cualquier posición" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="">Cualquier posición</SelectItem>
                     {POSITIONS.map(p => (
                       <SelectItem key={p} value={p}>{p}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label>Hora Inicio</Label>
                   <Input 
                     type="time" 
                     value={formData.start_time}
                     onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                   />
                 </div>
                 <div>
                   <Label>Hora Fin</Label>
                   <Input 
                     type="time" 
                     value={formData.end_time}
                     onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                   />
                 </div>
               </div>
               <div>
                 <Label>Descanso (minutos)</Label>
                 <Input 
                   type="number"
                   value={formData.break_minutes}
                   onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
                 />
               </div>
               <div>
                 <Label>Color</Label>
                 <div className="flex gap-2 mt-2">
                   {COLORS.map(c => (
                     <button
                       key={c.value}
                       type="button"
                       className={`w-8 h-8 rounded-full border-2 ${formData.color === c.value ? 'border-foreground' : 'border-transparent'}`}
                       style={{ backgroundColor: c.value }}
                       onClick={() => setFormData({ ...formData, color: c.value })}
                       title={c.label}
                     />
                   ))}
                 </div>
               </div>
               <div>
                 <Label>Descripción (opcional)</Label>
                 <Input 
                   placeholder="Notas sobre este turno..."
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 />
               </div>
               <Button onClick={handleCreate} className="w-full">
                 Crear Plantilla
               </Button>
             </div>
           </DialogContent>
         </Dialog>
       </div>
 
       {templates.length === 0 ? (
         <Card>
           <CardContent className="py-8 text-center text-muted-foreground">
             <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-50" />
             <p>Sin plantillas de turno</p>
             <p className="text-sm">Crea plantillas para asignar turnos más rápido</p>
           </CardContent>
         </Card>
       ) : (
         <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
           {templates.map(template => (
             <Card key={template.id} className="relative overflow-hidden">
               <div 
                 className="absolute left-0 top-0 bottom-0 w-1"
                 style={{ backgroundColor: template.color || '#3b82f6' }}
               />
               <CardContent className="p-4 pl-5">
                 <div className="flex items-start justify-between">
                   <div>
                     <p className="font-medium">{template.template_name}</p>
                     {template.position && (
                       <Badge variant="secondary" className="text-xs mt-1">
                         {template.position}
                       </Badge>
                     )}
                   </div>
                   <div className="flex gap-1">
                     {onApply && (
                       <Button variant="ghost" size="icon" onClick={() => onApply(template)}>
                         <Copy className="h-4 w-4" />
                       </Button>
                     )}
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="text-destructive"
                       onClick={() => onDelete(template.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
                 <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                   <div className="flex items-center gap-1">
                     <Clock className="h-4 w-4" />
                     {template.start_time.slice(0, 5)} - {template.end_time.slice(0, 5)}
                   </div>
                   <span>
                     {calculateHours(template.start_time, template.end_time, template.break_minutes)}h
                   </span>
                 </div>
                 {template.description && (
                   <p className="text-xs text-muted-foreground mt-2">{template.description}</p>
                 )}
               </CardContent>
             </Card>
           ))}
         </div>
       )}
     </div>
   );
 };