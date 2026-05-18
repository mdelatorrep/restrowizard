 import { useState, useEffect } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Package, Check } from 'lucide-react';
 import { PurchaseOrder, PurchaseOrderItem, InventoryItemExtended } from '@/hooks/useEnterpriseInventory';
 import { supabase } from '@/integrations/supabase/client';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { ReceiveOrderSchema } from '@/lib/schemas/receiveOrder';
 import { toast } from 'sonner';
 import { ReceiveOrderItemRow, type ReceivedItem } from './ReceiveOrderItemRow';

 interface Props {
   order: PurchaseOrder | null;
   isOpen: boolean;
   onClose: () => void;
   onReceive: (orderId: string, items: { id: string; quantity_received: number; lot_number?: string; expiration_date?: string }[]) => Promise<void>;
 }

 interface OrderItemWithDetails extends PurchaseOrderItem {
   inventory_item?: InventoryItemExtended;
 }

 export const ReceiveOrderDialog = ({ order, isOpen, onClose, onReceive }: Props) => {
   const [items, setItems] = useState<ReceivedItem[]>([]);
   const [loading, setLoading] = useState(false);
   const [submitting, setSubmitting] = useState(false);
 
   useEffect(() => {
     if (order && isOpen) {
       loadOrderItems();
     }
   }, [order, isOpen]);
 
   const loadOrderItems = async () => {
     if (!order) return;
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('purchase_order_items')
         .select(`
           *,
           inventory_items (id, item_name, unit, is_perishable)
         `)
         .eq('purchase_order_id', order.id);
       
       if (error) throw error;
 
       const mappedItems: ReceivedItem[] = (data || []).map((item: any) => ({
         id: item.id,
         inventory_item_id: item.inventory_item_id,
         item_name: item.inventory_items?.item_name || 'Item desconocido',
         quantity_ordered: item.quantity_ordered,
         quantity_previously_received: item.quantity_received || 0,
         quantity_receiving: item.quantity_ordered - (item.quantity_received || 0),
         unit: item.unit,
         lot_number: item.lot_number || '',
         expiration_date: item.expiration_date || '',
         is_receiving: true
       }));
 
       setItems(mappedItems.filter(i => i.quantity_receiving > 0));
     } catch (error) {
       console.error('Error loading order items:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const updateItem = (id: string, field: keyof ReceivedItem, value: any) => {
     setItems(prev => prev.map(item => 
       item.id === id ? { ...item, [field]: value } : item
     ));
   };
 
   const handleSubmit = async () => {
     if (!order) return;
     setSubmitting(true);
     try {
       const itemsToReceive = items
         .filter(item => item.is_receiving && item.quantity_receiving > 0)
         .map(item => ({
           id: item.id,
           quantity_received: item.quantity_previously_received + item.quantity_receiving,
           lot_number: item.lot_number || undefined,
           expiration_date: item.expiration_date || undefined
         }));

       const parsed = ReceiveOrderSchema.safeParse({ items: itemsToReceive });
       if (!parsed.success) {
         toast.error(parsed.error.issues[0]?.message || 'Revisa los items');
         setSubmitting(false);
         return;
       }

       await onReceive(order.id, itemsToReceive);
       onClose();
     } catch (error) {
       console.error('Error receiving order:', error);
     } finally {
       setSubmitting(false);
     }
   };
 
   const totalItems = items.filter(i => i.is_receiving).length;
   const totalUnits = items.filter(i => i.is_receiving).reduce((sum, i) => sum + i.quantity_receiving, 0);
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <DialogContent className="max-w-3xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Package className="h-5 w-5 text-primary" />
             Recibir Orden {order?.order_number}
           </DialogTitle>
           <DialogDescription>
             {order?.expected_delivery && (
               <span>Entrega esperada: {format(new Date(order.expected_delivery), 'dd MMM yyyy', { locale: es })}</span>
             )}
           </DialogDescription>
         </DialogHeader>
 
         {loading ? (
           <div className="py-8 text-center text-muted-foreground">Cargando items...</div>
         ) : items.length === 0 ? (
           <div className="py-8 text-center text-muted-foreground">
             <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
             <p>Todos los items ya fueron recibidos</p>
           </div>
         ) : (
           <>
             <ScrollArea className="max-h-[50vh]">
               <div className="space-y-3 pr-4">
                  {items.map((item) => (
                    <ReceiveOrderItemRow
                      key={item.id}
                      item={item}
                      onUpdate={(field, value) => updateItem(item.id, field, value)}
                    />
                  ))}
               </div>
             </ScrollArea>
 
             <div className="flex items-center justify-between pt-4 border-t">
               <div className="text-sm text-muted-foreground">
                 {totalItems} items • {totalUnits} unidades a recibir
               </div>
               <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose}>
                   Cancelar
                 </Button>
                 <Button onClick={handleSubmit} disabled={submitting || totalItems === 0}>
                   <Check className="h-4 w-4 mr-2" />
                   {submitting ? 'Procesando...' : 'Confirmar Recepción'}
                 </Button>
               </div>
             </div>
           </>
         )}
       </DialogContent>
     </Dialog>
   );
 };