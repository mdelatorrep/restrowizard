 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { Label } from '@/components/ui/label';
 import { Input } from '@/components/ui/input';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Calendar, Clock, Check, X, Edit, Save } from 'lucide-react';
 import { StaffMemberExtended, StaffAvailability } from '@/hooks/useTalentAdvanced';
 
 interface Props {
   staff: StaffMemberExtended[];
   onSave: (staffId: string, slots: Omit<StaffAvailability, 'id' | 'staff_member_id'>[]) => Promise<void>;
 }
 
 const DAYS = [
   { value: 0, label: 'Domingo', short: 'Dom' },
   { value: 1, label: 'Lunes', short: 'Lun' },
   { value: 2, label: 'Martes', short: 'Mar' },
   { value: 3, label: 'Miércoles', short: 'Mié' },
   { value: 4, label: 'Jueves', short: 'Jue' },
   { value: 5, label: 'Viernes', short: 'Vie' },
   { value: 6, label: 'Sábado', short: 'Sáb' }
 ];
 
 interface AvailabilitySlot {
   day_of_week: number;
   start_time: string;
   end_time: string;
   is_available: boolean;
   notes: string | null;
 }
 
 export const AvailabilityManager = ({ staff, onSave }: Props) => {
   const [selectedStaff, setSelectedStaff] = useState<StaffMemberExtended | null>(null);
   const [editMode, setEditMode] = useState(false);
   const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
   const [saving, setSaving] = useState(false);
 
   const openEditor = (member: StaffMemberExtended) => {
     setSelectedStaff(member);
     // Initialize slots from existing availability or create defaults
     if (member.availability && member.availability.length > 0) {
       setSlots(member.availability.map(a => ({
         day_of_week: a.day_of_week,
         start_time: a.start_time,
         end_time: a.end_time,
         is_available: a.is_available,
         notes: a.notes
       })));
     } else {
       // Default: available Mon-Fri 9-17
       setSlots([1, 2, 3, 4, 5].map(day => ({
         day_of_week: day,
         start_time: '09:00',
         end_time: '17:00',
         is_available: true,
         notes: null
       })));
     }
     setEditMode(true);
   };
 
   const toggleDay = (day: number) => {
     const exists = slots.find(s => s.day_of_week === day);
     if (exists) {
       setSlots(slots.filter(s => s.day_of_week !== day));
     } else {
       setSlots([...slots, {
         day_of_week: day,
         start_time: '09:00',
         end_time: '17:00',
         is_available: true,
         notes: null
       }].sort((a, b) => a.day_of_week - b.day_of_week));
     }
   };
 
   const updateSlot = (day: number, field: keyof AvailabilitySlot, value: any) => {
     setSlots(slots.map(s => 
       s.day_of_week === day ? { ...s, [field]: value } : s
     ));
   };
 
   const handleSave = async () => {
     if (!selectedStaff) return;
     setSaving(true);
     await onSave(selectedStaff.id, slots.map(s => ({
       ...s,
       effective_from: null,
       effective_until: null
     })));
     setSaving(false);
     setEditMode(false);
     setSelectedStaff(null);
   };
 
   const getDaySlot = (member: StaffMemberExtended, day: number) => {
     return member.availability?.find(a => a.day_of_week === day);
   };
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold flex items-center gap-2">
           <Calendar className="h-5 w-5 text-primary" />
           Disponibilidad del Equipo
         </h3>
       </div>
 
       <Card>
         <CardContent className="p-0">
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="border-b">
                   <th className="p-3 text-left font-medium">Empleado</th>
                   {DAYS.map(day => (
                     <th key={day.value} className="p-3 text-center font-medium text-sm">
                       {day.short}
                     </th>
                   ))}
                   <th className="p-3 text-right">Acción</th>
                 </tr>
               </thead>
               <tbody>
                 {staff.filter(s => s.is_active).map(member => (
                   <tr key={member.id} className="border-b hover:bg-muted/50">
                     <td className="p-3">
                       <div>
                         <p className="font-medium">{member.name}</p>
                         <p className="text-xs text-muted-foreground">{member.position}</p>
                       </div>
                     </td>
                     {DAYS.map(day => {
                       const slot = getDaySlot(member, day.value);
                       return (
                         <td key={day.value} className="p-3 text-center">
                           {slot ? (
                             slot.is_available ? (
                               <Badge variant="secondary" className="text-xs">
                                 {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="text-xs text-muted-foreground">
                                 <X className="h-3 w-3" />
                               </Badge>
                             )
                           ) : (
                             <span className="text-muted-foreground">-</span>
                           )}
                         </td>
                       );
                     })}
                     <td className="p-3 text-right">
                       <Button variant="ghost" size="sm" onClick={() => openEditor(member)}>
                         <Edit className="h-4 w-4" />
                       </Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </CardContent>
       </Card>
 
       {/* Edit Dialog */}
       <Dialog open={editMode} onOpenChange={(open) => !open && setEditMode(false)}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Clock className="h-5 w-5 text-primary" />
               Disponibilidad de {selectedStaff?.name}
             </DialogTitle>
           </DialogHeader>
           <ScrollArea className="max-h-[60vh]">
             <div className="space-y-4 pr-4">
               {DAYS.map(day => {
                 const slot = slots.find(s => s.day_of_week === day.value);
                 return (
                   <div key={day.value} className="flex items-center gap-4 p-3 border rounded-lg">
                     <div className="flex items-center gap-2 w-24">
                       <Switch
                         checked={!!slot}
                         onCheckedChange={() => toggleDay(day.value)}
                       />
                       <span className="font-medium">{day.short}</span>
                     </div>
                     {slot && (
                       <div className="flex items-center gap-2 flex-1">
                         <Input
                           type="time"
                           value={slot.start_time}
                           onChange={(e) => updateSlot(day.value, 'start_time', e.target.value)}
                           className="w-28"
                         />
                         <span>-</span>
                         <Input
                           type="time"
                           value={slot.end_time}
                           onChange={(e) => updateSlot(day.value, 'end_time', e.target.value)}
                           className="w-28"
                         />
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </ScrollArea>
           <div className="flex gap-2 pt-4">
             <Button variant="outline" className="flex-1" onClick={() => setEditMode(false)}>
               Cancelar
             </Button>
             <Button className="flex-1" onClick={handleSave} disabled={saving}>
               <Save className="h-4 w-4 mr-2" />
               {saving ? 'Guardando...' : 'Guardar'}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };