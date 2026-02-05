 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Truck, MapPin, Plus, Trash2, Loader2, Clock, DollarSign, ShoppingBag } from 'lucide-react';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 
 interface DeliveryZone {
   id: string;
   zone_name: string;
   min_order: number | null;
   delivery_fee: number | null;
   estimated_time_minutes: number | null;
   is_active: boolean;
 }
 
 interface DeliverySettingsTabProps {
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
   deliveryZones: DeliveryZone[];
   addDeliveryZone: () => Promise<void>;
   updateDeliveryZone: (id: string, updates: Partial<DeliveryZone>) => Promise<void>;
   deleteDeliveryZone: (id: string) => Promise<void>;
   zonesLoading: boolean;
 }
 
 export function DeliverySettingsTab({
   formData,
   updateField,
   deliveryZones,
   addDeliveryZone,
   updateDeliveryZone,
   deleteDeliveryZone,
   zonesLoading,
 }: DeliverySettingsTabProps) {
   return (
     <div className="grid gap-6">
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
               <Truck className="w-5 h-5 text-white" />
             </div>
             <div className="flex-1">
               <CardTitle>Configuración de Delivery</CardTitle>
               <CardDescription>Configura tu servicio de domicilios sin comisiones</CardDescription>
             </div>
             <Badge variant="secondary" className="gap-1">
               <DollarSign className="w-3 h-3" /> 0% comisión
             </Badge>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div 
             className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
               formData.show_delivery 
                 ? 'bg-green-500/10 border-green-500/30' 
                 : 'bg-muted/30 border-transparent'
             }`}
           >
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                 <ShoppingBag className="w-6 h-6 text-white" />
               </div>
               <div>
                 <p className="font-semibold">Domicilios habilitados</p>
                 <p className="text-sm text-muted-foreground">Permite que los clientes pidan desde tu sitio</p>
               </div>
             </div>
             <Switch
               checked={!!formData.show_delivery}
               onCheckedChange={(checked) => updateField('show_delivery', checked)}
             />
           </div>
 
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Pedido mínimo general</Label>
               <Input
                 type="number"
                 value={formData.delivery_min_order || 0}
                 onChange={e => updateField('delivery_min_order', parseFloat(e.target.value))}
                 min={0}
                 step={1000}
                 className="h-11"
               />
               <p className="text-xs text-muted-foreground">Aplica cuando no hay zona específica configurada</p>
             </div>
 
             <div className="space-y-2">
               <Label className="text-sm font-medium">WhatsApp para pedidos</Label>
               <Input
                 value={(formData as any).whatsapp_number || ''}
                 onChange={e => updateField('whatsapp_number' as keyof RestaurantWebsite, e.target.value as never)}
                 placeholder="+57 300 123 4567"
                 className="h-11"
               />
               <p className="text-xs text-muted-foreground">Número para recibir confirmaciones</p>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label className="text-sm font-medium">Mensaje para clientes</Label>
             <Textarea
               value={(formData.delivery_message as string) || ''}
               onChange={e => updateField('delivery_message', e.target.value)}
               placeholder="Ej: Hacemos envíos a toda la ciudad. Tiempo estimado: 30-45 min"
               rows={2}
               className="resize-none"
             />
           </div>
         </CardContent>
       </Card>
 
       <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
         <CardHeader>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                 <MapPin className="w-5 h-5 text-white" />
               </div>
               <div>
                 <CardTitle>Zonas de Entrega</CardTitle>
                 <CardDescription>Define zonas con tarifas y tiempos específicos</CardDescription>
               </div>
             </div>
             <Button onClick={addDeliveryZone} size="sm" className="gap-2">
               <Plus className="h-4 w-4" />
               Agregar zona
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {zonesLoading ? (
             <div className="text-center py-12">
               <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
             </div>
           ) : deliveryZones.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
               <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
               <p className="font-medium mb-2">No has configurado zonas de entrega</p>
               <p className="text-sm text-muted-foreground mb-4">Las zonas te permiten definir tarifas y tiempos específicos por ubicación</p>
               <Button variant="outline" onClick={addDeliveryZone} className="gap-2">
                 <Plus className="h-4 w-4" />
                 Crear primera zona
               </Button>
             </div>
           ) : (
             <div className="grid gap-4">
               {deliveryZones.map(zone => (
                 <div 
                   key={zone.id} 
                   className={`p-4 rounded-xl border transition-all ${
                     zone.is_active 
                       ? 'bg-card border-border' 
                       : 'bg-muted/30 opacity-60'
                   }`}
                 >
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                       <Switch
                         checked={zone.is_active}
                         onCheckedChange={(checked) => updateDeliveryZone(zone.id, { is_active: checked })}
                       />
                       <Input
                         value={zone.zone_name}
                         onChange={e => updateDeliveryZone(zone.id, { zone_name: e.target.value })}
                         className="font-semibold w-48 h-9"
                         placeholder="Nombre de zona"
                       />
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="text-destructive hover:text-destructive hover:bg-destructive/10"
                       onClick={() => deleteDeliveryZone(zone.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-1">
                       <Label className="text-xs text-muted-foreground flex items-center gap-1">
                         <ShoppingBag className="w-3 h-3" /> Pedido mínimo
                       </Label>
                       <Input
                         type="number"
                         value={zone.min_order || 0}
                         onChange={e => updateDeliveryZone(zone.id, { min_order: parseFloat(e.target.value) })}
                         min={0}
                         className="h-9"
                       />
                     </div>
                     <div className="space-y-1">
                       <Label className="text-xs text-muted-foreground flex items-center gap-1">
                         <DollarSign className="w-3 h-3" /> Costo envío
                       </Label>
                       <Input
                         type="number"
                         value={zone.delivery_fee || 0}
                         onChange={e => updateDeliveryZone(zone.id, { delivery_fee: parseFloat(e.target.value) })}
                         min={0}
                         className="h-9"
                       />
                     </div>
                     <div className="space-y-1">
                       <Label className="text-xs text-muted-foreground flex items-center gap-1">
                         <Clock className="w-3 h-3" /> Tiempo (min)
                       </Label>
                       <Input
                         type="number"
                         value={zone.estimated_time_minutes || 30}
                         onChange={e => updateDeliveryZone(zone.id, { estimated_time_minutes: parseInt(e.target.value) })}
                         min={5}
                         className="h-9"
                       />
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }