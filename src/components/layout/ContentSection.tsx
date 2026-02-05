 import React from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { LucideIcon } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface ContentSectionProps {
   title?: string;
   description?: string;
   icon?: LucideIcon;
   action?: React.ReactNode;
   children: React.ReactNode;
   className?: string;
   noPadding?: boolean;
   asCard?: boolean;
 }
 
 export const ContentSection: React.FC<ContentSectionProps> = ({
   title,
   description,
   icon: Icon,
   action,
   children,
   className,
   noPadding = false,
   asCard = true
 }) => {
   if (!asCard) {
     return (
       <div className={className}>
         {(title || action) && (
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
             {title && (
               <div className="flex items-center gap-2">
                 {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
                 <div>
                   <h3 className="text-lg font-headline font-semibold">{title}</h3>
                   {description && (
                     <p className="text-sm text-muted-foreground">{description}</p>
                   )}
                 </div>
               </div>
             )}
             {action}
           </div>
         )}
         {children}
       </div>
     );
   }
 
   return (
     <Card className={cn('border-0 shadow-sm', className)}>
       {(title || action) && (
         <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
           <div className="flex items-center gap-2">
             {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
             <div>
               <CardTitle className="text-base md:text-lg">{title}</CardTitle>
               {description && (
                 <CardDescription className="text-sm">{description}</CardDescription>
               )}
             </div>
           </div>
           {action}
         </CardHeader>
       )}
       <CardContent className={cn(noPadding && 'p-0', !title && !action && 'pt-6')}>
         {children}
       </CardContent>
     </Card>
   );
 };
 
 interface EmptyStateProps {
   icon: LucideIcon;
   title: string;
   description: string;
   action?: React.ReactNode;
   className?: string;
 }
 
 export const EmptyState: React.FC<EmptyStateProps> = ({
   icon: Icon,
   title,
   description,
   action,
   className
 }) => {
   return (
     <Card className={cn('border-2 border-dashed border-primary/20 bg-gradient-to-br from-card via-card to-muted/20', className)}>
       <CardContent className="flex flex-col items-center justify-center py-12 md:py-20 px-4 text-center">
         <div className="relative mb-6">
           <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
             <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
           </div>
         </div>
         <h3 className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
           {title}
         </h3>
         <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8 max-w-md">
           {description}
         </p>
         {action}
       </CardContent>
     </Card>
   );
 };