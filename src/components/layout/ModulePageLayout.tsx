 import React from 'react';
 import { LucideIcon } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 
 interface ActionButton {
   label: string;
   icon?: LucideIcon;
   onClick: () => void;
   variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
   loading?: boolean;
   disabled?: boolean;
   className?: string;
 }
 
 interface PageHeaderProps {
   title: string;
   description?: string;
   subtitle?: string;
   icon?: LucideIcon;
   badge?: React.ReactNode;
   actions?: ActionButton[] | React.ReactNode;
   gradient?: boolean;
   children?: React.ReactNode;
 }
 
 export const PageHeader: React.FC<PageHeaderProps> = ({
   title,
   description,
   subtitle,
   icon: Icon,
   badge,
   actions,
   gradient = true,
   children
 }) => {
   const desc = description || subtitle;
   const isReactElement = actions && !Array.isArray(actions);
   const actionButtons = isReactElement ? null : (actions as ActionButton[] | undefined);
 
   if (gradient) {
     return (
       <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-6 md:p-8 text-primary-foreground">
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
         <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 blur-2xl pointer-events-none" />
         
         <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <div className="space-y-2">
             {badge && <div className="mb-2">{badge}</div>}
             <h1 className="text-2xl md:text-3xl lg:text-4xl font-headline font-bold flex items-center gap-3">
               {Icon && <Icon className="h-7 w-7 md:h-8 md:w-8 shrink-0" />}
               {title}
             </h1>
             {desc && (
               <p className="text-primary-foreground/80 text-sm md:text-base max-w-xl">
                 {desc}
               </p>
             )}
           </div>
           
           {isReactElement ? (
             <div className="flex flex-wrap gap-2">{actions}</div>
           ) : actionButtons && actionButtons.length > 0 && (
             <div className="flex flex-wrap gap-2">
               {actionButtons.map((action, index) => (
                 <Button
                   key={index}
                   variant={action.variant || 'secondary'}
                   onClick={action.onClick}
                   disabled={action.loading || action.disabled}
                   className={cn(
                     action.variant === 'default' || !action.variant
                       ? 'bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20'
                       : action.variant === 'outline'
                       ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                       : '',
                     action.className
                   )}
                 >
                   {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                   {action.loading ? 'Cargando...' : action.label}
                 </Button>
               ))}
             </div>
           )}
         </div>
         {children}
       </div>
     );
   }
 
   // Simple header without gradient
   return (
     <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
       <div>
         <h1 className="text-2xl md:text-3xl font-headline font-bold text-foreground flex items-center gap-3">
           {Icon && <Icon className="h-7 w-7 text-primary shrink-0" />}
           {title}
         </h1>
         {desc && (
           <p className="text-muted-foreground font-lato-light mt-1">{desc}</p>
         )}
       </div>
       
       {isReactElement ? (
         <div className="flex flex-wrap gap-2">{actions}</div>
       ) : actionButtons && actionButtons.length > 0 && (
         <div className="flex flex-wrap gap-2">
           {actionButtons.map((action, index) => (
             <Button
               key={index}
               variant={action.variant || 'default'}
               onClick={action.onClick}
               disabled={action.loading || action.disabled}
               className={action.className}
             >
               {action.icon && <action.icon className="h-4 w-4 mr-2" />}
               {action.loading ? 'Cargando...' : action.label}
             </Button>
           ))}
         </div>
       )}
     </div>
   );
 };
 
 interface ModulePageLayoutProps {
   children: React.ReactNode;
   className?: string;
 }
 
 export const ModulePageLayout: React.FC<ModulePageLayoutProps> = ({ 
   children, 
   className 
 }) => {
   return (
     <div className={cn('space-y-4 md:space-y-6', className)}>
       {children}
     </div>
   );
 };