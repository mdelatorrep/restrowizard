 import { useState } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { ArrowRight, MoveHorizontal, Package } from 'lucide-react';
 import { InventoryItemExtended, StorageLocation } from '@/hooks/useEnterpriseInventory';
 
 interface Props {
   isOpen: boolean;
   onClose: () => void;
   inventory: InventoryItemExtended[];
   locations: StorageLocation[];
   onTransfer: (itemId: string, fromLocationId: string | null, toLocationId: string, quantity: number, notes?: string) => Promise<void>;
 }
 
 export const TransferDialog = ({ isOpen, onClose, inventory, locations, onTransfer }: Props) => {
   const [selectedItemId, setSelectedItemId] = useState<string>('');
   const [toLocationId, setToLocationId] = useState<string>('');
   const [quantity, setQuantity] = useState<number>(1);
   const [notes, setNotes] = useState<string>('');
   const [submitting, setSubmitting] = useState(false);
 
   const selectedItem = inventory.find(i => i.id === selectedItemId);
   const fromLocation = selectedItem?.storage_location;
 
   const handleSubmit = async () => {
     if (!selectedItemId || !toLocationId) return;
     setSubmitting(true);
     try {
       await onTransfer(
         selectedItemId,
         fromLocation?.id || null,
         toLocationId,
         quantity,
         notes || undefined
       );
       onClose();
       resetForm();
     } catch (error) {
       console.error('Transfer failed:', error);
     } finally {
       setSubmitting(false);
     }
   };
 
   const resetForm = () => {
     setSelectedItemId('');
     setToLocationId('');
     setQuantity(1);
     setNotes('');
   };
 
   const handleClose = () => {
     onClose();
     resetForm();
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <MoveHorizontal className="h-5 w-5 text-primary" />
             Transferir Inventario
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4">
           {/* Item Selection */}
           <div>
             <Label>Producto</Label>
             <Select value={selectedItemId} onValueChange={setSelectedItemId}>
               <SelectTrigger>
                 <SelectValue placeholder="Seleccionar producto" />
               </SelectTrigger>
               <SelectContent>
                 {inventory.filter(i => i.current_stock > 0).map(item => (
                   <SelectItem key={item.id} value={item.id}>
                     <div className="flex items-center gap-2">
                       <Package className="h-4 w-4" />
                       {item.item_name} ({item.current_stock} {item.unit})
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* From -> To Display */}
           {selectedItem && (
             <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
               <div className="text-center">
                 <p className="text-xs text-muted-foreground">Origen</p>
                 <p className="font-medium">
                   {fromLocation?.location_name || 'Sin ubicación'}
                 </p>
               </div>
               <ArrowRight className="h-5 w-5 text-muted-foreground" />
               <div className="text-center">
                 <p className="text-xs text-muted-foreground">Destino</p>
                 <p className="font-medium">
                   {locations.find(l => l.id === toLocationId)?.location_name || 'Seleccionar'}
                 </p>
               </div>
             </div>
           )}
 
           {/* Destination */}
           <div>
             <Label>Ubicación Destino</Label>
             <Select value={toLocationId} onValueChange={setToLocationId}>
               <SelectTrigger>
                 <SelectValue placeholder="Seleccionar destino" />
               </SelectTrigger>
               <SelectContent>
                 {locations
                   .filter(loc => loc.id !== fromLocation?.id && loc.is_active)
                   .map(loc => (
                     <SelectItem key={loc.id} value={loc.id}>
                       {loc.location_name}
                       {loc.location_type && ` (${loc.location_type})`}
                     </SelectItem>
                   ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Quantity */}
           <div>
             <Label>Cantidad a transferir</Label>
             <Input
               type="number"
               min={1}
               max={selectedItem?.current_stock || 1}
               value={quantity}
               onChange={(e) => setQuantity(Number(e.target.value))}
             />
             {selectedItem && (
               <p className="text-xs text-muted-foreground mt-1">
                 Disponible: {selectedItem.current_stock} {selectedItem.unit}
               </p>
             )}
           </div>
 
           {/* Notes */}
           <div>
             <Label>Notas (opcional)</Label>
             <Textarea
               placeholder="Razón de la transferencia..."
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={2}
             />
           </div>
 
           {/* Actions */}
           <div className="flex gap-2 pt-2">
             <Button variant="outline" className="flex-1" onClick={handleClose}>
               Cancelar
             </Button>
             <Button 
               className="flex-1" 
               onClick={handleSubmit}
               disabled={!selectedItemId || !toLocationId || quantity < 1 || submitting}
             >
               {submitting ? 'Transfiriendo...' : 'Confirmar Transferencia'}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };