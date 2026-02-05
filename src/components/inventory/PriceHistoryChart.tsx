 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { TrendingUp, TrendingDown, Minus, DollarSign, Calendar, RefreshCw } from 'lucide-react';
 import { InventoryItemExtended, PriceHistory } from '@/hooks/useEnterpriseInventory';
 import { supabase } from '@/integrations/supabase/client';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
 
 interface Props {
   inventory: InventoryItemExtended[];
   getPriceHistory: (itemId: string) => Promise<PriceHistory[]>;
 }
 
 export const PriceHistoryChart = ({ inventory, getPriceHistory }: Props) => {
   const [selectedItemId, setSelectedItemId] = useState<string>('');
   const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
   const [loading, setLoading] = useState(false);
 
   useEffect(() => {
     if (selectedItemId) {
       loadHistory();
     }
   }, [selectedItemId]);
 
   const loadHistory = async () => {
     if (!selectedItemId) return;
     setLoading(true);
     try {
       const data = await getPriceHistory(selectedItemId);
       setPriceHistory(data);
     } catch (error) {
       console.error('Error loading price history:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const selectedItem = inventory.find(i => i.id === selectedItemId);
 
   const chartData = [...priceHistory].reverse().map(ph => ({
     date: format(new Date(ph.recorded_at), 'dd/MM', { locale: es }),
     fullDate: format(new Date(ph.recorded_at), 'dd MMM yyyy', { locale: es }),
     price: ph.new_price,
     change: ph.change_percentage
   }));
 
   const avgPrice = priceHistory.length > 0
     ? priceHistory.reduce((sum, p) => sum + p.new_price, 0) / priceHistory.length
     : 0;
 
   const latestChange = priceHistory[0]?.change_percentage || 0;
   const maxPrice = Math.max(...priceHistory.map(p => p.new_price), 0);
   const minPrice = Math.min(...priceHistory.filter(p => p.new_price > 0).map(p => p.new_price), Infinity);
 
   const getTrendIcon = (change: number | null) => {
     if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
     if (change > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
     return <TrendingDown className="h-4 w-4 text-green-500" />;
   };
 
   const getTrendColor = (change: number | null) => {
     if (!change) return 'text-muted-foreground';
     return change > 0 ? 'text-destructive' : 'text-green-500';
   };
 
   return (
     <div className="space-y-4">
       {/* Item Selector */}
       <div className="flex items-center gap-4">
         <div className="flex-1 max-w-md">
           <Select value={selectedItemId} onValueChange={setSelectedItemId}>
             <SelectTrigger>
               <SelectValue placeholder="Selecciona un producto para ver historial" />
             </SelectTrigger>
             <SelectContent>
               {inventory.map(item => (
                 <SelectItem key={item.id} value={item.id}>
                   {item.item_name} - ${item.unit_cost?.toFixed(2) || '0.00'}/{item.unit}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
         {selectedItemId && (
           <Button variant="outline" size="icon" onClick={loadHistory} disabled={loading}>
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
         )}
       </div>
 
       {!selectedItemId ? (
         <Card>
           <CardContent className="py-12 text-center text-muted-foreground">
             <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
             <p>Selecciona un producto para ver su historial de precios</p>
           </CardContent>
         </Card>
       ) : loading ? (
         <Card>
           <CardContent className="py-12 text-center text-muted-foreground">
             Cargando historial...
           </CardContent>
         </Card>
       ) : priceHistory.length === 0 ? (
         <Card>
           <CardContent className="py-12 text-center text-muted-foreground">
             <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
             <p>Sin historial de cambios de precio para este producto</p>
             <p className="text-sm mt-1">Precio actual: ${selectedItem?.unit_cost?.toFixed(2) || '0.00'}</p>
           </CardContent>
         </Card>
       ) : (
         <>
           {/* Stats */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Precio Actual</p>
                 <p className="text-2xl font-bold">${selectedItem?.unit_cost?.toFixed(2)}</p>
                 <div className={`flex items-center gap-1 mt-1 ${getTrendColor(latestChange)}`}>
                   {getTrendIcon(latestChange)}
                   <span className="text-sm">{latestChange > 0 ? '+' : ''}{latestChange?.toFixed(1)}%</span>
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Promedio</p>
                 <p className="text-2xl font-bold">${avgPrice.toFixed(2)}</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Máximo</p>
                 <p className="text-2xl font-bold text-destructive">${maxPrice.toFixed(2)}</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-4">
                 <p className="text-sm text-muted-foreground">Mínimo</p>
                 <p className="text-2xl font-bold text-green-600">${minPrice === Infinity ? '0.00' : minPrice.toFixed(2)}</p>
               </CardContent>
             </Card>
           </div>
 
           {/* Chart */}
           {chartData.length > 1 && (
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Evolución de Precio</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         tickLine={false}
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         tickLine={false}
                         tickFormatter={(v) => `$${v}`}
                       />
                       <Tooltip 
                         formatter={(value: number) => [`$${value.toFixed(2)}`, 'Precio']}
                         labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                       />
                       <Legend />
                       <Line 
                         type="monotone" 
                         dataKey="price" 
                         name="Precio"
                         stroke="hsl(var(--primary))" 
                         strokeWidth={2}
                         dot={{ r: 4 }}
                         activeDot={{ r: 6 }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
           )}
 
           {/* History Table */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg">Historial de Cambios</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Fecha</TableHead>
                     <TableHead className="text-right">Precio Anterior</TableHead>
                     <TableHead className="text-right">Nuevo Precio</TableHead>
                     <TableHead className="text-right">Cambio</TableHead>
                     <TableHead>Razón</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {priceHistory.map(ph => (
                     <TableRow key={ph.id}>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-muted-foreground" />
                           {format(new Date(ph.recorded_at), 'dd MMM yyyy HH:mm', { locale: es })}
                         </div>
                       </TableCell>
                       <TableCell className="text-right">
                         ${ph.old_price?.toFixed(2) || '-'}
                       </TableCell>
                       <TableCell className="text-right font-medium">
                         ${ph.new_price.toFixed(2)}
                       </TableCell>
                       <TableCell className="text-right">
                         <div className={`flex items-center justify-end gap-1 ${getTrendColor(ph.change_percentage)}`}>
                           {getTrendIcon(ph.change_percentage)}
                           <span>
                             {ph.change_percentage ? `${ph.change_percentage > 0 ? '+' : ''}${ph.change_percentage.toFixed(1)}%` : '-'}
                           </span>
                         </div>
                       </TableCell>
                       <TableCell>
                         {ph.change_reason || '-'}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
         </>
       )}
     </div>
   );
 };