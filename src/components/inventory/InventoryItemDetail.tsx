 import { useState, useEffect } from 'react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { 
   Package, 
   TrendingUp, 
   TrendingDown, 
   Clock, 
   MapPin, 
   Truck,
   History,
   DollarSign,
   ChefHat,
   Edit,
   AlertTriangle
 } from 'lucide-react';
 import { InventoryItemExtended, InventoryMovement, PriceHistory, InventorySupplier } from '@/hooks/useEnterpriseInventory';
 import { supabase } from '@/integrations/supabase/client';
 import { format, differenceInDays } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 interface Props {
   item: InventoryItemExtended | null;
   isOpen: boolean;
   onClose: () => void;
   onEdit: (item: InventoryItemExtended) => void;
   getMovements: (itemId: string) => Promise<InventoryMovement[]>;
   getPriceHistory: (itemId: string) => Promise<PriceHistory[]>;
   suppliers: InventorySupplier[];
 }
 
 interface RecipeUsage {
   id: string;
   name: string;
   quantity_per_portion: number;
   unit: string;
   menu_item_name?: string;
 }
 
 export const InventoryItemDetail = ({ 
   item, 
   isOpen, 
   onClose, 
   onEdit, 
   getMovements, 
   getPriceHistory,
   suppliers
 }: Props) => {
   const [movements, setMovements] = useState<InventoryMovement[]>([]);
   const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
   const [recipes, setRecipes] = useState<RecipeUsage[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (item && isOpen) {
       loadDetails();
     }
   }, [item, isOpen]);
 
   const loadDetails = async () => {
     if (!item) return;
     setLoading(true);
     try {
       const [movementsData, priceData, recipesData] = await Promise.all([
         getMovements(item.id),
         getPriceHistory(item.id),
         loadRecipeUsage(item.id)
       ]);
       setMovements(movementsData);
       setPriceHistory(priceData);
       setRecipes(recipesData);
     } catch (error) {
       console.error('Error loading item details:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const loadRecipeUsage = async (itemId: string): Promise<RecipeUsage[]> => {
     const { data, error } = await supabase
       .from('recipe_ingredients')
       .select(`
         id, quantity, unit,
         recipes (id, name, menu_item_id, menu_items (item_name))
       `)
       .eq('inventory_item_id', itemId);
     
     if (error) throw error;
     
     return (data || []).map((ri: any) => ({
       id: ri.recipes?.id || ri.id,
       name: ri.recipes?.name || 'Receta desconocida',
       quantity_per_portion: ri.quantity,
       unit: ri.unit,
       menu_item_name: ri.recipes?.menu_items?.item_name
     }));
   };
 
   if (!item) return null;
 
   const now = new Date();
   const daysUntilExpiration = item.expiration_date 
     ? differenceInDays(new Date(item.expiration_date), now)
     : null;
 
   const stockStatus = item.current_stock <= 0 
     ? 'out' 
     : item.par_level > 0 && item.current_stock < item.par_level 
       ? 'low' 
       : 'ok';
 
   const alternativeSuppliers = suppliers.filter(s => 
     s.id !== item.preferred_supplier_id && s.is_active
   );
 
   const getMovementIcon = (type: string) => {
     switch (type) {
       case 'purchase': return <TrendingUp className="h-4 w-4 text-green-500" />;
       case 'sale': case 'deduction': return <TrendingDown className="h-4 w-4 text-destructive" />;
       case 'adjustment': return <Edit className="h-4 w-4 text-primary" />;
       case 'transfer': return <MapPin className="h-4 w-4 text-blue-500" />;
       default: return <History className="h-4 w-4" />;
     }
   };
 
   return (
     <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <SheetContent className="w-full sm:max-w-xl">
         <SheetHeader className="pb-4">
           <SheetTitle className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Package className="h-5 w-5 text-primary" />
               {item.item_name}
             </div>
             <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
               <Edit className="h-4 w-4 mr-1" />
               Editar
             </Button>
           </SheetTitle>
         </SheetHeader>
 
         <ScrollArea className="h-[calc(100vh-8rem)]">
           <div className="space-y-4 pr-4">
             {/* Quick Stats */}
             <div className="grid grid-cols-3 gap-3">
               <Card>
                 <CardContent className="pt-3 pb-3">
                   <p className="text-xs text-muted-foreground">Stock</p>
                   <p className={`text-xl font-bold ${stockStatus === 'out' ? 'text-destructive' : stockStatus === 'low' ? 'text-yellow-600' : ''}`}>
                     {item.current_stock}
                   </p>
                   <p className="text-xs text-muted-foreground">{item.unit}</p>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="pt-3 pb-3">
                   <p className="text-xs text-muted-foreground">Costo Unit.</p>
                   <p className="text-xl font-bold">${item.unit_cost?.toFixed(2) || '0'}</p>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="pt-3 pb-3">
                   <p className="text-xs text-muted-foreground">Valor Total</p>
                   <p className="text-xl font-bold">
                     ${(item.current_stock * (item.unit_cost || 0)).toLocaleString()}
                   </p>
                 </CardContent>
               </Card>
             </div>
 
             {/* Alerts */}
             {(daysUntilExpiration !== null && daysUntilExpiration <= 7) && (
               <Card className="border-destructive bg-destructive/5">
                 <CardContent className="py-3 flex items-center gap-2">
                   <AlertTriangle className="h-5 w-5 text-destructive" />
                   <span className="font-medium">
                     {daysUntilExpiration < 0 
                       ? 'Este producto está VENCIDO' 
                       : `Vence en ${daysUntilExpiration} días`}
                   </span>
                 </CardContent>
               </Card>
             )}
 
             {/* Info Grid */}
             <Card>
               <CardContent className="pt-4">
                 <dl className="grid grid-cols-2 gap-3 text-sm">
                   <div>
                     <dt className="text-muted-foreground">Categoría</dt>
                     <dd className="font-medium">{item.category || '-'}</dd>
                   </div>
                   <div>
                     <dt className="text-muted-foreground">Ubicación</dt>
                     <dd className="font-medium">{item.storage_location?.location_name || '-'}</dd>
                   </div>
                   <div>
                     <dt className="text-muted-foreground">Par Level</dt>
                     <dd className="font-medium">{item.par_level > 0 ? `${item.par_level} ${item.unit}` : '-'}</dd>
                   </div>
                   <div>
                     <dt className="text-muted-foreground">Punto Reorden</dt>
                     <dd className="font-medium">{item.reorder_point ? `${item.reorder_point} ${item.unit}` : '-'}</dd>
                   </div>
                   <div>
                     <dt className="text-muted-foreground">SKU / Código</dt>
                     <dd className="font-medium font-mono">{item.sku || item.barcode || '-'}</dd>
                   </div>
                   <div>
                     <dt className="text-muted-foreground">Lote</dt>
                     <dd className="font-medium font-mono">{item.lot_number || '-'}</dd>
                   </div>
                   <div>
                     <dt className="text-muted-foreground">Vencimiento</dt>
                     <dd className="font-medium">
                       {item.expiration_date 
                         ? format(new Date(item.expiration_date), 'dd MMM yyyy', { locale: es })
                         : '-'}
                     </dd>
                   </div>
                   <div>
                     <dt className="text-muted-foreground">Último Restock</dt>
                     <dd className="font-medium">
                       {item.last_restocked_at 
                         ? format(new Date(item.last_restocked_at), 'dd MMM yyyy', { locale: es })
                         : '-'}
                     </dd>
                   </div>
                 </dl>
               </CardContent>
             </Card>
 
             <Tabs defaultValue="movements" className="space-y-3">
               <TabsList className="grid w-full grid-cols-4">
                 <TabsTrigger value="movements" className="text-xs">
                   <History className="h-3 w-3 mr-1" />
                   Movimientos
                 </TabsTrigger>
                 <TabsTrigger value="prices" className="text-xs">
                   <DollarSign className="h-3 w-3 mr-1" />
                   Precios
                 </TabsTrigger>
                 <TabsTrigger value="recipes" className="text-xs">
                   <ChefHat className="h-3 w-3 mr-1" />
                   Recetas
                 </TabsTrigger>
                 <TabsTrigger value="suppliers" className="text-xs">
                   <Truck className="h-3 w-3 mr-1" />
                   Proveedores
                 </TabsTrigger>
               </TabsList>
 
               <TabsContent value="movements">
                 {loading ? (
                   <p className="text-center py-4 text-muted-foreground">Cargando...</p>
                 ) : movements.length === 0 ? (
                   <p className="text-center py-4 text-muted-foreground">Sin movimientos registrados</p>
                 ) : (
                   <div className="space-y-2">
                     {movements.slice(0, 15).map(m => (
                       <div key={m.id} className="flex items-center justify-between p-2 border rounded text-sm">
                         <div className="flex items-center gap-2">
                           {getMovementIcon(m.movement_type)}
                           <div>
                             <p className="font-medium capitalize">{m.movement_type}</p>
                             <p className="text-xs text-muted-foreground">
                               {format(new Date(m.created_at), 'dd MMM HH:mm', { locale: es })}
                             </p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className={m.quantity_change >= 0 ? 'text-green-600' : 'text-destructive'}>
                             {m.quantity_change >= 0 ? '+' : ''}{m.quantity_change}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             → {m.quantity_after}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </TabsContent>
 
               <TabsContent value="prices">
                 {loading ? (
                   <p className="text-center py-4 text-muted-foreground">Cargando...</p>
                 ) : priceHistory.length === 0 ? (
                   <p className="text-center py-4 text-muted-foreground">Sin historial de precios</p>
                 ) : (
                   <div className="space-y-2">
                     {priceHistory.map(ph => (
                       <div key={ph.id} className="flex items-center justify-between p-2 border rounded text-sm">
                         <div className="flex items-center gap-2">
                           {ph.change_percentage && ph.change_percentage > 0 
                             ? <TrendingUp className="h-4 w-4 text-destructive" />
                             : <TrendingDown className="h-4 w-4 text-green-500" />
                           }
                           <p className="text-xs text-muted-foreground">
                             {format(new Date(ph.recorded_at), 'dd MMM yyyy', { locale: es })}
                           </p>
                         </div>
                         <div className="text-right">
                           <p>${ph.old_price?.toFixed(2)} → <strong>${ph.new_price.toFixed(2)}</strong></p>
                           {ph.change_percentage && (
                             <p className={`text-xs ${ph.change_percentage > 0 ? 'text-destructive' : 'text-green-600'}`}>
                               {ph.change_percentage > 0 ? '+' : ''}{ph.change_percentage.toFixed(1)}%
                             </p>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </TabsContent>
 
               <TabsContent value="recipes">
                 {loading ? (
                   <p className="text-center py-4 text-muted-foreground">Cargando...</p>
                 ) : recipes.length === 0 ? (
                   <p className="text-center py-4 text-muted-foreground">No se usa en ninguna receta</p>
                 ) : (
                   <div className="space-y-2">
                     {recipes.map(r => (
                       <div key={r.id} className="flex items-center justify-between p-2 border rounded text-sm">
                         <div>
                           <p className="font-medium">{r.name}</p>
                           {r.menu_item_name && (
                             <p className="text-xs text-muted-foreground">→ {r.menu_item_name}</p>
                           )}
                         </div>
                         <Badge variant="outline">
                           {r.quantity_per_portion} {r.unit}/porción
                         </Badge>
                       </div>
                     ))}
                   </div>
                 )}
               </TabsContent>
 
               <TabsContent value="suppliers">
                 <div className="space-y-2">
                   {item.preferred_supplier && (
                     <div className="p-3 border-2 border-primary rounded">
                       <div className="flex items-center justify-between">
                         <div>
                           <Badge variant="default" className="mb-1">Preferido</Badge>
                           <p className="font-medium">{item.preferred_supplier.supplier_name}</p>
                           <p className="text-xs text-muted-foreground">
                             {item.preferred_supplier.phone || item.preferred_supplier.email || '-'}
                           </p>
                         </div>
                         {item.preferred_supplier.rating && (
                           <Badge variant="secondary">★ {item.preferred_supplier.rating}</Badge>
                         )}
                       </div>
                     </div>
                   )}
                   {alternativeSuppliers.length > 0 && (
                     <>
                       <p className="text-xs text-muted-foreground pt-2">Alternativos:</p>
                       {alternativeSuppliers.slice(0, 5).map(s => (
                         <div key={s.id} className="p-2 border rounded text-sm">
                           <div className="flex items-center justify-between">
                             <p>{s.supplier_name}</p>
                             {s.rating && <Badge variant="outline">★ {s.rating}</Badge>}
                           </div>
                         </div>
                       ))}
                     </>
                   )}
                 </div>
               </TabsContent>
             </Tabs>
           </div>
         </ScrollArea>
       </SheetContent>
     </Sheet>
   );
 };