 import { useState, useEffect, useRef } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { 
   ClipboardCheck, 
   Scan, 
   Check, 
   X, 
   ChevronLeft, 
   ChevronRight,
   Package,
   AlertTriangle,
   Save
 } from 'lucide-react';
  import { InventoryCount, InventoryCountItem, InventoryItemExtended } from '@/hooks/useEnterpriseInventory';
  import { supabase } from '@/integrations/supabase/client';
  import { CountedItemSchema } from '@/lib/schemas/countedItem';
  import { toast } from 'sonner';
 
 interface Props {
   count: InventoryCount | null;
   isOpen: boolean;
   onClose: () => void;
   onUpdateItem: (countId: string, itemId: string, quantity: number, notes?: string) => Promise<void>;
   onComplete: (countId: string, applyAdjustments: boolean) => Promise<void>;
   onLookupBarcode: (barcode: string) => InventoryItemExtended | undefined;
 }
 
 interface CountItemWithDetails extends InventoryCountItem {
   item_name: string;
   category: string;
   unit: string;
   barcode: string | null;
   sku: string | null;
 }
 
 export const CountingSession = ({ 
   count, 
   isOpen, 
   onClose, 
   onUpdateItem, 
   onComplete,
   onLookupBarcode
 }: Props) => {
   const [items, setItems] = useState<CountItemWithDetails[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [countedValue, setCountedValue] = useState<string>('');
   const [notes, setNotes] = useState('');
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [scanMode, setScanMode] = useState(false);
   const [scanInput, setScanInput] = useState('');
   const inputRef = useRef<HTMLInputElement>(null);
   const scanInputRef = useRef<HTMLInputElement>(null);
 
   useEffect(() => {
     if (count && isOpen) {
       loadCountItems();
     }
   }, [count, isOpen]);
 
   useEffect(() => {
     if (items[currentIndex]) {
       setCountedValue(items[currentIndex].counted_quantity?.toString() || '');
       setNotes(items[currentIndex].notes || '');
     }
   }, [currentIndex, items]);
 
   useEffect(() => {
     if (scanMode && scanInputRef.current) {
       scanInputRef.current.focus();
     } else if (!scanMode && inputRef.current) {
       inputRef.current.focus();
     }
   }, [scanMode, currentIndex]);
 
   const loadCountItems = async () => {
     if (!count) return;
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('inventory_count_items')
         .select(`
           *,
           inventory_items (item_name, category, unit, barcode, sku)
         `)
         .eq('count_id', count.id)
         .order('created_at');
 
       if (error) throw error;
 
       const mapped: CountItemWithDetails[] = (data || []).map((item: any) => ({
         ...item,
         item_name: item.inventory_items?.item_name || 'Item desconocido',
         category: item.inventory_items?.category || '',
         unit: item.inventory_items?.unit || 'unidades',
         barcode: item.inventory_items?.barcode,
         sku: item.inventory_items?.sku
       }));
 
       setItems(mapped);
       
       // Find first uncounted item
       const firstUncounted = mapped.findIndex(i => i.counted_quantity === null);
       setCurrentIndex(firstUncounted >= 0 ? firstUncounted : 0);
     } catch (error) {
       console.error('Error loading count items:', error);
     } finally {
       setLoading(false);
     }
   };
 
    const handleSaveAndNext = async () => {
      const currentItem = items[currentIndex];
      if (!currentItem || !count) return;
  
      const parsed = CountedItemSchema.safeParse({ counted_quantity: countedValue, notes });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || 'Cantidad inválida');
        return;
      }
      const qty = parsed.data.counted_quantity;
  
      setSaving(true);
      try {
        await onUpdateItem(count.id, currentItem.id, qty, parsed.data.notes || undefined);
       
       // Update local state
       setItems(prev => prev.map((item, idx) => 
         idx === currentIndex 
           ? { ...item, counted_quantity: qty, notes: notes || null }
           : item
       ));
 
       // Move to next uncounted item
       const nextUncounted = items.findIndex((item, idx) => 
         idx > currentIndex && item.counted_quantity === null
       );
       if (nextUncounted >= 0) {
         setCurrentIndex(nextUncounted);
       } else if (currentIndex < items.length - 1) {
         setCurrentIndex(currentIndex + 1);
       }
       
       setCountedValue('');
       setNotes('');
     } catch (error) {
       console.error('Error saving count:', error);
     } finally {
       setSaving(false);
     }
   };
 
   const handleScanSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!scanInput.trim()) return;
 
     // Find item by barcode or SKU
     const foundIndex = items.findIndex(item => 
       item.barcode === scanInput.trim() || item.sku === scanInput.trim()
     );
 
     if (foundIndex >= 0) {
       setCurrentIndex(foundIndex);
       setScanMode(false);
       setScanInput('');
     } else {
       // Item not in this count
       setScanInput('');
     }
   };
 
   const handleComplete = async (apply: boolean) => {
     if (!count) return;
     await onComplete(count.id, apply);
     onClose();
   };
 
   const currentItem = items[currentIndex];
   const countedCount = items.filter(i => i.counted_quantity !== null).length;
   const progress = items.length > 0 ? (countedCount / items.length) * 100 : 0;
   const hasVariance = currentItem && currentItem.counted_quantity !== null && 
     currentItem.counted_quantity !== currentItem.system_quantity;
 
   if (!count) return null;
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <DialogContent className="max-w-2xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <ClipboardCheck className="h-5 w-5 text-primary" />
             {count.count_name}
           </DialogTitle>
           <DialogDescription>
             {countedCount} de {items.length} items contados
           </DialogDescription>
         </DialogHeader>
 
         {loading ? (
           <div className="py-12 text-center text-muted-foreground">
             Cargando items del conteo...
           </div>
         ) : items.length === 0 ? (
           <div className="py-12 text-center text-muted-foreground">
             <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
             <p>No hay items en este conteo</p>
           </div>
         ) : (
           <div className="space-y-4">
             {/* Progress */}
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span>Progreso del conteo</span>
                 <span className="font-medium">{progress.toFixed(0)}%</span>
               </div>
               <Progress value={progress} />
             </div>
 
             {/* Scan Mode Toggle */}
             <div className="flex gap-2">
               <Button 
                 variant={scanMode ? 'default' : 'outline'} 
                 size="sm"
                 onClick={() => setScanMode(!scanMode)}
                 className="gap-2"
               >
                 <Scan className="h-4 w-4" />
                 {scanMode ? 'Modo Escaneo Activo' : 'Escanear Código'}
               </Button>
             </div>
 
             {/* Scan Input */}
             {scanMode && (
               <form onSubmit={handleScanSubmit} className="flex gap-2">
                 <Input
                   ref={scanInputRef}
                   value={scanInput}
                   onChange={(e) => setScanInput(e.target.value)}
                   placeholder="Escanea código de barras..."
                   autoFocus
                 />
                 <Button type="submit">
                   <Check className="h-4 w-4" />
                 </Button>
               </form>
             )}
 
             {/* Current Item Card */}
             {currentItem && (
               <Card className="border-primary">
                 <CardContent className="pt-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-lg font-semibold">{currentItem.item_name}</p>
                       <p className="text-sm text-muted-foreground">
                         {currentItem.category || 'Sin categoría'}
                         {currentItem.barcode && ` • ${currentItem.barcode}`}
                       </p>
                     </div>
                     <Badge variant="outline">
                       {currentIndex + 1} / {items.length}
                     </Badge>
                   </div>
 
                   <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                     <div>
                       <p className="text-xs text-muted-foreground">Stock Sistema</p>
                       <p className="text-2xl font-bold">
                         {currentItem.system_quantity} {currentItem.unit}
                       </p>
                     </div>
                     <div>
                       <Label className="text-xs">Cantidad Contada</Label>
                       <Input
                         ref={inputRef}
                         type="number"
                         value={countedValue}
                         onChange={(e) => setCountedValue(e.target.value)}
                         placeholder="Ingresa cantidad..."
                         className="text-xl font-bold h-12"
                         min={0}
                         step="0.01"
                       />
                     </div>
                   </div>
 
                   {/* Variance Warning */}
                   {countedValue && parseFloat(countedValue) !== currentItem.system_quantity && (
                     <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                       <AlertTriangle className="h-4 w-4 text-yellow-600" />
                       <span className="text-sm">
                         Varianza: {parseFloat(countedValue) - currentItem.system_quantity > 0 ? '+' : ''}
                         {(parseFloat(countedValue) - currentItem.system_quantity).toFixed(2)} {currentItem.unit}
                       </span>
                     </div>
                   )}
 
                   <div>
                     <Label className="text-xs">Notas (opcional)</Label>
                     <Input
                       value={notes}
                       onChange={(e) => setNotes(e.target.value)}
                       placeholder="Observaciones..."
                     />
                   </div>
 
                   {/* Navigation and Save */}
                   <div className="flex items-center justify-between pt-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                       disabled={currentIndex === 0}
                     >
                       <ChevronLeft className="h-4 w-4 mr-1" />
                       Anterior
                     </Button>
 
                     <Button onClick={handleSaveAndNext} disabled={saving || !countedValue}>
                       <Save className="h-4 w-4 mr-2" />
                       {saving ? 'Guardando...' : 'Guardar y Siguiente'}
                     </Button>
 
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
                       disabled={currentIndex === items.length - 1}
                     >
                       Siguiente
                       <ChevronRight className="h-4 w-4 ml-1" />
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             )}
 
             {/* Items Overview */}
             <div>
               <Label className="text-xs">Resumen de items</Label>
               <ScrollArea className="h-32 border rounded-lg p-2 mt-1">
                 <div className="flex flex-wrap gap-1">
                   {items.map((item, idx) => (
                     <Button
                       key={item.id}
                       variant={idx === currentIndex ? 'default' : item.counted_quantity !== null ? 'secondary' : 'outline'}
                       size="sm"
                       className="h-8 w-8 p-0 text-xs"
                       onClick={() => setCurrentIndex(idx)}
                     >
                       {item.counted_quantity !== null ? (
                         <Check className="h-3 w-3" />
                       ) : (
                         idx + 1
                       )}
                     </Button>
                   ))}
                 </div>
               </ScrollArea>
             </div>
 
             {/* Complete Actions */}
             {countedCount === items.length && (
               <div className="flex gap-2 pt-4 border-t">
                 <Button 
                   variant="outline" 
                   className="flex-1"
                   onClick={() => handleComplete(false)}
                 >
                   <X className="h-4 w-4 mr-2" />
                   Cerrar sin ajustar
                 </Button>
                 <Button 
                   className="flex-1"
                   onClick={() => handleComplete(true)}
                 >
                   <Check className="h-4 w-4 mr-2" />
                   Aplicar ajustes al inventario
                 </Button>
               </div>
             )}
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 };