import React, { useState } from 'react';
import { Plus, FolderTree, ListOrdered, Settings, Utensils, Package, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MenuEngineeringTab } from './MenuEngineeringTab';
import { MenuEditorHero } from './MenuEditorHero';
import { MenuEditorStats } from './MenuEditorStats';
import { MenuEditorFilters } from './MenuEditorFilters';
import { MenuModifiersTab } from './MenuModifiersTab';

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

  const filteredItems = (items || []).filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

    const matchesAvailability =
      filterAvailability === 'all' ||
      (filterAvailability === 'available' && item.is_available) ||
      (filterAvailability === 'unavailable' && !item.is_available);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const uniqueCategories = [...new Set((items || []).map((i) => i.category))];

  const itemsCountByCategory = (items || []).reduce((acc, item) => {
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
    if (editingItem) return updateItem(editingItem.id, data);
    return createItem(data);
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

  const tabTriggerClass =
    'flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg';

  return (
    <div className="space-y-6">
      <MenuEditorHero menu={menu} onBack={onBack} onCreateItem={handleOpenCreateItem} />

      <MenuEditorStats stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="items" className={tabTriggerClass}>
            <ListOrdered className="w-4 h-4" />
            Platillos
            <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
              {items.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="categories" className={tabTriggerClass}>
            <FolderTree className="w-4 h-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="modifiers" className={tabTriggerClass}>
            <Settings className="w-4 h-4" />
            Modificadores
          </TabsTrigger>
          <TabsTrigger value="engineering" className={tabTriggerClass}>
            <PieChart className="w-4 h-4" />
            Ingeniería
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <MenuEditorFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            filterAvailability={filterAvailability}
            onFilterAvailabilityChange={setFilterAvailability}
            uniqueCategories={uniqueCategories}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

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
                    : 'Intenta con otros filtros de búsqueda'}
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
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
                <div key={categoryName}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-lg">
                      {LEGACY_CATEGORIES.find(c => c.value === categoryName)?.label
                        || categoryName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

        <TabsContent value="modifiers">
          <MenuModifiersTab modifiers={modifiers} />
        </TabsContent>

        <TabsContent value="engineering" className="mt-4">
          <MenuEngineeringTab menuId={menuId} />
        </TabsContent>
      </Tabs>

      <MenuItemDialog
        open={showItemDialog}
        onOpenChange={setShowItemDialog}
        item={editingItem}
        categories={categories}
        allergens={allergens}
        recipes={recipes.map((r) => ({
          id: r.id,
          name: r.name,
          cost_per_portion: r.cost_per_portion,
        }))}
        onSave={handleSaveItem}
        onUploadImage={uploadItemImage}
      />

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
