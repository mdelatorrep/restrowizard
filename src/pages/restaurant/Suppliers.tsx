import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { AIInsightsPanel, AIAnalyzeButton } from '@/components/AIInsightsPanel';
import { 
  Truck, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  AlertTriangle,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Filter,
  Sparkles,
  Brain,
  Handshake
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAIAgent } from '@/hooks/useAIAgent';

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string;
  payment_terms: string | null;
  lead_time_days: number | null;
  rating: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const SUPPLIER_CATEGORIES = [
  'Carnes y Proteínas',
  'Frutas y Verduras',
  'Lácteos',
  'Pescados y Mariscos',
  'Bebidas',
  'Abarrotes',
  'Panadería',
  'Equipamiento',
  'Limpieza',
  'Empaques',
  'Otros'
];

export default function RestaurantSuppliers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { analyzeSuppliers, getSupplierNegotiationTips, loading: aiLoading } = useAIAgent();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    payment_terms: '',
    lead_time_days: '',
    notes: ''
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!user,
  });

  // Create supplier
  const createSupplier = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('suppliers')
        .insert({
          user_id: user!.id,
          name: data.name,
          contact_name: data.contact_name || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          category: data.category,
          payment_terms: data.payment_terms || null,
          lead_time_days: data.lead_time_days ? parseInt(data.lead_time_days) : null,
          notes: data.notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Proveedor creado', description: 'El proveedor se agregó correctamente' });
      resetForm();
      setShowAddDialog(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo crear el proveedor', variant: 'destructive' });
    }
  });

  // Update supplier
  const updateSupplier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: data.name,
          contact_name: data.contact_name || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          category: data.category,
          payment_terms: data.payment_terms || null,
          lead_time_days: data.lead_time_days ? parseInt(data.lead_time_days) : null,
          notes: data.notes || null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Proveedor actualizado' });
      resetForm();
      setEditingSupplier(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  });

  // Delete supplier
  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Proveedor eliminado' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      payment_terms: '',
      lead_time_days: '',
      notes: ''
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      category: supplier.category,
      payment_terms: supplier.payment_terms || '',
      lead_time_days: supplier.lead_time_days?.toString() || '',
      notes: supplier.notes || ''
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast({ title: 'Error', description: 'Nombre y categoría son requeridos', variant: 'destructive' });
      return;
    }

    if (editingSupplier) {
      updateSupplier.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createSupplier.mutate(formData);
    }
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // KPIs
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const avgLeadTime = suppliers.reduce((acc, s) => acc + (s.lead_time_days || 0), 0) / (totalSuppliers || 1);
  const categories = [...new Set(suppliers.map(s => s.category))];

  // AI Analysis handler
  const handleAIAnalysis = async () => {
    if (suppliers.length === 0) {
      toast({ 
        title: "Sin datos", 
        description: "Agrega proveedores para poder analizarlos", 
        variant: "destructive" 
      });
      return;
    }
    
    const supplierData = suppliers.map(s => ({
      nombre: s.name,
      categoria: s.category,
      terminos_pago: s.payment_terms,
      tiempo_entrega_dias: s.lead_time_days,
      activo: s.is_active
    }));

    const result = await analyzeSuppliers({
      proveedores: supplierData,
      total_proveedores: totalSuppliers,
      tiempo_entrega_promedio: avgLeadTime,
      categorias: categories
    });
    
    if (result) {
      setAiInsights(result);
      setShowAIPanel(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Proveedores
          </h1>
          <p className="text-muted-foreground">Gestiona tu red de proveedores</p>
        </div>
        <Dialog open={showAddDialog || !!editingSupplier} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingSupplier(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
              <DialogDescription>
                {editingSupplier ? 'Actualiza la información del proveedor' : 'Agrega un nuevo proveedor a tu red'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Empresa *</Label>
                  <Input 
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="Distribuidora ABC"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contacto</Label>
                  <Input 
                    value={formData.contact_name}
                    onChange={e => setFormData(f => ({ ...f, contact_name: e.target.value }))}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input 
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  placeholder="ventas@proveedor.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input 
                  value={formData.address}
                  onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                  placeholder="Calle 123 #45-67"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Términos de Pago</Label>
                  <Select value={formData.payment_terms} onValueChange={v => setFormData(f => ({ ...f, payment_terms: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contado">Contado</SelectItem>
                      <SelectItem value="8_dias">8 días</SelectItem>
                      <SelectItem value="15_dias">15 días</SelectItem>
                      <SelectItem value="30_dias">30 días</SelectItem>
                      <SelectItem value="45_dias">45 días</SelectItem>
                      <SelectItem value="60_dias">60 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tiempo de Entrega (días)</Label>
                  <Input 
                    type="number"
                    value={formData.lead_time_days}
                    onChange={e => setFormData(f => ({ ...f, lead_time_days: e.target.value }))}
                    placeholder="2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea 
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Información adicional..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingSupplier(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingSupplier ? 'Actualizar' : 'Crear Proveedor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proveedores</p>
                <p className="text-2xl font-bold">{totalSuppliers}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Truck className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{activeSuppliers} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categorías</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="p-3 rounded-full bg-info/10">
                <Package className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">tipos de insumos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Entrega Prom.</p>
                <p className="text-2xl font-bold">{avgLeadTime.toFixed(1)} días</p>
              </div>
              <div className="p-3 rounded-full bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={handleAIAnalysis}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Análisis IA</p>
                <p className="text-lg font-bold text-primary">
                  {aiLoading ? 'Analizando...' : 'Analizar'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {aiInsights ? 'Ver insights' : 'Comparar y optimizar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      {showAIPanel && (
        <AIInsightsPanel
          title="Análisis de Proveedores"
          description="Evaluación comparativa y oportunidades de mejora"
          insights={aiInsights}
          loading={aiLoading}
          onAnalyze={handleAIAnalysis}
          onClose={() => setShowAIPanel(false)}
          icon={<Brain className="w-5 h-5 text-primary" />}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {SUPPLIER_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Table */}
      {filteredSuppliers.length === 0 ? (
        <EmptyState
          title="Sin proveedores"
          description={suppliers.length === 0 
            ? "Agrega tu primer proveedor para gestionar tu cadena de suministros"
            : "No se encontraron proveedores con esos filtros"
          }
          actionLabel={suppliers.length === 0 ? "Agregar Proveedor" : undefined}
          onAction={suppliers.length === 0 ? () => setShowAddDialog(true) : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Términos</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {supplier.address}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{supplier.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.contact_name && (
                          <p className="text-sm">{supplier.contact_name}</p>
                        )}
                        {supplier.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {supplier.phone}
                          </p>
                        )}
                        {supplier.email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {supplier.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.payment_terms ? (
                        <Badge variant="outline">{supplier.payment_terms.replace('_', ' ')}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.lead_time_days ? (
                        <span>{supplier.lead_time_days} días</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteSupplier.mutate(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
