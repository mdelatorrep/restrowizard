 import React from 'react';
 import { Badge } from '@/components/ui/badge';
 import { LucideIcon } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface QuickStatItem {
   icon?: LucideIcon;
   label: string;
   value?: string | number;
   variant?: 'default' | 'warning' | 'danger' | 'success';
 }
 
 interface QuickStatsProps {
   items: QuickStatItem[];
   className?: string;
 }
 
 export const QuickStats: React.FC<QuickStatsProps> = ({ items, className }) => {
   return (
     <div className={cn('flex flex-wrap gap-2', className)}>
       {items.map((item, index) => {
         const colorClass = 
           item.variant === 'warning' ? 'text-warning border-warning/30 bg-warning/5' :
           item.variant === 'danger' ? 'text-destructive border-destructive/30 bg-destructive/5' :
           item.variant === 'success' ? 'text-success border-success/30 bg-success/5' :
           '';
 
         return (
           <Badge 
             key={index} 
             variant="outline" 
             className={cn('gap-1.5 py-1 px-2.5 text-xs font-medium', colorClass)}
           >
             {item.icon && <item.icon className="h-3 w-3" />}
             {item.value !== undefined && <span className="font-bold">{item.value}</span>}
             <span>{item.label}</span>
           </Badge>
         );
       })}
     </div>
   );
 };