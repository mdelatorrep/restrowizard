 import React from 'react';
 import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
 import { LucideIcon } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useIsMobile } from '@/hooks/use-mobile';
 
 interface TabItem {
   value: string;
   label: string;
   icon?: LucideIcon;
   badge?: string | number;
 }
 
 interface ResponsiveTabsProps {
   tabs: TabItem[];
   value: string;
   onValueChange: (value: string) => void;
   children: React.ReactNode;
   className?: string;
 }
 
 export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
   tabs,
   value,
   onValueChange,
   children,
   className
 }) => {
   const isMobile = useIsMobile();
 
   return (
     <Tabs value={value} onValueChange={onValueChange} className={className}>
       <div className="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto scrollbar-hide">
         <TabsList className="inline-flex w-auto min-w-full md:w-full h-auto p-1 bg-muted/50 rounded-lg">
           {tabs.map((tab) => (
             <TabsTrigger
               key={tab.value}
               value={tab.value}
               className={cn(
                 'flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap',
                 'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                 'transition-all duration-200'
               )}
             >
               {tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
               <span className={cn(isMobile && 'hidden sm:inline')}>{tab.label}</span>
               {tab.badge !== undefined && (
                 <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                   {tab.badge}
                 </span>
               )}
             </TabsTrigger>
           ))}
         </TabsList>
       </div>
       <div className="mt-4 md:mt-6">
         {children}
       </div>
     </Tabs>
   );
 };
 
 export { TabsContent };