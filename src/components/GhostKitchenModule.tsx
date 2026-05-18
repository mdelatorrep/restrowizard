import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useGhostKitchenData } from '@/hooks/useGhostKitchenData';
import { ModuleEmptyState } from '@/components/ui/empty-state';
import { useQueryClient } from '@tanstack/react-query';
import { ChefHat, Plus, Sparkles } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { NewBrandModal, NewBrandFormData } from './ghost-kitchen/NewBrandModal';
import { GhostKitchenKPIs } from './ghost-kitchen/GhostKitchenKPIs';
import { GhostKitchenDashboardTab } from './ghost-kitchen/GhostKitchenDashboardTab';
import { GhostKitchenBrandsTab } from './ghost-kitchen/GhostKitchenBrandsTab';
import { GhostKitchenProductionTab } from './ghost-kitchen/GhostKitchenProductionTab';
import { GhostKitchenAnalyticsTab } from './ghost-kitchen/GhostKitchenAnalyticsTab';
import type { DisplayBrand } from './ghost-kitchen/ghostKitchenHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const GhostKitchenModule = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const [formData, setFormData] = useState<NewBrandFormData>({ brand_name: '', cuisine_type: '', logo_emoji: '🍔' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    virtualBrands, aggregatorOrders, productionQueue, kpis, ordersByPlatform,
    hasData, isLoading, isViewingClient,
  } = useGhostKitchenData();

  const displayBrands: DisplayBrand[] = virtualBrands.map((b) => ({
    id: b.id,
    name: b.brand_name,
    logo: b.brand_logo || '🍴',
    status: b.is_active ? 'active' : 'paused',
    orders_today: aggregatorOrders.filter((o) => o.brand_id === b.id).length,
    revenue_today: aggregatorOrders.filter((o) => o.brand_id === b.id).reduce((sum, o) => sum + (o.subtotal || 0), 0),
    avg_prep_time: b.avg_preparation_time || 15,
    rating: 4.5,
    cuisine: b.cuisine_type || 'General',
  }));

  const handleCreateBrand = async () => {
    if (!user || !formData.brand_name) {
      toast({ title: 'Error', description: 'El nombre de la marca es obligatorio', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('virtual_brands').insert({
        user_id: user.id,
        brand_name: formData.brand_name,
        cuisine_type: (formData.cuisine_type as any) || 'other',
        brand_logo: formData.logo_emoji,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: 'Marca creada', description: 'Tu nueva marca virtual está lista' });
      setShowNewBrandForm(false);
      setFormData({ brand_name: '', cuisine_type: '', logo_emoji: '🍔' });
      queryClient.invalidateQueries({ queryKey: ['virtual-brands'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo crear la marca', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasData && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ChefHat className="h-7 w-7 text-primary" />
              Ghost Kitchen Manager
            </h2>
            <p className="text-muted-foreground mt-1">Gestiona múltiples marcas virtuales desde una sola cocina</p>
          </div>
        </div>
        <ModuleEmptyState
          moduleName="Ghost Kitchen"
          description="Crea marcas virtuales para operar múltiples conceptos desde tu cocina y conecta con agregadores de delivery."
          features={[
            'Gestión de múltiples marcas virtuales',
            'Dashboard unificado de todos los agregadores',
            'Cola de producción en tiempo real',
            'Análisis de comisiones y rentabilidad por plataforma',
          ]}
          onGetStarted={() => setShowNewBrandForm(true)}
        />
        <NewBrandModal
          open={showNewBrandForm}
          data={formData}
          onChange={setFormData}
          onCancel={() => setShowNewBrandForm(false)}
          onCreate={handleCreateBrand}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-primary" />
            Ghost Kitchen Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona múltiples marcas virtuales desde una sola cocina
            {isViewingClient && <Badge variant="outline" className="ml-2">Datos del cliente</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewBrandForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Marca
          </Button>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Optimizar Producción
          </Button>
        </div>
      </div>

      <GhostKitchenKPIs
        totalOrders={kpis.totalOrders}
        totalRevenue={kpis.totalRevenue}
        commissionPaid={kpis.commissionPaid}
        productionQueueLength={productionQueue.length}
        displayBrands={displayBrands}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="brands">Marcas</TabsTrigger>
          <TabsTrigger value="production">Producción</TabsTrigger>
          <TabsTrigger value="analytics">Analítica</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <GhostKitchenDashboardTab ordersByPlatform={ordersByPlatform} displayBrands={displayBrands} />
        </TabsContent>
        <TabsContent value="brands" className="space-y-4 mt-4">
          <GhostKitchenBrandsTab displayBrands={displayBrands} onNewBrand={() => setShowNewBrandForm(true)} />
        </TabsContent>
        <TabsContent value="production" className="space-y-4 mt-4">
          <GhostKitchenProductionTab productionQueue={productionQueue} />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <GhostKitchenAnalyticsTab displayBrands={displayBrands} commissionPaid={kpis.commissionPaid} totalRevenue={kpis.totalRevenue} />
        </TabsContent>
      </Tabs>

      <NewBrandModal
        open={showNewBrandForm}
        data={formData}
        onChange={setFormData}
        onCancel={() => setShowNewBrandForm(false)}
        onCreate={handleCreateBrand}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default GhostKitchenModule;
