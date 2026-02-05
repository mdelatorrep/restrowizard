 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { 
   ChefHat, 
   Link as LinkIcon, 
   Unlink, 
   Search, 
   ArrowRight,
   Package,
   TrendingDown,
   Clock,
   AlertCircle
 } from 'lucide-react';
 import { InventoryItemExtended } from '@/hooks/useEnterpriseInventory';
 import { supabase } from '@/integrations/supabase/client';
 import { useDataUserId } from '@/hooks/useDataUserId';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 interface RecipeWithIngredients {
   id: string;
   name: string;
   portions_yield: number;
   cost_per_portion: number;
   menu_item_id: string | null;
   menu_item_name?: string;
   ingredients: {
     id: string;
     inventory_item_id: string;
     quantity: number;
     unit: string;
     item_name?: string;
   }[];
 }
 
 interface DeductionLog {
   id: string;
   recipe_name: string;
   item_name: string;
   quantity_deducted: number;
   unit: string;
   deducted_at: string;
   order_id: string | null;
 }
 
 interface Props {
   inventory: InventoryItemExtended[];
 }
 
 export const RecipeIntegrationPanel = ({ inventory }: Props) => {
   const { userId } = useDataUserId();
   const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
   const [deductions, setDeductions] = useState<DeductionLog[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);
 
   useEffect(() => {
     if (userId) {
       loadData();
     }
   }, [userId]);
 
   const loadData = async () => {
     setLoading(true);
     try {
       // Load recipes with ingredients
       const { data: recipesData, error: recipesError } = await supabase
         .from('recipes')
         .select(`
           id, name, portions_yield, cost_per_portion, menu_item_id,
           menu_items (item_name),
           recipe_ingredients (id, inventory_item_id, quantity, unit)
         `)
         .eq('user_id', userId);
 
       if (recipesError) throw recipesError;
 
       const mappedRecipes: RecipeWithIngredients[] = (recipesData || []).map((r: any) => ({
         id: r.id,
         name: r.name,
         portions_yield: r.portions_yield || 1,
         cost_per_portion: r.cost_per_portion || 0,
         menu_item_id: r.menu_item_id,
         menu_item_name: r.menu_items?.item_name,
         ingredients: (r.recipe_ingredients || []).map((ing: any) => {
           const invItem = inventory.find(i => i.id === ing.inventory_item_id);
           return {
             ...ing,
             item_name: invItem?.item_name || 'Item no encontrado'
           };
         })
       }));
 
       setRecipes(mappedRecipes);
 
       // Load recent deductions
       const { data: deductionsData, error: deductionsError } = await supabase
         .from('inventory_deductions')
         .select(`
           id, quantity_deducted, unit, deducted_at, order_id,
           inventory_items (item_name),
           recipes (name)
         `)
         .eq('user_id', userId)
         .order('deducted_at', { ascending: false })
         .limit(50);
 
       if (deductionsError) throw deductionsError;
 
       const mappedDeductions: DeductionLog[] = (deductionsData || []).map((d: any) => ({
         id: d.id,
         recipe_name: d.recipes?.name || 'Receta eliminada',
         item_name: d.inventory_items?.item_name || 'Item eliminado',
         quantity_deducted: d.quantity_deducted,
         unit: d.unit,
         deducted_at: d.deducted_at,
         order_id: d.order_id
       }));
 
       setDeductions(mappedDeductions);
 
     } catch (error) {
       console.error('Error loading recipe data:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const linkedRecipes = recipes.filter(r => r.ingredients.length > 0);
   const unlinkedRecipes = recipes.filter(r => r.ingredients.length === 0);
 
   const filteredRecipes = linkedRecipes.filter(r => 
     r.name.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   const getInventoryItem = (id: string) => inventory.find(i => i.id === id);
 
   const simulateSale = (recipe: RecipeWithIngredients) => {
     return recipe.ingredients.map(ing => {
       const item = getInventoryItem(ing.inventory_item_id);
       const newStock = item ? item.current_stock - ing.quantity : 0;
       const isLow = item && item.par_level > 0 && newStock < item.par_level;
       const isOut = newStock <= 0;
       return {
         ...ing,
         currentStock: item?.current_stock || 0,
         newStock: Math.max(0, newStock),
         unit: item?.unit || ing.unit,
         isLow,
         isOut
       };
     });
   };
 
   if (loading) {
     return (
       <Card>
         <CardContent className="py-12 text-center text-muted-foreground">
           Cargando datos de recetas...
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       {/* Summary Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Recetas Vinculadas</p>
                 <p className="text-2xl font-bold">{linkedRecipes.length}</p>
               </div>
               <LinkIcon className="h-8 w-8 text-green-500 opacity-50" />
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Sin Vincular</p>
                 <p className="text-2xl font-bold text-yellow-600">{unlinkedRecipes.length}</p>
               </div>
               <Unlink className="h-8 w-8 text-yellow-500 opacity-50" />
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Deducciones Hoy</p>
                 <p className="text-2xl font-bold">
                   {deductions.filter(d => 
                     new Date(d.deducted_at).toDateString() === new Date().toDateString()
                   ).length}
                 </p>
               </div>
               <TrendingDown className="h-8 w-8 text-primary opacity-50" />
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Total Recetas</p>
                 <p className="text-2xl font-bold">{recipes.length}</p>
               </div>
               <ChefHat className="h-8 w-8 text-primary opacity-50" />
             </div>
           </CardContent>
         </Card>
       </div>
 
       <Tabs defaultValue="recipes" className="space-y-4">
         <TabsList>
           <TabsTrigger value="recipes" className="gap-2">
             <ChefHat className="h-4 w-4" />
             Recetas e Inventario
           </TabsTrigger>
           <TabsTrigger value="deductions" className="gap-2">
             <TrendingDown className="h-4 w-4" />
             Historial de Deducciones
           </TabsTrigger>
           <TabsTrigger value="simulator" className="gap-2">
             <Package className="h-4 w-4" />
             Simulador de Venta
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="recipes" className="space-y-4">
           <div className="relative max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Buscar receta..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9"
             />
           </div>
 
           {filteredRecipes.length === 0 ? (
             <Card>
               <CardContent className="py-12 text-center text-muted-foreground">
                 <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-50" />
                 <p>No hay recetas vinculadas a inventario</p>
                 <p className="text-sm mt-1">Vincula ingredientes desde el módulo de Recetas</p>
               </CardContent>
             </Card>
           ) : (
             <div className="grid gap-4">
               {filteredRecipes.map(recipe => (
                 <Card key={recipe.id}>
                   <CardHeader className="pb-3">
                     <CardTitle className="flex items-center justify-between text-lg">
                       <div className="flex items-center gap-2">
                         <ChefHat className="h-5 w-5 text-primary" />
                         {recipe.name}
                         {recipe.menu_item_name && (
                           <Badge variant="secondary">→ {recipe.menu_item_name}</Badge>
                         )}
                       </div>
                       <Badge variant="outline">
                         {recipe.ingredients.length} ingredientes
                       </Badge>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Ingrediente</TableHead>
                           <TableHead className="text-right">Por Porción</TableHead>
                           <TableHead className="text-right">Stock Actual</TableHead>
                           <TableHead className="text-right">Porciones Disponibles</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {recipe.ingredients.map(ing => {
                           const item = getInventoryItem(ing.inventory_item_id);
                           const portionsAvailable = item && ing.quantity > 0 
                             ? Math.floor(item.current_stock / ing.quantity)
                             : 0;
                           const isLow = portionsAvailable < 10;
                           return (
                             <TableRow key={ing.id}>
                               <TableCell>
                                 <div className="flex items-center gap-2">
                                   <Package className="h-4 w-4 text-muted-foreground" />
                                   {ing.item_name}
                                 </div>
                               </TableCell>
                               <TableCell className="text-right">
                                 {ing.quantity} {ing.unit}
                               </TableCell>
                               <TableCell className="text-right">
                                 {item ? `${item.current_stock} ${item.unit}` : '-'}
                               </TableCell>
                               <TableCell className="text-right">
                                 <Badge variant={isLow ? 'destructive' : 'secondary'}>
                                   {portionsAvailable}
                                 </Badge>
                               </TableCell>
                             </TableRow>
                           );
                         })}
                       </TableBody>
                     </Table>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </TabsContent>
 
         <TabsContent value="deductions">
           {deductions.length === 0 ? (
             <Card>
               <CardContent className="py-12 text-center text-muted-foreground">
                 <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                 <p>Sin deducciones registradas</p>
                 <p className="text-sm mt-1">Las deducciones se registran automáticamente al procesar ventas</p>
               </CardContent>
             </Card>
           ) : (
             <Card>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Fecha/Hora</TableHead>
                     <TableHead>Receta</TableHead>
                     <TableHead>Ingrediente</TableHead>
                     <TableHead className="text-right">Cantidad</TableHead>
                     <TableHead>Orden</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {deductions.map(d => (
                     <TableRow key={d.id}>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-muted-foreground" />
                           {format(new Date(d.deducted_at), 'dd MMM HH:mm', { locale: es })}
                         </div>
                       </TableCell>
                       <TableCell>{d.recipe_name}</TableCell>
                       <TableCell>{d.item_name}</TableCell>
                       <TableCell className="text-right font-mono">
                         -{d.quantity_deducted} {d.unit}
                       </TableCell>
                       <TableCell>
                         {d.order_id ? (
                           <Badge variant="outline" className="font-mono text-xs">
                             #{d.order_id.slice(0, 8)}
                           </Badge>
                         ) : '-'}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </Card>
           )}
         </TabsContent>
 
         <TabsContent value="simulator" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="text-lg">Simulador: ¿Qué pasa si vendo...?</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">
                 Selecciona una receta para ver cómo afectaría tu inventario
               </p>
               
               <ScrollArea className="h-48">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                   {linkedRecipes.map(recipe => (
                     <Button
                       key={recipe.id}
                       variant={selectedRecipe?.id === recipe.id ? 'default' : 'outline'}
                       className="justify-start"
                       onClick={() => setSelectedRecipe(recipe)}
                     >
                       <ChefHat className="h-4 w-4 mr-2" />
                       {recipe.name}
                     </Button>
                   ))}
                 </div>
               </ScrollArea>
 
               {selectedRecipe && (
                 <div className="pt-4 border-t">
                   <h4 className="font-medium mb-3 flex items-center gap-2">
                     <ArrowRight className="h-4 w-4" />
                     Impacto al vender 1 porción de "{selectedRecipe.name}"
                   </h4>
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Ingrediente</TableHead>
                         <TableHead className="text-right">Actual</TableHead>
                         <TableHead className="text-right">Deducción</TableHead>
                         <TableHead className="text-right">Resultado</TableHead>
                         <TableHead>Estado</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {simulateSale(selectedRecipe).map(ing => (
                         <TableRow key={ing.id}>
                           <TableCell>{ing.item_name}</TableCell>
                           <TableCell className="text-right">
                             {ing.currentStock} {ing.unit}
                           </TableCell>
                           <TableCell className="text-right text-destructive">
                             -{ing.quantity} {ing.unit}
                           </TableCell>
                           <TableCell className="text-right font-medium">
                             {ing.newStock} {ing.unit}
                           </TableCell>
                           <TableCell>
                             {ing.isOut ? (
                               <Badge variant="destructive">
                                 <AlertCircle className="h-3 w-3 mr-1" />
                                 Agotado
                               </Badge>
                             ) : ing.isLow ? (
                               <Badge className="bg-yellow-500">
                                 <AlertCircle className="h-3 w-3 mr-1" />
                                 Bajo Par
                               </Badge>
                             ) : (
                               <Badge variant="secondary">OK</Badge>
                             )}
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 };