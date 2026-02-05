 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { 
   Settings, Link2, Image, Layout, Truck, Megaphone, 
   BarChart3, Palette, Eye 
 } from 'lucide-react';
 import { GeneralSettingsTab } from './tabs/GeneralSettingsTab';
 import { HeroSettingsTab } from './tabs/HeroSettingsTab';
 import { SectionsToggleTab } from './tabs/SectionsToggleTab';
 import { DeliverySettingsTab } from './tabs/DeliverySettingsTab';
 import { SEOAnalyticsTab } from './tabs/SEOAnalyticsTab';
 import { MarketingToolsTab } from './tabs/MarketingToolsTab';
 import { URLsTab } from './tabs/URLsTab';
 import { DesignCustomizationTab } from './tabs/DesignCustomizationTab';
 import type { RestaurantWebsite } from '@/hooks/useRestaurantWebsite';
 import type { Tables } from '@/integrations/supabase/types';
 
 interface WebsiteEditorTabsProps {
   website: RestaurantWebsite;
   formData: Partial<RestaurantWebsite>;
   updateField: <K extends keyof RestaurantWebsite>(field: K, value: RestaurantWebsite[K]) => void;
   businessHours: Record<string, { open: string; close: string; closed?: boolean }>;
   updateHours: (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => void;
   deliveryZones: any[];
   addDeliveryZone: () => Promise<void>;
   updateDeliveryZone: (id: string, updates: any) => Promise<void>;
   deleteDeliveryZone: (id: string) => Promise<void>;
   zonesLoading: boolean;
   menus: any[];
   brand: Tables<'restaurant_brands'> | null;
   onPreview: () => void;
 }
 
 export function WebsiteEditorTabs({
   website,
   formData,
   updateField,
   businessHours,
   updateHours,
   deliveryZones,
   addDeliveryZone,
   updateDeliveryZone,
   deleteDeliveryZone,
   zonesLoading,
   menus,
   brand,
   onPreview,
 }: WebsiteEditorTabsProps) {
   return (
     <Tabs defaultValue="general" className="space-y-6">
       <div className="overflow-x-auto pb-2 -mx-4 px-4">
         <TabsList className="inline-flex w-auto min-w-full md:w-full md:grid md:grid-cols-8 h-auto gap-1 p-1">
           <TabsTrigger value="general" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <Settings className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">General</span>
           </TabsTrigger>
           <TabsTrigger value="design" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <Palette className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">Diseño</span>
           </TabsTrigger>
           <TabsTrigger value="hero" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <Image className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">Hero</span>
           </TabsTrigger>
           <TabsTrigger value="sections" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <Layout className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">Secciones</span>
           </TabsTrigger>
           <TabsTrigger value="delivery" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <Truck className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">Delivery</span>
           </TabsTrigger>
           <TabsTrigger value="marketing" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <Megaphone className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">Marketing</span>
           </TabsTrigger>
           <TabsTrigger value="seo" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <BarChart3 className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">SEO</span>
           </TabsTrigger>
           <TabsTrigger value="urls" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
             <Link2 className="h-4 w-4 md:mr-1.5" />
             <span className="hidden md:inline">URLs</span>
           </TabsTrigger>
         </TabsList>
       </div>
 
       <TabsContent value="general">
         <GeneralSettingsTab
           formData={formData}
           updateField={updateField}
           businessHours={businessHours}
           updateHours={updateHours}
           brand={brand}
           websiteSlug={website.slug}
         />
       </TabsContent>
 
       <TabsContent value="design">
         <DesignCustomizationTab
           formData={formData}
           updateField={updateField}
           brand={brand}
         />
       </TabsContent>
 
       <TabsContent value="hero">
         <HeroSettingsTab
           formData={formData}
           updateField={updateField}
           brand={brand}
         />
       </TabsContent>
 
       <TabsContent value="sections">
         <SectionsToggleTab
           formData={formData}
           updateField={updateField}
         />
       </TabsContent>
 
       <TabsContent value="delivery">
         <DeliverySettingsTab
           formData={formData}
           updateField={updateField}
           deliveryZones={deliveryZones}
           addDeliveryZone={addDeliveryZone}
           updateDeliveryZone={updateDeliveryZone}
           deleteDeliveryZone={deleteDeliveryZone}
           zonesLoading={zonesLoading}
         />
       </TabsContent>
 
       <TabsContent value="marketing">
         <MarketingToolsTab
           formData={formData}
           updateField={updateField}
         />
       </TabsContent>
 
       <TabsContent value="seo">
         <SEOAnalyticsTab
           formData={formData}
           updateField={updateField}
           websiteSlug={website.slug}
         />
       </TabsContent>
 
       <TabsContent value="urls">
         <URLsTab
           website={website}
           formData={formData}
           menus={menus}
         />
       </TabsContent>
     </Tabs>
   );
 }