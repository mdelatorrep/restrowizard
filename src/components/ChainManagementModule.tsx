import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useChainData } from '@/hooks/useChainData';
import { ModuleEmptyState } from '@/components/ui/empty-state';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  ClipboardCheck,
  ArrowRightLeft,
  Plus,
  Eye,
  BarChart3,
  Star,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const ChainManagementModule = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewChainForm, setShowNewChainForm] = useState(false);
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
  const [formData, setFormData] = useState({ chain_name: '', description: '' });
  const [locationFormData, setLocationFormData] = useState({ 
    location_name: '', address: '', city: '', manager_name: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    chains, 
    locations, 
    complianceChecklists, 
    inventoryTransfers, 
    summary,
    hasData, 
    isLoading,
    isViewingClient 
  } = useChainData();

  const handleCreateChain = async () => {
    if (!user || !formData.chain_name) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('restaurant_chains').insert({
        owner_id: user.id,
        chain_name: formData.chain_name,
        description: formData.description || null
      });
      if (error) throw error;
      toast({ title: "Cadena creada", description: "Tu nueva cadena está lista" });
      setShowNewChainForm(false);
      setFormData({ chain_name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['restaurant-chains'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!chains[0]?.id || !locationFormData.location_name) {
      toast({ title: "Error", description: "Nombre y cadena son obligatorios", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('chain_locations').insert({
        chain_id: chains[0].id,
        location_name: locationFormData.location_name,
        address: locationFormData.address,
        city: locationFormData.city,
        manager_name: locationFormData.manager_name || null
      });
      if (error) throw error;
      toast({ title: "Ubicación creada", description: "Nueva ubicación agregada" });
      setShowNewLocationForm(false);
      setLocationFormData({ location_name: '', address: '', city: '', manager_name: '' });
      queryClient.invalidateQueries({ queryKey: ['chain-locations'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty state
  if (!hasData && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Gestión de Cadenas
            </h2>
            <p className="text-muted-foreground mt-1">Administra múltiples ubicaciones de tu cadena</p>
          </div>
        </div>
        <ModuleEmptyState
          moduleName="Gestión de Cadenas"
          description="Administra múltiples ubicaciones, menús estandarizados, transferencias de inventario y cumplimiento."
          features={[
            "Dashboard consolidado de todas las ubicaciones",
            "Transferencias de inventario entre sucursales",
            "Checklists de cumplimiento y auditorías",
            "Métricas comparativas entre ubicaciones"
          ]}
          onGetStarted={() => setShowNewChainForm(true)}
        />
        {showNewChainForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader><CardTitle>Nueva Cadena</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Nombre *</Label><Input value={formData.chain_name} onChange={(e) => setFormData({ ...formData, chain_name: e.target.value })} placeholder="Mi Cadena" /></div>
                <div><Label>Descripción</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción opcional" /></div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNewChainForm(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={handleCreateChain} disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear'}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  const currentChain = chains[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              {currentChain?.chain_name || 'Mi Cadena'}
            </h2>
            <p className="text-muted-foreground">{summary.totalLocations} ubicaciones{isViewingClient && <Badge variant="outline" className="ml-2">Cliente</Badge>}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewLocationForm(true)}><Plus className="h-4 w-4 mr-2" />Nueva Ubicación</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Ubicaciones</p><p className="text-2xl font-bold">{summary.activeLocations}/{summary.totalLocations}</p></div><MapPin className="h-8 w-8 text-primary opacity-20" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Capacidad Total</p><p className="text-2xl font-bold">{summary.totalSeatingCapacity}</p></div><Users className="h-8 w-8 text-blue-500 opacity-20" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Transferencias</p><p className="text-2xl font-bold">{summary.pendingTransfers}</p></div><Package className="h-8 w-8 text-orange-500 opacity-20" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Checklists</p><p className="text-2xl font-bold">{complianceChecklists.length}</p></div><ClipboardCheck className="h-8 w-8 text-green-500 opacity-20" /></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Ubicaciones</CardTitle></CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay ubicaciones. Agrega tu primera ubicación.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {locations.map((loc) => (
                    <div key={loc.id} className="text-center p-4 rounded-lg border bg-card">
                      <p className="font-semibold">{loc.location_name}</p>
                      <Badge variant={loc.is_active ? 'default' : 'secondary'}>{loc.is_active ? 'Activa' : 'Inactiva'}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{loc.city}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />{location.location_name}</CardTitle>
                    <Badge variant={location.is_active ? 'default' : 'secondary'}>{location.is_active ? 'Activa' : 'Inactiva'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{location.address}, {location.city}</p>
                  {location.manager_name && <p className="text-sm">Gerente: {location.manager_name}</p>}
                  <Button variant="outline" className="w-full" size="sm"><Eye className="h-4 w-4 mr-2" />Ver Detalles</Button>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-muted/50" onClick={() => setShowNewLocationForm(true)}>
              <div className="text-center"><Plus className="h-12 w-12 mx-auto text-muted-foreground" /><p className="mt-2 font-medium">Nueva Ubicación</p></div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" />Transferencias</CardTitle></CardHeader>
            <CardContent>
              {inventoryTransfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay transferencias pendientes</div>
              ) : (
                <div className="space-y-3">
                  {inventoryTransfers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div><Badge variant={t.status === 'pending' ? 'secondary' : 'default'}>{t.status}</Badge></div>
                      <p className="font-bold">${(t.total_value || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showNewLocationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader><CardTitle>Nueva Ubicación</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nombre *</Label><Input value={locationFormData.location_name} onChange={(e) => setLocationFormData({ ...locationFormData, location_name: e.target.value })} /></div>
              <div><Label>Dirección</Label><Input value={locationFormData.address} onChange={(e) => setLocationFormData({ ...locationFormData, address: e.target.value })} /></div>
              <div><Label>Ciudad</Label><Input value={locationFormData.city} onChange={(e) => setLocationFormData({ ...locationFormData, city: e.target.value })} /></div>
              <div><Label>Gerente</Label><Input value={locationFormData.manager_name} onChange={(e) => setLocationFormData({ ...locationFormData, manager_name: e.target.value })} /></div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewLocationForm(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleCreateLocation} disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChainManagementModule;
