import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Eye, Settings, FolderTree, ListOrdered, 
  LayoutGrid, Loader2, Search, Filter, CheckCircle, EyeOff,
  TrendingUp, Package, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{menu.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={menu.status === 'published' ? 'default' : 'secondary'}>
                {menu.status === 'published' ? 'Publicado' : 'Borrador'}
              </Badge>
              {menu.public_url_slug && menu.status === 'published' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`/menu/${menu.public_url_slug}`, '_blank')}
                  className="h-6 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver menú público
                </Button>
              )}
            </div>
          </div>
        </div>

        <Button onClick={handleOpenCreateItem}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Platillo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Platillos</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableItems}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agotados</p>
                <p className="text-2xl font-bold text-red-600">{stats.unavailableItems}</p>
              </div>
              <EyeOff className="w-8 h-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precio Promedio</p>
                <p className="text-2xl font-bold">${stats.avgPrice.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4" />
            Platillos
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="modifiers" className="flex items-center gap-2">
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
