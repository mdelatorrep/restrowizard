 import React, { useState, useMemo } from 'react';
 import { Scatter, Bar } from 'react-chartjs-2';
 import { 
   Brain, Star, TrendingUp, TrendingDown, AlertTriangle,
   Calculator, Target, RefreshCw, Package, DollarSign, PieChart
 } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Skeleton } from '@/components/ui/skeleton';
 import { useToast } from '@/hooks/use-toast';
 import { supabase } from '@/integrations/supabase/client';
 import { useQuery } from '@tanstack/react-query';
 import {
   Chart as ChartJS,
   CategoryScale,
   LinearScale,
   PointElement,
   BarElement,
   Title,
   Tooltip,
   Legend,
 } from 'chart.js';
 
 ChartJS.register(
   CategoryScale,
   LinearScale,
   PointElement,
   BarElement,
   Title,
   Tooltip,
   Legend
 );
 
 interface MenuEngineeringTabProps {
   menuId: string;
 }
 
 interface MenuItemWithCost {
   id: string;
   name: string;
   price: number;
   category: string;
   recipe_cost: number;
   margin_percent: number;
   popularity_score: number;
   profitability_score: number;
   bcg_category: 'star' | 'cash_cow' | 'question_mark' | 'dog' | 'unknown';
   sales_count: number;
   revenue: number;
 }
 
 export const MenuEngineeringTab: React.FC<MenuEngineeringTabProps> = ({ menuId }) => {
   const { toast } = useToast();
   const [isRecalculating, setIsRecalculating] = useState(false);
 
   const { data: itemsData, isLoading, refetch } = useQuery({
     queryKey: ['menu-engineering', menuId],
     queryFn: async () => {
       // Get menu items with costs from the view
       const { data: items, error } = await supabase
         .from('menu_items_with_costs')
         .select('*')
         .eq('menu_id', menuId);
 
       if (error) throw error;
 
       // Get sales data for items
       const { data: menu } = await supabase
         .from('restaurant_menus')
         .select('user_id')
         .eq('id', menuId)
         .single();
 
       if (!menu) return [];
 
       const { data: orders } = await supabase
         .from('restaurant_orders')
         .select('items, total')
         .eq('user_id', menu.user_id)
         .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
         .not('status', 'in', '("cancelled","pending")');
 
       // Calculate sales per item
       const salesCount: Record<string, { count: number; revenue: number }> = {};
       
       if (orders) {
         for (const order of orders) {
           const orderItems = order.items as any[];
           if (Array.isArray(orderItems)) {
             for (const item of orderItems) {
               const itemId = item.menu_item_id;
               if (itemId) {
                 if (!salesCount[itemId]) {
                   salesCount[itemId] = { count: 0, revenue: 0 };
                 }
                 salesCount[itemId].count += item.quantity || 1;
                 salesCount[itemId].revenue += (item.price || 0) * (item.quantity || 1);
               }
             }
           }
         }
       }
 
       return (items || []).map(item => ({
         id: item.id,
         name: item.name,
         price: Number(item.price),
         category: item.category,
         recipe_cost: Number(item.recipe_cost) || 0,
         margin_percent: Number(item.margin_percent) || 0,
         popularity_score: Number(item.popularity_score) || 0,
         profitability_score: Number(item.profitability_score) || 0,
         bcg_category: (item.bcg_category || 'unknown') as MenuItemWithCost['bcg_category'],
         sales_count: salesCount[item.id]?.count || 0,
         revenue: salesCount[item.id]?.revenue || 0
       }));
     }
   });
 
   const items = itemsData || [];
 
   const handleRecalculate = async () => {
     setIsRecalculating(true);
     try {
       const { data: menu } = await supabase
         .from('restaurant_menus')
         .select('user_id')
         .eq('id', menuId)
         .single();
 
       if (menu) {
         await supabase.rpc('calculate_menu_item_scores', {
           p_user_id: menu.user_id,
           p_days: 30
         });
         await refetch();
         toast({ title: 'Scores recalculados exitosamente' });
       }
     } catch (error) {
       toast({ title: 'Error al recalcular', variant: 'destructive' });
     } finally {
       setIsRecalculating(false);
     }
   };
 
   // Calculate insights
   const insights = useMemo(() => {
     if (items.length === 0) return null;
     
     const stars = items.filter(i => i.bcg_category === 'star');
     const cashCows = items.filter(i => i.bcg_category === 'cash_cow');
     const dogs = items.filter(i => i.bcg_category === 'dog');
     const questionMarks = items.filter(i => i.bcg_category === 'question_mark');
     const lowMargin = items.filter(i => i.margin_percent > 0 && i.margin_percent < 50);
     const avgMargin = items.reduce((sum, i) => sum + i.margin_percent, 0) / items.length;
     const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);
     
     return { stars, cashCows, dogs, questionMarks, lowMargin, avgMargin, totalRevenue };
   }, [items]);
 
   // BCG Scatter Chart data
   const bcgChartData = {
     datasets: [{
       label: 'Productos',
       data: items.map(item => ({
         x: item.profitability_score || (item.margin_percent || 50),
         y: item.popularity_score || 50,
         label: item.name
       })),
       backgroundColor: items.map(item => {
         switch(item.bcg_category) {
           case 'star': return 'rgba(34, 197, 94, 0.8)';
           case 'cash_cow': return 'rgba(59, 130, 246, 0.8)';
           case 'question_mark': return 'rgba(251, 146, 60, 0.8)';
           case 'dog': return 'rgba(239, 68, 68, 0.8)';
           default: return 'rgba(156, 163, 175, 0.8)';
         }
       }),
       pointRadius: 10
     }]
   };
 
   // Margin Bar Chart data
   const marginChartData = {
     labels: items.slice(0, 10).map(i => i.name.substring(0, 15)),
     datasets: [{
       label: 'Margen %',
       data: items.slice(0, 10).map(i => i.margin_percent),
       backgroundColor: items.slice(0, 10).map(i => 
         i.margin_percent >= 60 ? 'rgba(34, 197, 94, 0.8)' :
         i.margin_percent >= 40 ? 'rgba(251, 146, 60, 0.8)' :
         'rgba(239, 68, 68, 0.8)'
       )
     }]
   };
 
   const getCategoryBadge = (category: string) => {
     switch (category) {
       case 'star':
         return <Badge className="bg-green-100 text-green-700">⭐ Estrella</Badge>;
       case 'cash_cow':
         return <Badge className="bg-blue-100 text-blue-700">🐄 Vaca Lechera</Badge>;
       case 'question_mark':
         return <Badge className="bg-orange-100 text-orange-700">❓ Incógnita</Badge>;
       case 'dog':
         return <Badge className="bg-red-100 text-red-700">🐕 Perro</Badge>;
       default:
         return <Badge variant="secondary">Sin clasificar</Badge>;
     }
   };
 
   if (isLoading) {
     return (
       <div className="space-y-4 p-4">
         <Skeleton className="h-8 w-64" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
         </div>
         <Skeleton className="h-64" />
       </div>
     );
   }
 
   if (items.length === 0) {
     return (
       <Card className="border-dashed">
         <CardContent className="flex flex-col items-center justify-center py-12">
           <PieChart className="w-12 h-12 text-muted-foreground/50 mb-4" />
           <h3 className="text-lg font-medium mb-2">Sin datos de ingeniería</h3>
           <p className="text-muted-foreground text-center">
             Agrega productos con recetas vinculadas para ver el análisis de ingeniería de menú
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h3 className="text-lg font-semibold flex items-center gap-2">
             <Brain className="w-5 h-5 text-primary" />
             Ingeniería de Menú
           </h3>
           <p className="text-sm text-muted-foreground">
             Análisis de rentabilidad y popularidad de los productos de este menú
           </p>
         </div>
         <Button 
           onClick={handleRecalculate} 
           disabled={isRecalculating}
           variant="outline"
         >
           <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
           Recalcular Scores
         </Button>
       </div>
 
       {/* KPI Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-green-100">
                 <Star className="w-5 h-5 text-green-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold">{insights?.stars.length || 0}</p>
                 <p className="text-xs text-muted-foreground">Estrellas</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-blue-100">
                 <TrendingUp className="w-5 h-5 text-blue-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold">{(insights?.avgMargin || 0).toFixed(1)}%</p>
                 <p className="text-xs text-muted-foreground">Margen Prom.</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-orange-100">
                 <AlertTriangle className="w-5 h-5 text-orange-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold">{insights?.lowMargin.length || 0}</p>
                 <p className="text-xs text-muted-foreground">Margen Bajo</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-purple-100">
                 <DollarSign className="w-5 h-5 text-purple-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold">${(insights?.totalRevenue || 0).toFixed(0)}</p>
                 <p className="text-xs text-muted-foreground">Revenue 30d</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card>
           <CardHeader>
             <CardTitle className="text-base">Matriz BCG (Popularidad vs Rentabilidad)</CardTitle>
             <CardDescription>
               Cuadrante superior derecho = Estrellas (mantener), inferior derecho = Vacas lecheras (optimizar)
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="h-64">
               <Scatter 
                 data={bcgChartData}
                 options={{
                   responsive: true,
                   maintainAspectRatio: false,
                   plugins: {
                     legend: { display: false },
                     tooltip: {
                       callbacks: {
                         label: function(context: any) {
                           const item = items[context.dataIndex];
                           return item ? `${item.name} - Margen: ${item.margin_percent.toFixed(1)}%` : '';
                         }
                       }
                     }
                   },
                   scales: {
                     x: { 
                       title: { display: true, text: 'Rentabilidad (%)' }, 
                       min: 0, max: 100,
                       grid: { color: 'rgba(0,0,0,0.05)' }
                     },
                     y: { 
                       title: { display: true, text: 'Popularidad (%)' }, 
                       min: 0, max: 100,
                       grid: { color: 'rgba(0,0,0,0.05)' }
                     }
                   }
                 }}
               />
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-base">Márgenes por Producto</CardTitle>
             <CardDescription>Top 10 productos ordenados por margen de ganancia</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="h-64">
               <Bar 
                 data={marginChartData}
                 options={{
                   responsive: true,
                   maintainAspectRatio: false,
                   indexAxis: 'y',
                   plugins: { legend: { display: false } },
                   scales: {
                     x: { 
                       title: { display: true, text: 'Margen %' },
                       max: 100
                     }
                   }
                 }}
               />
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Items Table */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base">Detalle de Productos</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b">
                   <th className="text-left py-3 px-2">Producto</th>
                   <th className="text-right py-3 px-2">Precio</th>
                   <th className="text-right py-3 px-2">Costo</th>
                   <th className="text-right py-3 px-2">Margen</th>
                   <th className="text-right py-3 px-2">Ventas</th>
                   <th className="text-center py-3 px-2">Categoría BCG</th>
                 </tr>
               </thead>
               <tbody>
                 {items.map(item => (
                   <tr key={item.id} className="border-b hover:bg-muted/50">
                     <td className="py-3 px-2">
                       <div>
                         <p className="font-medium">{item.name}</p>
                         <p className="text-xs text-muted-foreground">{item.category}</p>
                       </div>
                     </td>
                     <td className="text-right py-3 px-2">${item.price.toFixed(2)}</td>
                     <td className="text-right py-3 px-2">
                       {item.recipe_cost > 0 ? `$${item.recipe_cost.toFixed(2)}` : '-'}
                     </td>
                     <td className="text-right py-3 px-2">
                       <span className={
                         item.margin_percent >= 60 ? 'text-green-600' :
                         item.margin_percent >= 40 ? 'text-orange-600' :
                         item.margin_percent > 0 ? 'text-red-600' : 'text-muted-foreground'
                       }>
                         {item.margin_percent > 0 ? `${item.margin_percent.toFixed(1)}%` : '-'}
                       </span>
                     </td>
                     <td className="text-right py-3 px-2">{item.sales_count}</td>
                     <td className="text-center py-3 px-2">{getCategoryBadge(item.bcg_category)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </CardContent>
       </Card>
 
       {/* Legend */}
       <div className="flex flex-wrap gap-4 text-sm">
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-green-500" />
           <span>Estrellas: Alta popularidad + Alta rentabilidad</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-blue-500" />
           <span>Vacas Lecheras: Baja popularidad + Alta rentabilidad</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-orange-500" />
           <span>Incógnitas: Alta popularidad + Baja rentabilidad</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-red-500" />
           <span>Perros: Baja popularidad + Baja rentabilidad</span>
         </div>
       </div>
     </div>
   );
 };