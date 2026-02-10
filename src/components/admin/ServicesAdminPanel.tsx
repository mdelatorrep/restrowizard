import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, FileText, MessageSquare, Star, Image } from 'lucide-react';
import ProvidersAdminPanel from './ProvidersAdminPanel';
import ServiceRequestsManager from './ServiceRequestsManager';
import ServiceProposalsManager from './ServiceProposalsManager';
import ServiceReviewsManager from './ServiceReviewsManager';
import ServicePortfolioManager from './ServicePortfolioManager';

const ServicesAdminPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="providers" className="flex items-center gap-2"><Store className="h-4 w-4" />Proveedores</TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2"><FileText className="h-4 w-4" />Solicitudes</TabsTrigger>
          <TabsTrigger value="proposals" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Propuestas</TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2"><Star className="h-4 w-4" />Reseñas</TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2"><Image className="h-4 w-4" />Portafolios</TabsTrigger>
        </TabsList>
        <TabsContent value="providers"><ProvidersAdminPanel /></TabsContent>
        <TabsContent value="requests"><ServiceRequestsManager /></TabsContent>
        <TabsContent value="proposals"><ServiceProposalsManager /></TabsContent>
        <TabsContent value="reviews"><ServiceReviewsManager /></TabsContent>
        <TabsContent value="portfolio"><ServicePortfolioManager /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ServicesAdminPanel;
