 import React from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import { cn } from '@/lib/utils';
 
 export interface KPICardData {
   label: string;
   value: string | number;
   icon: LucideIcon;
   iconColor?: string;
   change?: number;
   trend?: 'up' | 'down' | 'neutral';
   highlight?: boolean;
   highlightColor?: 'warning' | 'danger' | 'success' | 'info';
   subtext?: string;
 }
 
 interface KPICardProps extends KPICardData {
   className?: string;
 }
 
 export const KPICard: React.FC<KPICardProps> = ({
   label,
   value,
   icon: Icon,
   iconColor = 'text-primary',
   change,
   trend,
   highlight,
   highlightColor,
   subtext,
   className
 }) => {
   const highlightBorderClass = highlight 
     ? highlightColor === 'warning' ? 'border-warning ring-1 ring-warning/20'
     : highlightColor === 'danger' ? 'border-destructive ring-1 ring-destructive/20'
     : highlightColor === 'success' ? 'border-success ring-1 ring-success/20'
     : highlightColor === 'info' ? 'border-info ring-1 ring-info/20'
     : ''
     : '';
 
   const valueColorClass = 
     highlightColor === 'warning' ? 'text-warning'
     : highlightColor === 'danger' ? 'text-destructive'
     : highlightColor === 'success' ? 'text-success'
     : highlightColor === 'info' ? 'text-info'
     : '';
 
   return (
     <Card 
       className={cn(
         'group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-0 bg-gradient-to-br from-card to-muted/30',
         highlightBorderClass,
         className
       )}
     >
       <CardContent className="p-4 md:p-5">
         <div className="flex items-start justify-between gap-3">
           <div className="min-w-0 flex-1">
             <p className="text-xs md:text-sm text-muted-foreground truncate">{label}</p>
             <p className={cn(
               'text-xl md:text-2xl lg:text-3xl font-bold mt-1 truncate',
               valueColorClass
             )}>
               {value}
             </p>
             {subtext && (
               <p className="text-xs text-muted-foreground mt-1 truncate">{subtext}</p>
             )}
           </div>
           <div className="flex flex-col items-end gap-2 shrink-0">
             <div className={cn(
               'w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform',
               iconColor.includes('primary') ? 'from-primary/20 to-primary/10' :
               iconColor.includes('green') ? 'from-green-500/20 to-green-500/10' :
               iconColor.includes('red') ? 'from-red-500/20 to-red-500/10' :
               iconColor.includes('yellow') || iconColor.includes('warning') ? 'from-yellow-500/20 to-yellow-500/10' :
               iconColor.includes('orange') ? 'from-orange-500/20 to-orange-500/10' :
               iconColor.includes('blue') ? 'from-blue-500/20 to-blue-500/10' :
               iconColor.includes('purple') ? 'from-purple-500/20 to-purple-500/10' :
               'from-primary/20 to-primary/10'
             )}>
               <Icon className={cn('w-5 h-5 md:w-6 md:h-6', iconColor)} />
             </div>
             {change !== undefined && trend && (
               <Badge 
                 variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
                 className="text-xs gap-0.5"
               >
                 {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                 {Math.abs(change)}%
               </Badge>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 };
 
 interface KPIGridProps {
   kpis: KPICardData[];
   columns?: 2 | 3 | 4 | 5 | 6;
   className?: string;
 }
 
 export const KPIGrid: React.FC<KPIGridProps> = ({ 
   kpis, 
   columns = 4,
   className 
 }) => {
   const gridColsClass = 
     columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
     columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
     columns === 4 ? 'grid-cols-2 md:grid-cols-4' :
     columns === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
     columns === 6 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' :
     'grid-cols-2 md:grid-cols-4';
 
   return (
     <div className={cn('grid gap-3 md:gap-4', gridColsClass, className)}>
       {kpis.map((kpi, index) => (
         <KPICard key={index} {...kpi} />
       ))}
     </div>
   );
 };