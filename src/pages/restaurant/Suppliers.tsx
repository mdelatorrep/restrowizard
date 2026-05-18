import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Truck, Plus, Brain } from 'lucide-react';
import { useEnterpriseInventory, InventorySupplier } from '@/hooks/useEnterpriseInventory';
import { useAIAgent } from '@/hooks/useAIAgent';
import { SupplierFormDialog, type SupplierFormData } from '@/components/suppliers/SupplierFormDialog';
import { SuppliersKPIBar } from '@/components/suppliers/SuppliersKPIBar';
import { SuppliersFilterBar } from '@/components/suppliers/SuppliersFilterBar';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { getSupplierCategory } from '@/components/suppliers/supplierCategories';

const INITIAL_FORM: SupplierFormData = {
  supplier_name: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  category: '',
  payment_terms: '',
  minimum_order: 0,
  delivery_days: '',
  lead_time_days: 1,
  rating: 0,
  is_active: true,
  notes: '',
};

export default function RestaurantSuppliers() {
  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = useEnterpriseInventory();
  const { analyzeSuppliers, loading: aiLoading } = useAIAgent();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<InventorySupplier | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>(INITIAL_FORM);

  const resetForm = () => setFormData(INITIAL_FORM);

  const handleEdit = (supplier: InventorySupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      category: getSupplierCategory(supplier),
      payment_terms: supplier.payment_terms || '',
      minimum_order: supplier.minimum_order || 0,
      delivery_days: supplier.delivery_days || '',
      lead_time_days: supplier.lead_time_days,
      rating: supplier.rating || 0,
      is_active: supplier.is_active,
      notes: supplier.notes || '',
    });
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingSupplier(null);
    resetForm();
  };

  const handleSubmit = async () => {
    const data = {
      supplier_name: formData.supplier_name,
      contact_name: formData.contact_name || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      city: formData.city || null,
      payment_terms: formData.payment_terms || null,
      minimum_order: formData.minimum_order || null,
      delivery_days: formData.delivery_days || null,
      lead_time_days: formData.lead_time_days || 1,
      rating: formData.rating || null,
      is_active: formData.is_active,
      notes: formData.notes ? `[${formData.category}] ${formData.notes}` : formData.category || null,
    };
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data);
    } else {
      await createSupplier(data);
    }
    closeDialog();
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || getSupplierCategory(s) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const avgLeadTime = suppliers.reduce((acc, s) => acc + (s.lead_time_days || 0), 0) / (totalSuppliers || 1);
  const categories = [...new Set(suppliers.map(s => getSupplierCategory(s)))];

  const handleAIAnalysis = async () => {
    if (suppliers.length === 0) return;
    const result = await analyzeSuppliers({
      proveedores: suppliers.map(s => ({
        nombre: s.supplier_name,
        categoria: getSupplierCategory(s),
        terminos_pago: s.payment_terms,
        tiempo_entrega_dias: s.lead_time_days,
        activo: s.is_active,
        calificacion: s.rating,
      })),
      total_proveedores: totalSuppliers,
      tiempo_entrega_promedio: avgLeadTime,
      categorias: categories,
    });
    if (result) {
      setAiInsights(result);
      setShowAIPanel(true);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="h-24 animate-pulse bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Proveedores
          </h1>
          <p className="text-muted-foreground">Gestiona tu red de proveedores</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Proveedor
        </Button>
      </div>

      <SupplierFormDialog
        open={showAddDialog || !!editingSupplier}
        editing={!!editingSupplier}
        value={formData}
        onChange={setFormData}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <SuppliersKPIBar
        total={totalSuppliers}
        active={activeSuppliers}
        categoriesCount={categories.length}
        avgLeadTime={avgLeadTime}
        aiLoading={aiLoading}
        hasInsights={!!aiInsights}
        onAIAnalysis={handleAIAnalysis}
      />

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

      <SuppliersFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      {filteredSuppliers.length === 0 ? (
        <EmptyState
          title="Sin proveedores"
          description={suppliers.length === 0
            ? 'Agrega tu primer proveedor para gestionar tu cadena de suministros'
            : 'No se encontraron proveedores con esos filtros'}
          actionLabel={suppliers.length === 0 ? 'Agregar Proveedor' : undefined}
          onAction={suppliers.length === 0 ? () => setShowAddDialog(true) : undefined}
        />
      ) : (
        <SuppliersTable
          suppliers={filteredSuppliers}
          onEdit={handleEdit}
          onDelete={deleteSupplier}
        />
      )}
    </div>
  );
}
