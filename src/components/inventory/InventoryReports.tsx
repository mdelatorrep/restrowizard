 import { useState, useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { 
   BarChart3, 
   DollarSign, 
   Package, 
   TrendingUp, 
   TrendingDown,
   Download,
   Calendar,
   Trash2,
   RefreshCw
 } from 'lucide-react';
 import { InventoryItemExtended, StorageLocation, InventoryWaste } from '@/hooks/useEnterpriseInventory';
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
 import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 interface Props {
   inventory: InventoryItemExtended[];
   locations: StorageLocation[];
   waste: InventoryWaste[];
 }
 
 const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
 
 export const InventoryReports = ({ inventory, locations, waste }: Props) => {
   const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '12m'>('3m');
 
   // Valuation Report
   const valuationByCategory = useMemo(() => {
     const grouped: Record<string, { count: number; value: number }> = {};
     inventory.forEach(item => {
       const cat = item.category || 'Sin categoría';
       if (!grouped[cat]) grouped[cat] = { count: 0, value: 0 };
       grouped[cat].count += 1;
       grouped[cat].value += item.current_stock * (item.unit_cost || 0);
     });
     return Object.entries(grouped)
       .map(([name, data]) => ({ name, ...data }))
       .sort((a, b) => b.value - a.value);
   }, [inventory]);
 
   const valuationByLocation = useMemo(() => {
     const grouped: Record<string, { count: number; value: number }> = {};
     inventory.forEach(item => {
       const locName = item.storage_location?.location_name || 'Sin ubicación';
       if (!grouped[locName]) grouped[locName] = { count: 0, value: 0 };
       grouped[locName].count += 1;
       grouped[locName].value += item.current_stock * (item.unit_cost || 0);
     });
     return Object.entries(grouped)
       .map(([name, data]) => ({ name, ...data }))
       .sort((a, b) => b.value - a.value);
   }, [inventory]);
 
   const totalValue = inventory.reduce((sum, i) => sum + (i.current_stock * (i.unit_cost || 0)), 0);
 
   // Turnover Report (simplified)
   const lowTurnoverItems = useMemo(() => {
     return inventory
       .filter(item => {
         // Items that haven't been restocked in 30+ days and have stock
         if (!item.last_restocked_at || item.current_stock <= 0) return false;
         const daysSinceRestock = Math.floor(
           (Date.now() - new Date(item.last_restocked_at).getTime()) / (1000 * 60 * 60 * 24)
         );
         return daysSinceRestock > 30;
       })
       .map(item => ({
         ...item,
         daysSinceRestock: Math.floor(
           (Date.now() - new Date(item.last_restocked_at!).getTime()) / (1000 * 60 * 60 * 24)
         ),
         value: item.current_stock * (item.unit_cost || 0)
       }))
       .sort((a, b) => b.daysSinceRestock - a.daysSinceRestock)
       .slice(0, 20);
   }, [inventory]);
 
   // Waste Report
   const wasteByMonth = useMemo(() => {
     const months: Record<string, { total: number; preventable: number; count: number }> = {};
     const monthsToShow = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
     
     for (let i = 0; i < monthsToShow; i++) {
       const date = subMonths(new Date(), i);
       const key = format(date, 'MMM yyyy', { locale: es });
       months[key] = { total: 0, preventable: 0, count: 0 };
     }
 
     waste.forEach(w => {
       const wasteDate = new Date(w.waste_date);
       const key = format(wasteDate, 'MMM yyyy', { locale: es });
       if (months[key]) {
         months[key].total += w.total_cost || 0;
         if (w.is_preventable) months[key].preventable += w.total_cost || 0;
         months[key].count += 1;
       }
     });
 
     return Object.entries(months)
       .map(([month, data]) => ({ month, ...data }))
       .reverse();
   }, [waste, timeRange]);
 
   const wasteByReason = useMemo(() => {
     const reasons: Record<string, number> = {};
     waste.forEach(w => {
       const reason = w.waste_reason || 'other';
       reasons[reason] = (reasons[reason] || 0) + (w.total_cost || 0);
     });
     const reasonLabels: Record<string, string> = {
       expiration: 'Vencimiento',
       spoilage: 'Deterioro',
       overproduction: 'Sobreproducción',
       preparation_error: 'Error preparación',
       other: 'Otros'
     };
     return Object.entries(reasons)
       .map(([reason, value]) => ({ name: reasonLabels[reason] || reason, value }))
       .sort((a, b) => b.value - a.value);
   }, [waste]);
 
   const totalWaste = waste.reduce((sum, w) => sum + (w.total_cost || 0), 0);
   const preventableWaste = waste.filter(w => w.is_preventable).reduce((sum, w) => sum + (w.total_cost || 0), 0);
 
   return (
     <div className="space-y-4">
       {/* Time Range Selector */}
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold flex items-center gap-2">
           <BarChart3 className="h-5 w-5 text-primary" />
           Reportes de Inventario
         </h3>
         <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
           <SelectTrigger className="w-32">
             <SelectValue />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="1m">1 mes</SelectItem>
             <SelectItem value="3m">3 meses</SelectItem>
             <SelectItem value="6m">6 meses</SelectItem>
             <SelectItem value="12m">12 meses</SelectItem>
           </SelectContent>
         </Select>
       </div>
 
       <Tabs defaultValue="valuation" className="space-y-4">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="valuation" className="gap-2">
             <DollarSign className="h-4 w-4" />
             Valoración
           </TabsTrigger>
           <TabsTrigger value="turnover" className="gap-2">
             <RefreshCw className="h-4 w-4" />
             Rotación
           </TabsTrigger>
           <TabsTrigger value="waste" className="gap-2">
             <Trash2 className="h-4 w-4" />
             Mermas
           </TabsTrigger>
         </TabsList>
 
         {/* Valuation Tab */}
         <TabsContent value="valuation" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Valor Total Inventario</p>
                 <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Total SKUs</p>
                 <p className="text-3xl font-bold">{inventory.length}</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Categorías</p>
                 <p className="text-3xl font-bold">{valuationByCategory.length}</p>
               </CardContent>
             </Card>
           </div>
 
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Por Categoría</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={valuationByCategory.slice(0, 8)} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                       <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                       <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                       <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                       <Bar dataKey="value" fill="hsl(var(--primary))" />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Por Ubicación</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={valuationByLocation}
                         dataKey="value"
                         nameKey="name"
                         cx="50%"
                         cy="50%"
                         outerRadius={80}
                         label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                         labelLine={false}
                       >
                         {valuationByLocation.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
 
         {/* Turnover Tab */}
         <TabsContent value="turnover" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="text-lg">Items de Baja Rotación</CardTitle>
             </CardHeader>
             <CardContent>
               {lowTurnoverItems.length === 0 ? (
                 <p className="text-center py-8 text-muted-foreground">
                   No hay items con baja rotación detectados
                 </p>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Producto</TableHead>
                       <TableHead>Categoría</TableHead>
                       <TableHead className="text-right">Stock</TableHead>
                       <TableHead className="text-right">Valor</TableHead>
                       <TableHead className="text-right">Días sin Restock</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {lowTurnoverItems.map(item => (
                       <TableRow key={item.id}>
                         <TableCell className="font-medium">{item.item_name}</TableCell>
                         <TableCell>{item.category || '-'}</TableCell>
                         <TableCell className="text-right">{item.current_stock} {item.unit}</TableCell>
                         <TableCell className="text-right">${item.value.toLocaleString()}</TableCell>
                         <TableCell className="text-right">
                           <Badge variant={item.daysSinceRestock > 60 ? 'destructive' : 'secondary'}>
                             {item.daysSinceRestock} días
                           </Badge>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Waste Tab */}
         <TabsContent value="waste" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Total Mermas</p>
                 <p className="text-3xl font-bold text-destructive">${totalWaste.toLocaleString()}</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Prevenibles</p>
                 <p className="text-3xl font-bold text-yellow-600">${preventableWaste.toLocaleString()}</p>
                 <p className="text-xs text-muted-foreground">
                   {totalWaste > 0 ? ((preventableWaste / totalWaste) * 100).toFixed(0) : 0}% del total
                 </p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Registros</p>
                 <p className="text-3xl font-bold">{waste.length}</p>
               </CardContent>
             </Card>
           </div>
 
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Tendencia Mensual</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={wasteByMonth}>
                       <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                       <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                       <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                       <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                       <Legend />
                       <Bar dataKey="total" name="Total" fill="hsl(var(--destructive))" />
                       <Bar dataKey="preventable" name="Prevenible" fill="hsl(var(--chart-4))" />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Por Razón</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={wasteByReason}
                         dataKey="value"
                         nameKey="name"
                         cx="50%"
                         cy="50%"
                         outerRadius={80}
                         label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                         labelLine={false}
                       >
                         {wasteByReason.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 };