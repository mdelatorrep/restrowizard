import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Eye, Settings, FolderTree, ListOrdered, 
  LayoutGrid, Loader2, Search, Filter, CheckCircle, EyeOff,
  TrendingUp, Package, DollarSign, Sparkles, Utensils, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMenuManagement, MenuItem } from '@/hooks/useMenuManagement';
import { useRecipes } from '@/hooks/useRecipes';
import { MenuItemCard } from './MenuItemCard';
import { MenuItemDialog } from './MenuItemDialog';
import { MenuCategoriesManager } from './MenuCategoriesManager';

interface MenuEditorProps {
  menuId: string;
  onBack: () => void;
}

type ViewMode = 'grid' | 'list';

export const MenuEditor: React.FC<MenuEditorProps> = ({ menuId, onBack }) => {
  const {
    menu,
    categories,
    items,
    modifiers,
    allergens,
    loading,
    stats,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    createItem,
    updateItem,
    deleteItem,
    toggleItemAvailability,
    uploadItemImage,
    getItemsByCategory,
  } = useMenuManagement(menuId);

  const { recipes } = useRecipes();

  const [activeTab, setActiveTab] = useState('items');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    const matchesAvailability = filterAvailability === 'all' || 
      (filterAvailability === 'available' && item.is_available) ||
      (filterAvailability === 'unavailable' && !item.is_available);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Get unique categories from items
  const uniqueCategories = [...new Set(items.map(i => i.category))];

  // Items count per category for category manager
  const itemsCountByCategory = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setShowItemDialog(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setShowItemDialog(true);
  };

  const handleSaveItem = async (data: any) => {
    if (editingItem) {
      return updateItem(editingItem.id, data);
    } else {
      return createItem(data);
    }
  };

  const handleDeleteItem = async () => {
    if (deleteItemId) {
      await deleteItem(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    await updateItem(id, { is_featured: featured });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Utensils className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Menú no encontrado</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary p-6 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={onBack} 
              variant="ghost" 
              size="icon"
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${menu.status === 'published' 
                  ? 'bg-green-500/20 text-green-100 border-green-400/30' 
                  : 'bg-amber-500/20 text-amber-100 border-amber-400/30'
                } border`}>
                  {menu.status === 'published' ? '✓ Publicado' : '◯ Borrador'}
                </Badge>
                {menu.public_url_slug && menu.status === 'published' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/menu/${menu.public_url_slug}`, '_blank')}
                    className="h-6 text-xs text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ver público
                  </Button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{menu.name}</h1>
            </div>
          </div>

          <Button 
            onClick={handleOpenCreateItem}
            className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20 group"
          >
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            Nuevo Platillo
            <Sparkles className="w-4 h-4 ml-2 opacity-50" />
          </Button>
        </div>
        
        <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30 overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Platillos</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{stats.totalItems}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30 overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Disponibles</p>
                <p className="text-3xl font-bold text-green-600">{stats.availableItems}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30 overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Agotados</p>
                <p className="text-3xl font-bold text-red-600">{stats.unavailableItems}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <EyeOff className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30 overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio Prom.</p>
                <p className="text-3xl font-bold text-purple-600">${stats.avgPrice.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger 
            value="items" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <ListOrdered className="w-4 h-4" />
            Platillos
            <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{items.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <FolderTree className="w-4 h-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger 
            value="modifiers" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Settings className="w-4 h-4" />
            Modificadores
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar platillos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {uniqueCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="available">Disponibles</SelectItem>
                      <SelectItem value="unavailable">Agotados</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="hidden sm:flex border rounded-lg">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className="rounded-r-none"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="rounded-l-none"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {items.length === 0 ? 'No hay platillos en este menú' : 'No se encontraron resultados'}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {items.length === 0 
                    ? 'Comienza agregando tu primer platillo al menú'
                    : 'Intenta con otros filtros de búsqueda'
                  }
                </p>
                {items.length === 0 && (
                  <Button onClick={handleOpenCreateItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Platillo
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'list' ? (
            // List view grouped by category
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
                <div key={categoryName}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-lg capitalize">
                      {categoryName.replace('_', ' ')}
                    </h3>
                    <Badge variant="secondary">{categoryItems.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onEdit={handleEditItem}
                        onDelete={(id) => setDeleteItemId(id)}
                        onToggleAvailability={toggleItemAvailability}
                        onToggleFeatured={handleToggleFeatured}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Grid view
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={(id) => setDeleteItemId(id)}
                  onToggleAvailability={toggleItemAvailability}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <MenuCategoriesManager
            categories={categories}
            itemsCount={itemsCountByCategory}
            onCreateCategory={createCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onReorderCategories={reorderCategories}
          />
        </TabsContent>

        {/* Modifiers Tab */}
        <TabsContent value="modifiers">
          <Card>
            <CardHeader>
              <CardTitle>Modificadores y Extras</CardTitle>
              <CardDescription>
                Configura opciones adicionales como acompañamientos, tamaños, 
                ingredientes extra, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modifiers.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No hay modificadores configurados aún.
                  </p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Modificador
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {modifiers.map(modifier => (
                    <Card key={modifier.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{modifier.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {modifier.type === 'single' ? 'Selección única' : 
                               modifier.type === 'multiple' ? 'Selección múltiple' : 'Requerido'}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {modifier.options.length} opciones
                          </Badge>
                        </div>
                        {modifier.options.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {modifier.options.map(option => (
                              <Badge key={option.id} variant="outline">
                                {option.name}
                                {option.price_adjustment > 0 && (
                                  <span className="ml-1 text-green-600">
                                    +${Number(option.price_adjustment).toFixed(2)}
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Dialog */}
      <MenuItemDialog
        open={showItemDialog}
        onOpenChange={setShowItemDialog}
        item={editingItem}
        categories={categories}
        allergens={allergens}
        recipes={recipes.map(r => ({ 
          id: r.id, 
          name: r.name, 
          cost_per_portion: r.cost_per_portion 
        }))}
        onSave={handleSaveItem}
        onUploadImage={uploadItemImage}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar platillo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El platillo será eliminado permanentemente del menú.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
