 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Switch } from '@/components/ui/switch';
 import { 
   CalendarOff, Plus, Check, X, Clock, User,
   Calendar, AlertCircle, CheckCircle, XCircle
 } from 'lucide-react';
 import { TimeOffRequest, StaffMemberExtended } from '@/hooks/useTalentAdvanced';
 import { format, differenceInDays } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 interface Props {
   requests: TimeOffRequest[];
   staff: StaffMemberExtended[];
   onCreate: (data: any) => Promise<any>;
   onUpdate: (id: string, status: 'approved' | 'denied' | 'cancelled', notes?: string) => Promise<void>;
 }
 
 const REQUEST_TYPES = {
   vacation: { label: 'Vacaciones', color: 'bg-blue-100 text-blue-800' },
   sick: { label: 'Enfermedad', color: 'bg-red-100 text-red-800' },
   personal: { label: 'Personal', color: 'bg-purple-100 text-purple-800' },
   unpaid: { label: 'Sin Goce', color: 'bg-gray-100 text-gray-800' },
   other: { label: 'Otro', color: 'bg-yellow-100 text-yellow-800' }
 };
 
 const STATUS_CONFIG = {
   pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
   approved: { label: 'Aprobado', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
   denied: { label: 'Denegado', icon: XCircle, color: 'bg-red-100 text-red-800' },
   cancelled: { label: 'Cancelado', icon: AlertCircle, color: 'bg-gray-100 text-gray-800' }
 };
 
 export const TimeOffRequestsPanel = ({ requests, staff, onCreate, onUpdate }: Props) => {
   const [showCreate, setShowCreate] = useState(false);
   const [activeTab, setActiveTab] = useState('pending');
   const [formData, setFormData] = useState({
     staff_member_id: '',
     request_type: 'vacation' as const,
     start_date: format(new Date(), 'yyyy-MM-dd'),
     end_date: format(new Date(), 'yyyy-MM-dd'),
     is_full_day: true,
     start_time: '09:00',
     end_time: '17:00',
     reason: ''
   });
 
   const pendingRequests = requests.filter(r => r.status === 'pending');
   const approvedRequests = requests.filter(r => r.status === 'approved');
   const otherRequests = requests.filter(r => ['denied', 'cancelled'].includes(r.status));
 
   const handleCreate = async () => {
     if (!formData.staff_member_id || !formData.start_date) return;
     await onCreate({
       staff_member_id: formData.staff_member_id,
       request_type: formData.request_type,
       start_date: formData.start_date,
       end_date: formData.end_date,
       is_full_day: formData.is_full_day,
       start_time: formData.is_full_day ? null : formData.start_time,
       end_time: formData.is_full_day ? null : formData.end_time,
       reason: formData.reason || null
     });
     setShowCreate(false);
     setFormData({
       staff_member_id: '',
       request_type: 'vacation',
       start_date: format(new Date(), 'yyyy-MM-dd'),
       end_date: format(new Date(), 'yyyy-MM-dd'),
       is_full_day: true,
       start_time: '09:00',
       end_time: '17:00',
       reason: ''
     });
   };
 
   const RequestCard = ({ request }: { request: TimeOffRequest }) => {
     const typeConfig = REQUEST_TYPES[request.request_type];
     const statusConfig = STATUS_CONFIG[request.status];
     const StatusIcon = statusConfig.icon;
     const days = differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1;
 
     return (
       <Card>
         <CardContent className="p-4">
           <div className="flex items-start justify-between">
             <div className="flex items-start gap-3">
               <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                 <User className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="font-medium">{request.staff_member_name}</p>
                 <div className="flex items-center gap-2 mt-1">
                   <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                   <Badge className={statusConfig.color}>
                     <StatusIcon className="h-3 w-3 mr-1" />
                     {statusConfig.label}
                   </Badge>
                 </div>
               </div>
             </div>
             <div className="text-right">
               <p className="font-medium">
                 {format(new Date(request.start_date), 'dd MMM', { locale: es })}
                 {request.start_date !== request.end_date && (
                   <> - {format(new Date(request.end_date), 'dd MMM', { locale: es })}</>
                 )}
               </p>
               <p className="text-sm text-muted-foreground">
                 {days} día{days > 1 ? 's' : ''}
                 {!request.is_full_day && ` (${request.start_time?.slice(0,5)}-${request.end_time?.slice(0,5)})`}
               </p>
             </div>
           </div>
           {request.reason && (
             <p className="text-sm text-muted-foreground mt-3 pl-13">
               "{request.reason}"
             </p>
           )}
           {request.status === 'pending' && (
             <div className="flex gap-2 mt-4 pt-3 border-t">
               <Button 
                 size="sm" 
                 className="flex-1"
                 onClick={() => onUpdate(request.id, 'approved')}
               >
                 <Check className="h-4 w-4 mr-1" />
                 Aprobar
               </Button>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="flex-1"
                 onClick={() => onUpdate(request.id, 'denied')}
               >
                 <X className="h-4 w-4 mr-1" />
                 Denegar
               </Button>
             </div>
           )}
         </CardContent>
       </Card>
     );
   };
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold flex items-center gap-2">
           <CalendarOff className="h-5 w-5 text-primary" />
           Solicitudes de Tiempo Libre
           {pendingRequests.length > 0 && (
             <Badge variant="destructive">{pendingRequests.length} pendientes</Badge>
           )}
         </h3>
         <Dialog open={showCreate} onOpenChange={setShowCreate}>
           <DialogTrigger asChild>
             <Button size="sm">
               <Plus className="h-4 w-4 mr-2" />
               Nueva Solicitud
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Nueva Solicitud de Tiempo Libre</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div>
                 <Label>Empleado</Label>
                 <Select 
                   value={formData.staff_member_id} 
                   onValueChange={(v) => setFormData({ ...formData, staff_member_id: v })}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccionar empleado..." />
                   </SelectTrigger>
                   <SelectContent>
                     {staff.filter(s => s.is_active).map(s => (
                       <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Tipo de Solicitud</Label>
                 <Select 
                   value={formData.request_type} 
                   onValueChange={(v: any) => setFormData({ ...formData, request_type: v })}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {Object.entries(REQUEST_TYPES).map(([key, val]) => (
                       <SelectItem key={key} value={key}>{val.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label>Fecha Inicio</Label>
                   <Input 
                     type="date" 
                     value={formData.start_date}
                     onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                   />
                 </div>
                 <div>
                   <Label>Fecha Fin</Label>
                   <Input 
                     type="date" 
                     value={formData.end_date}
                     onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                   />
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <Switch 
                   checked={formData.is_full_day} 
                   onCheckedChange={(v) => setFormData({ ...formData, is_full_day: v })}
                 />
                 <Label>Día completo</Label>
               </div>
               {!formData.is_full_day && (
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
               )}
               <div>
                 <Label>Razón (opcional)</Label>
                 <Textarea 
                   placeholder="Describe el motivo..."
                   value={formData.reason}
                   onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                 />
               </div>
               <Button onClick={handleCreate} className="w-full">
                 Crear Solicitud
               </Button>
             </div>
           </DialogContent>
         </Dialog>
       </div>
 
       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList>
           <TabsTrigger value="pending" className="gap-1">
             <Clock className="h-4 w-4" />
             Pendientes ({pendingRequests.length})
           </TabsTrigger>
           <TabsTrigger value="approved" className="gap-1">
             <CheckCircle className="h-4 w-4" />
             Aprobadas ({approvedRequests.length})
           </TabsTrigger>
           <TabsTrigger value="other" className="gap-1">
             Historial ({otherRequests.length})
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="pending" className="mt-4">
           {pendingRequests.length === 0 ? (
             <Card>
               <CardContent className="py-8 text-center text-muted-foreground">
                 <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                 <p>No hay solicitudes pendientes</p>
               </CardContent>
             </Card>
           ) : (
             <div className="space-y-3">
               {pendingRequests.map(r => <RequestCard key={r.id} request={r} />)}
             </div>
           )}
         </TabsContent>
 
         <TabsContent value="approved" className="mt-4">
           {approvedRequests.length === 0 ? (
             <Card>
               <CardContent className="py-8 text-center text-muted-foreground">
                 <p>No hay solicitudes aprobadas</p>
               </CardContent>
             </Card>
           ) : (
             <div className="space-y-3">
               {approvedRequests.map(r => <RequestCard key={r.id} request={r} />)}
             </div>
           )}
         </TabsContent>
 
         <TabsContent value="other" className="mt-4">
           {otherRequests.length === 0 ? (
             <Card>
               <CardContent className="py-8 text-center text-muted-foreground">
                 <p>Sin historial</p>
               </CardContent>
             </Card>
           ) : (
             <div className="space-y-3">
               {otherRequests.map(r => <RequestCard key={r.id} request={r} />)}
             </div>
           )}
         </TabsContent>
       </Tabs>
     </div>
   );
 };