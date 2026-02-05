 import { useState, useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { 
   Clock, 
   AlertTriangle, 
   XCircle, 
   Search, 
   Trash2,
   Package,
   Calendar,
   ArrowUpDown
 } from 'lucide-react';
 import { InventoryItemExtended, StorageLocation, InventoryWaste } from '@/hooks/useEnterpriseInventory';
 import { differenceInDays, format, addDays } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 interface Props {
   inventory: InventoryItemExtended[];
   locations: StorageLocation[];
   onRecordWaste: (data: Partial<InventoryWaste>) => Promise<any>;
 }
 
 type ViewMode = 'all' | 'expired' | 'expiring_3' | 'expiring_7' | 'expiring_30';
 type SortField = 'expiration' | 'name' | 'stock';
 
 export const ExpirationTracker = ({ inventory, locations, onRecordWaste }: Props) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [viewMode, setViewMode] = useState<ViewMode>('all');
   const [sortField, setSortField] = useState<SortField>('expiration');
   const [sortAsc, setSortAsc] = useState(true);
   const [locationFilter, setLocationFilter] = useState<string>('all');
 
   const now = new Date();
 
   const itemsWithExpiration = useMemo(() => {
     return inventory
       .filter(item => item.expiration_date)
       .map(item => {
         const expDate = new Date(item.expiration_date!);
         const daysUntil = differenceInDays(expDate, now);
         return {
           ...item,
           expDate,
           daysUntil,
           status: daysUntil < 0 ? 'expired' : daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'warning' : daysUntil <= 30 ? 'upcoming' : 'ok'
         };
       })
       .filter(item => {
         // Search filter
         if (searchTerm && !item.item_name.toLowerCase().includes(searchTerm.toLowerCase())) {
           return false;
         }
         // Location filter
         if (locationFilter !== 'all' && item.storage_location_id !== locationFilter) {
           return false;
         }
         // View mode filter
         switch (viewMode) {
           case 'expired': return item.daysUntil < 0;
           case 'expiring_3': return item.daysUntil >= 0 && item.daysUntil <= 3;
           case 'expiring_7': return item.daysUntil >= 0 && item.daysUntil <= 7;
           case 'expiring_30': return item.daysUntil >= 0 && item.daysUntil <= 30;
           default: return true;
         }
       })
       .sort((a, b) => {
         let comparison = 0;
         switch (sortField) {
           case 'expiration':
             comparison = a.daysUntil - b.daysUntil;
             break;
           case 'name':
             comparison = a.item_name.localeCompare(b.item_name);
             break;
           case 'stock':
             comparison = (a.current_stock * (a.unit_cost || 0)) - (b.current_stock * (b.unit_cost || 0));
             break;
         }
         return sortAsc ? comparison : -comparison;
       });
   }, [inventory, searchTerm, viewMode, locationFilter, sortField, sortAsc]);
 
   const stats = useMemo(() => {
     const withExp = inventory.filter(i => i.expiration_date);
     const expired = withExp.filter(i => differenceInDays(new Date(i.expiration_date!), now) < 0);
     const expiring3 = withExp.filter(i => {
       const d = differenceInDays(new Date(i.expiration_date!), now);
       return d >= 0 && d <= 3;
     });
     const expiring7 = withExp.filter(i => {
       const d = differenceInDays(new Date(i.expiration_date!), now);
       return d >= 0 && d <= 7;
     });
     return {
       total: withExp.length,
       expired: expired.length,
       expiredValue: expired.reduce((sum, i) => sum + (i.current_stock * (i.unit_cost || 0)), 0),
       expiring3: expiring3.length,
       expiring7: expiring7.length
     };
   }, [inventory]);
 
   const handleMarkAsWaste = async (item: InventoryItemExtended & { daysUntil: number }) => {
     if (!confirm(`¿Registrar ${item.current_stock} ${item.unit} de "${item.item_name}" como merma por vencimiento?`)) {
       return;
     }
     await onRecordWaste({
       inventory_item_id: item.id,
       quantity: item.current_stock,
       unit: item.unit,
       unit_cost: item.unit_cost || undefined,
       waste_reason: 'expiration',
       is_preventable: item.daysUntil >= 0,
       lot_number: item.lot_number || undefined,
       storage_location_id: item.storage_location_id || undefined,
       notes: `Vencimiento: ${item.expiration_date}`
     });
   };
 
   const getStatusBadge = (status: string, daysUntil: number) => {
     switch (status) {
       case 'expired':
         return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
       case 'critical':
         return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{daysUntil}d</Badge>;
       case 'warning':
         return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />{daysUntil}d</Badge>;
       case 'upcoming':
         return <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />{daysUntil}d</Badge>;
       default:
         return <Badge variant="outline">{daysUntil}d</Badge>;
     }
   };
 
   const toggleSort = (field: SortField) => {
     if (sortField === field) {
       setSortAsc(!sortAsc);
     } else {
       setSortField(field);
       setSortAsc(true);
     }
   };
 
   return (
     <div className="space-y-4">
       {/* Stats Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card 
           className={`cursor-pointer transition-all ${viewMode === 'expired' ? 'ring-2 ring-destructive' : ''}`}
           onClick={() => setViewMode(viewMode === 'expired' ? 'all' : 'expired')}
         >
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Vencidos</p>
                 <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
               </div>
               <XCircle className="h-8 w-8 text-destructive opacity-50" />
             </div>
             {stats.expiredValue > 0 && (
               <p className="text-xs text-destructive mt-1">
                 ${stats.expiredValue.toLocaleString()} en pérdidas
               </p>
             )}
           </CardContent>
         </Card>
 
         <Card 
           className={`cursor-pointer transition-all ${viewMode === 'expiring_3' ? 'ring-2 ring-destructive' : ''}`}
           onClick={() => setViewMode(viewMode === 'expiring_3' ? 'all' : 'expiring_3')}
         >
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Próximos 3 días</p>
                 <p className="text-2xl font-bold text-destructive">{stats.expiring3}</p>
               </div>
               <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
             </div>
           </CardContent>
         </Card>
 
         <Card 
           className={`cursor-pointer transition-all ${viewMode === 'expiring_7' ? 'ring-2 ring-yellow-500' : ''}`}
           onClick={() => setViewMode(viewMode === 'expiring_7' ? 'all' : 'expiring_7')}
         >
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Próximos 7 días</p>
                 <p className="text-2xl font-bold text-yellow-600">{stats.expiring7}</p>
               </div>
               <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
             </div>
           </CardContent>
         </Card>
 
         <Card 
           className={`cursor-pointer transition-all ${viewMode === 'all' ? 'ring-2 ring-primary' : ''}`}
           onClick={() => setViewMode('all')}
         >
           <CardContent className="pt-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Con Vencimiento</p>
                 <p className="text-2xl font-bold">{stats.total}</p>
               </div>
               <Package className="h-8 w-8 text-primary opacity-50" />
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Filters */}
       <div className="flex flex-wrap gap-3">
         <div className="relative flex-1 min-w-[200px]">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Buscar producto..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-9"
           />
         </div>
         <Select value={locationFilter} onValueChange={setLocationFilter}>
           <SelectTrigger className="w-48">
             <SelectValue placeholder="Ubicación" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Todas las ubicaciones</SelectItem>
             {locations.map(loc => (
               <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
 
       {/* Table */}
       {itemsWithExpiration.length === 0 ? (
         <Card>
           <CardContent className="py-12 text-center text-muted-foreground">
             <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
             <p>No hay productos con fecha de vencimiento en este filtro</p>
           </CardContent>
         </Card>
       ) : (
         <Card>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead 
                   className="cursor-pointer hover:bg-muted/50"
                   onClick={() => toggleSort('name')}
                 >
                   <div className="flex items-center gap-1">
                     Producto
                     {sortField === 'name' && <ArrowUpDown className="h-3 w-3" />}
                   </div>
                 </TableHead>
                 <TableHead>Ubicación</TableHead>
                 <TableHead>Lote</TableHead>
                 <TableHead 
                   className="cursor-pointer hover:bg-muted/50 text-right"
                   onClick={() => toggleSort('stock')}
                 >
                   <div className="flex items-center justify-end gap-1">
                     Stock / Valor
                     {sortField === 'stock' && <ArrowUpDown className="h-3 w-3" />}
                   </div>
                 </TableHead>
                 <TableHead 
                   className="cursor-pointer hover:bg-muted/50"
                   onClick={() => toggleSort('expiration')}
                 >
                   <div className="flex items-center gap-1">
                     Vencimiento
                     {sortField === 'expiration' && <ArrowUpDown className="h-3 w-3" />}
                   </div>
                 </TableHead>
                 <TableHead>Estado</TableHead>
                 <TableHead className="text-right">Acción</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {itemsWithExpiration.map((item) => (
                 <TableRow 
                   key={item.id} 
                   className={item.status === 'expired' ? 'bg-destructive/5' : item.status === 'critical' ? 'bg-destructive/5' : ''}
                 >
                   <TableCell>
                     <div>
                       <p className="font-medium">{item.item_name}</p>
                       <p className="text-xs text-muted-foreground">{item.category || 'Sin categoría'}</p>
                     </div>
                   </TableCell>
                   <TableCell>
                     {item.storage_location?.location_name || '-'}
                   </TableCell>
                   <TableCell>
                     <span className="font-mono text-sm">{item.lot_number || '-'}</span>
                   </TableCell>
                   <TableCell className="text-right">
                     <div>
                       <p>{item.current_stock} {item.unit}</p>
                       <p className="text-xs text-muted-foreground">
                         ${((item.current_stock * (item.unit_cost || 0))).toLocaleString()}
                       </p>
                     </div>
                   </TableCell>
                   <TableCell>
                     {format(item.expDate, 'dd MMM yyyy', { locale: es })}
                   </TableCell>
                   <TableCell>
                     {getStatusBadge(item.status, item.daysUntil)}
                   </TableCell>
                   <TableCell className="text-right">
                     {(item.status === 'expired' || item.status === 'critical') && (
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-destructive"
                         onClick={() => handleMarkAsWaste(item)}
                       >
                         <Trash2 className="h-4 w-4 mr-1" />
                         Merma
                       </Button>
                     )}
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </Card>
       )}
     </div>
   );
 };