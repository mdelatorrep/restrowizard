 import { useState } from 'react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Progress } from '@/components/ui/progress';
 import { 
   User, Phone, Mail, Clock, Calendar, Award, 
   AlertTriangle, GraduationCap, Edit, Save, X,
   Briefcase, Shield, FileText
 } from 'lucide-react';
 import { StaffMemberExtended, StaffCertification, StaffAvailability } from '@/hooks/useTalentAdvanced';
 import { format, differenceInDays, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatCurrency';
 
 interface Props {
   staff: StaffMemberExtended | null;
   isOpen: boolean;
   onClose: () => void;
   onUpdate: (id: string, updates: Partial<StaffMemberExtended>) => Promise<void>;
   onAddCertification: (data: Omit<StaffCertification, 'id' | 'staff_member_name'>) => Promise<any>;
 }
 
 const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
 
 export const StaffProfileSheet = ({ staff, isOpen, onClose, onUpdate, onAddCertification }: Props) => {
   const [editMode, setEditMode] = useState(false);
   const [formData, setFormData] = useState<Partial<StaffMemberExtended>>({});
   const [showAddCert, setShowAddCert] = useState(false);
   const [certForm, setCertForm] = useState({
     certification_name: '',
     certification_type: 'training' as const,
     expiration_date: '',
     issuing_authority: ''
   });
 
   if (!staff) return null;
 
   const tenure = staff.hire_date 
     ? differenceInYears(new Date(), new Date(staff.hire_date))
     : null;
 
   const handleEdit = () => {
     setFormData({
       email: staff.email,
       phone: staff.phone,
       emergency_contact_name: staff.emergency_contact_name,
       emergency_contact_phone: staff.emergency_contact_phone,
       max_hours_per_week: staff.max_hours_per_week,
       department: staff.department,
       employee_id: staff.employee_id
     });
     setEditMode(true);
   };
 
   const handleSave = async () => {
     await onUpdate(staff.id, formData);
     setEditMode(false);
   };
 
   const handleAddCert = async () => {
     await onAddCertification({
       staff_member_id: staff.id,
       certification_name: certForm.certification_name,
       certification_type: certForm.certification_type,
       expiration_date: certForm.expiration_date || null,
       issuing_authority: certForm.issuing_authority || null,
       issued_date: new Date().toISOString().split('T')[0],
       document_url: null,
       status: 'valid',
       notes: null
     });
     setShowAddCert(false);
     setCertForm({
       certification_name: '',
       certification_type: 'training',
       expiration_date: '',
       issuing_authority: ''
     });
   };
 
   const expiringCerts = (staff.certifications || []).filter(c => {
     if (!c.expiration_date) return false;
     const daysUntil = differenceInDays(new Date(c.expiration_date), new Date());
     return daysUntil >= 0 && daysUntil <= 30;
   });
 
   return (
     <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <SheetContent className="w-full sm:max-w-xl">
         <SheetHeader className="pb-4">
           <SheetTitle className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Avatar className="h-12 w-12">
                 <AvatarImage src={staff.avatar_url || undefined} />
                 <AvatarFallback>{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
               </Avatar>
               <div>
                 <p className="font-semibold">{staff.name}</p>
                 <p className="text-sm text-muted-foreground font-normal">{staff.position}</p>
               </div>
             </div>
             {!editMode ? (
               <Button variant="outline" size="sm" onClick={handleEdit}>
                 <Edit className="h-4 w-4 mr-1" />
                 Editar
               </Button>
             ) : (
               <div className="flex gap-2">
                 <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                   <X className="h-4 w-4" />
                 </Button>
                 <Button size="sm" onClick={handleSave}>
                   <Save className="h-4 w-4 mr-1" />
                   Guardar
                 </Button>
               </div>
             )}
           </SheetTitle>
         </SheetHeader>
 
         <ScrollArea className="h-[calc(100vh-8rem)]">
           <div className="space-y-4 pr-4">
             {/* Quick Stats */}
             <div className="grid grid-cols-3 gap-3">
               <Card>
                 <CardContent className="pt-3 pb-3 text-center">
                   <Award className="h-5 w-5 mx-auto text-primary mb-1" />
                   <p className="text-xl font-bold">{staff.performance_score || 0}%</p>
                   <p className="text-xs text-muted-foreground">Rendimiento</p>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="pt-3 pb-3 text-center">
                   <GraduationCap className="h-5 w-5 mx-auto text-primary mb-1" />
                   <p className="text-xl font-bold">{staff.training_progress || 0}%</p>
                   <p className="text-xs text-muted-foreground">Capacitación</p>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="pt-3 pb-3 text-center">
                   <Briefcase className="h-5 w-5 mx-auto text-primary mb-1" />
                   <p className="text-xl font-bold">{tenure !== null ? `${tenure}a` : '-'}</p>
                   <p className="text-xs text-muted-foreground">Antigüedad</p>
                 </CardContent>
               </Card>
             </div>
 
             {/* Alerts */}
             {expiringCerts.length > 0 && (
               <Card className="border-yellow-500 bg-yellow-500/5">
                 <CardContent className="py-3 flex items-center gap-2">
                   <AlertTriangle className="h-5 w-5 text-yellow-600" />
                   <span className="text-sm font-medium">
                     {expiringCerts.length} certificación(es) por vencer
                   </span>
                 </CardContent>
               </Card>
             )}
 
             <Tabs defaultValue="info" className="space-y-4">
               <TabsList className="grid w-full grid-cols-3">
                 <TabsTrigger value="info" className="text-xs">
                   <User className="h-3 w-3 mr-1" />
                   Información
                 </TabsTrigger>
                 <TabsTrigger value="availability" className="text-xs">
                   <Calendar className="h-3 w-3 mr-1" />
                   Disponibilidad
                 </TabsTrigger>
                 <TabsTrigger value="certs" className="text-xs">
                   <Shield className="h-3 w-3 mr-1" />
                   Certificaciones
                 </TabsTrigger>
               </TabsList>
 
               <TabsContent value="info" className="space-y-4">
                 {editMode ? (
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label>Email</Label>
                         <Input 
                           value={formData.email || ''} 
                           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                         />
                       </div>
                       <div>
                         <Label>Teléfono</Label>
                         <Input 
                           value={formData.phone || ''} 
                           onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label>Contacto Emergencia</Label>
                         <Input 
                           value={formData.emergency_contact_name || ''} 
                           onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                         />
                       </div>
                       <div>
                         <Label>Tel. Emergencia</Label>
                         <Input 
                           value={formData.emergency_contact_phone || ''} 
                           onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label>Max Horas/Semana</Label>
                         <Input 
                           type="number"
                           value={formData.max_hours_per_week || ''} 
                           onChange={(e) => setFormData({ ...formData, max_hours_per_week: parseInt(e.target.value) || null })}
                         />
                       </div>
                       <div>
                         <Label>ID Empleado</Label>
                         <Input 
                           value={formData.employee_id || ''} 
                           onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                         />
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {staff.email && (
                       <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                         <Mail className="h-5 w-5 text-muted-foreground" />
                         <div>
                           <p className="text-xs text-muted-foreground">Email</p>
                           <p className="font-medium">{staff.email}</p>
                         </div>
                       </div>
                     )}
                     {staff.phone && (
                       <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                         <Phone className="h-5 w-5 text-muted-foreground" />
                         <div>
                           <p className="text-xs text-muted-foreground">Teléfono</p>
                           <p className="font-medium">{staff.phone}</p>
                         </div>
                       </div>
                     )}
                     {staff.hire_date && (
                       <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                         <Calendar className="h-5 w-5 text-muted-foreground" />
                         <div>
                           <p className="text-xs text-muted-foreground">Fecha Contratación</p>
                           <p className="font-medium">{format(new Date(staff.hire_date), 'dd MMM yyyy', { locale: es })}</p>
                         </div>
                       </div>
                     )}
                     {staff.hourly_rate && (
                       <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                         <Briefcase className="h-5 w-5 text-muted-foreground" />
                         <div>
                           <p className="text-xs text-muted-foreground">Tarifa por Hora</p>
                           <p className="font-medium">${staff.hourly_rate}/hr</p>
                         </div>
                       </div>
                     )}
                     {staff.emergency_contact_name && (
                       <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                         <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                         <div>
                           <p className="text-xs text-muted-foreground">Contacto Emergencia</p>
                           <p className="font-medium">{staff.emergency_contact_name}</p>
                           {staff.emergency_contact_phone && <p className="text-sm">{staff.emergency_contact_phone}</p>}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </TabsContent>
 
               <TabsContent value="availability">
                 {!staff.availability || staff.availability.length === 0 ? (
                   <Card>
                     <CardContent className="py-8 text-center text-muted-foreground">
                       <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                       <p>Sin disponibilidad configurada</p>
                     </CardContent>
                   </Card>
                 ) : (
                   <div className="space-y-2">
                     {DAYS.map((day, idx) => {
                       const slot = staff.availability?.find(a => a.day_of_week === idx);
                       return (
                         <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                           <span className="font-medium w-12">{day}</span>
                           {slot ? (
                             slot.is_available ? (
                               <Badge variant="secondary">
                                 <Clock className="h-3 w-3 mr-1" />
                                 {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                               </Badge>
                             ) : (
                               <Badge variant="outline">No disponible</Badge>
                             )
                           ) : (
                             <span className="text-muted-foreground">-</span>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </TabsContent>
 
               <TabsContent value="certs" className="space-y-4">
                 <Button size="sm" onClick={() => setShowAddCert(true)}>
                   <Shield className="h-4 w-4 mr-2" />
                   Agregar Certificación
                 </Button>
 
                 {showAddCert && (
                   <Card>
                     <CardContent className="py-4 space-y-3">
                       <Input 
                         placeholder="Nombre de certificación"
                         value={certForm.certification_name}
                         onChange={(e) => setCertForm({ ...certForm, certification_name: e.target.value })}
                       />
                       <div className="grid grid-cols-2 gap-3">
                         <Input 
                           type="date"
                           placeholder="Vencimiento"
                           value={certForm.expiration_date}
                           onChange={(e) => setCertForm({ ...certForm, expiration_date: e.target.value })}
                         />
                         <Input 
                           placeholder="Entidad"
                           value={certForm.issuing_authority}
                           onChange={(e) => setCertForm({ ...certForm, issuing_authority: e.target.value })}
                         />
                       </div>
                       <div className="flex gap-2">
                         <Button variant="outline" size="sm" onClick={() => setShowAddCert(false)}>
                           Cancelar
                         </Button>
                         <Button size="sm" onClick={handleAddCert}>
                           Agregar
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 )}
 
                 {!staff.certifications || staff.certifications.length === 0 ? (
                   <Card>
                     <CardContent className="py-8 text-center text-muted-foreground">
                       <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                       <p>Sin certificaciones</p>
                     </CardContent>
                   </Card>
                 ) : (
                   <div className="space-y-2">
                     {staff.certifications.map(cert => {
                       const isExpiring = cert.expiration_date && 
                         differenceInDays(new Date(cert.expiration_date), new Date()) <= 30 &&
                         differenceInDays(new Date(cert.expiration_date), new Date()) >= 0;
                       const isExpired = cert.expiration_date && 
                         new Date(cert.expiration_date) < new Date();
                       
                       return (
                         <div 
                           key={cert.id} 
                           className={`p-3 border rounded-lg ${isExpired ? 'border-destructive bg-destructive/5' : isExpiring ? 'border-yellow-500 bg-yellow-500/5' : ''}`}
                         >
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="font-medium">{cert.certification_name}</p>
                               {cert.issuing_authority && (
                                 <p className="text-xs text-muted-foreground">{cert.issuing_authority}</p>
                               )}
                             </div>
                             {cert.expiration_date && (
                               <Badge variant={isExpired ? 'destructive' : isExpiring ? 'secondary' : 'outline'}>
                                 {isExpired ? 'Vencido' : isExpiring ? 'Por vencer' : format(new Date(cert.expiration_date), 'dd MMM yy', { locale: es })}
                               </Badge>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </TabsContent>
             </Tabs>
           </div>
         </ScrollArea>
       </SheetContent>
     </Sheet>
   );
 };