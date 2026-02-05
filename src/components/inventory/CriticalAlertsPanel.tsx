 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { 
   AlertTriangle, 
   Clock, 
   Package, 
   TrendingDown, 
   ClipboardList, 
   ClipboardCheck,
   ChevronRight,
   XCircle
 } from 'lucide-react';
 import { InventoryItemExtended, PurchaseOrder, InventoryCount } from '@/hooks/useEnterpriseInventory';
 import { differenceInDays, format } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 interface Props {
   inventory: InventoryItemExtended[];
   purchaseOrders: PurchaseOrder[];
   inventoryCounts: InventoryCount[];
   onNavigateToTab: (tab: string) => void;
   onSelectItem?: (item: InventoryItemExtended) => void;
 }
 
 interface AlertItem {
   id: string;
   type: 'expired' | 'expiring' | 'out_of_stock' | 'below_par' | 'pending_po' | 'stale_count';
   priority: 'critical' | 'warning' | 'info';
   title: string;
   subtitle: string;
   action?: () => void;
   actionLabel?: string;
 }
 
 export const CriticalAlertsPanel = ({ 
   inventory, 
   purchaseOrders, 
   inventoryCounts, 
   onNavigateToTab,
   onSelectItem
 }: Props) => {
   const now = new Date();
   const alerts: AlertItem[] = [];
 
   // Expired items
   const expiredItems = inventory.filter(item => {
     if (!item.expiration_date) return false;
     return new Date(item.expiration_date) < now;
   });
   expiredItems.forEach(item => {
     alerts.push({
       id: `expired-${item.id}`,
       type: 'expired',
       priority: 'critical',
       title: `${item.item_name} VENCIDO`,
       subtitle: `Venció el ${format(new Date(item.expiration_date!), 'dd MMM', { locale: es })} • ${item.current_stock} ${item.unit}`,
       action: () => onSelectItem?.(item),
       actionLabel: 'Ver'
     });
   });
 
   // Expiring soon (7 days)
   const expiringItems = inventory.filter(item => {
     if (!item.expiration_date) return false;
     const daysUntil = differenceInDays(new Date(item.expiration_date), now);
     return daysUntil > 0 && daysUntil <= 7;
   });
   expiringItems.forEach(item => {
     const daysUntil = differenceInDays(new Date(item.expiration_date!), now);
     alerts.push({
       id: `expiring-${item.id}`,
       type: 'expiring',
       priority: daysUntil <= 3 ? 'critical' : 'warning',
       title: `${item.item_name} por vencer`,
       subtitle: `Vence en ${daysUntil} día${daysUntil > 1 ? 's' : ''} • ${item.current_stock} ${item.unit}`,
       action: () => onSelectItem?.(item),
       actionLabel: 'Ver'
     });
   });
 
   // Out of stock
   const outOfStockItems = inventory.filter(item => item.current_stock <= 0);
   outOfStockItems.forEach(item => {
     alerts.push({
       id: `oos-${item.id}`,
       type: 'out_of_stock',
       priority: 'critical',
       title: `${item.item_name} AGOTADO`,
       subtitle: item.preferred_supplier?.supplier_name || 'Sin proveedor asignado',
       action: () => onNavigateToTab('orders'),
       actionLabel: 'Ordenar'
     });
   });
 
   // Below par level
   const belowParItems = inventory.filter(item => 
     item.par_level > 0 && 
     item.current_stock < item.par_level && 
     item.current_stock > 0
   );
   belowParItems.slice(0, 5).forEach(item => {
     alerts.push({
       id: `par-${item.id}`,
       type: 'below_par',
       priority: 'warning',
       title: `${item.item_name} bajo par`,
       subtitle: `${item.current_stock}/${item.par_level} ${item.unit}`,
       action: () => onNavigateToTab('orders'),
       actionLabel: 'Ordenar'
     });
   });
 
   // Pending purchase orders
   const pendingPOs = purchaseOrders.filter(po => ['sent', 'partial'].includes(po.status));
   pendingPOs.forEach(po => {
     const daysWaiting = po.expected_delivery 
       ? differenceInDays(now, new Date(po.order_date))
       : null;
     alerts.push({
       id: `po-${po.id}`,
       type: 'pending_po',
       priority: daysWaiting && daysWaiting > 7 ? 'warning' : 'info',
       title: `OC ${po.order_number} pendiente`,
       subtitle: po.expected_delivery 
         ? `Entrega esperada: ${format(new Date(po.expected_delivery), 'dd MMM', { locale: es })}`
         : 'Sin fecha de entrega',
       action: () => onNavigateToTab('orders'),
       actionLabel: 'Recibir'
     });
   });
 
   // Stale inventory counts (>30 days without counting)
   const lastCompletedCount = inventoryCounts.find(c => c.status === 'completed');
   if (lastCompletedCount) {
     const daysSinceCount = differenceInDays(now, new Date(lastCompletedCount.completed_at || lastCompletedCount.started_at));
     if (daysSinceCount > 30) {
       alerts.push({
         id: 'stale-count',
         type: 'stale_count',
         priority: 'info',
         title: 'Conteo vencido',
         subtitle: `Último conteo hace ${daysSinceCount} días`,
         action: () => onNavigateToTab('counts'),
         actionLabel: 'Iniciar'
       });
     }
   } else if (inventory.length > 0) {
     alerts.push({
       id: 'no-count',
       type: 'stale_count',
       priority: 'info',
       title: 'Sin conteos registrados',
       subtitle: 'Realiza tu primer conteo físico',
       action: () => onNavigateToTab('counts'),
       actionLabel: 'Iniciar'
     });
   }
 
   // Sort by priority
   const priorityOrder = { critical: 0, warning: 1, info: 2 };
   alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
 
   const criticalCount = alerts.filter(a => a.priority === 'critical').length;
   const warningCount = alerts.filter(a => a.priority === 'warning').length;
 
   if (alerts.length === 0) return null;
 
   const getIcon = (type: AlertItem['type']) => {
     switch (type) {
       case 'expired': return <XCircle className="h-4 w-4" />;
       case 'expiring': return <Clock className="h-4 w-4" />;
       case 'out_of_stock': return <Package className="h-4 w-4" />;
       case 'below_par': return <TrendingDown className="h-4 w-4" />;
       case 'pending_po': return <ClipboardList className="h-4 w-4" />;
       case 'stale_count': return <ClipboardCheck className="h-4 w-4" />;
     }
   };
 
   const getPriorityColor = (priority: AlertItem['priority']) => {
     switch (priority) {
       case 'critical': return 'bg-destructive text-destructive-foreground';
       case 'warning': return 'bg-yellow-500 text-white';
       case 'info': return 'bg-blue-500 text-white';
     }
   };
 
   return (
     <Card className="border-destructive/50 bg-destructive/5">
       <CardHeader className="pb-3">
         <CardTitle className="flex items-center justify-between text-lg">
           <div className="flex items-center gap-2">
             <AlertTriangle className="h-5 w-5 text-destructive" />
             Alertas de Inventario
           </div>
           <div className="flex gap-2">
             {criticalCount > 0 && (
               <Badge variant="destructive">{criticalCount} críticas</Badge>
             )}
             {warningCount > 0 && (
               <Badge className="bg-yellow-500">{warningCount} advertencias</Badge>
             )}
           </div>
         </CardTitle>
       </CardHeader>
       <CardContent className="pt-0">
         <ScrollArea className="h-48">
           <div className="space-y-2">
             {alerts.slice(0, 10).map((alert) => (
               <div 
                 key={alert.id}
                 className="flex items-center justify-between p-3 rounded-lg bg-background border"
               >
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${getPriorityColor(alert.priority)}`}>
                     {getIcon(alert.type)}
                   </div>
                   <div>
                     <p className="font-medium text-sm">{alert.title}</p>
                     <p className="text-xs text-muted-foreground">{alert.subtitle}</p>
                   </div>
                 </div>
                 {alert.action && (
                   <Button variant="ghost" size="sm" onClick={alert.action}>
                     {alert.actionLabel}
                     <ChevronRight className="h-4 w-4 ml-1" />
                   </Button>
                 )}
               </div>
             ))}
             {alerts.length > 10 && (
               <p className="text-center text-sm text-muted-foreground py-2">
                 +{alerts.length - 10} alertas más
               </p>
             )}
           </div>
         </ScrollArea>
       </CardContent>
     </Card>
   );
 };