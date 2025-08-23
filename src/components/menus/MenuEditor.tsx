import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit3, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMenus, RestaurantMenu, MenuItem } from '@/hooks/useMenus';
import { useToast } from '@/hooks/use-toast';

interface MenuEditorProps {
  menuId: string;
  onBack: () => void;
}

export const MenuEditor: React.FC<MenuEditorProps> = ({ menuId, onBack }) => {
  const { menus, getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, updateMenu } = useMenus();
  const { toast } = useToast();
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
  });

  const categories = [
    { value: 'appetizers', label: 'Aperitivos' },
    { value: 'salads', label: 'Ensaladas' },
    { value: 'soups', label: 'Sopas' },
    { value: 'main_courses', label: 'Platos Principales' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'seafood', label: 'Mariscos' },
    { value: 'meat', label: 'Carnes' },
    { value: 'poultry', label: 'Aves' },
    { value: 'vegetarian', label: 'Vegetariano' },
    { value: 'desserts', label: 'Postres' },
    { value: 'beverages', label: 'Bebidas' },
    { value: 'wine', label: 'Vinos' },
    { value: 'cocktails', label: 'Cóckteles' },
    { value: 'kids', label: 'Niños' },
    { value: 'specials', label: 'Especiales' }
  ];

  useEffect(() => {
    const currentMenu = menus.find(m => m.id === menuId);
    if (currentMenu) {
      setMenu(currentMenu);
      loadItems();
    }
  }, [menuId, menus]);

  const loadItems = async () => {
    const menuItems = await getMenuItems(menuId);
    setItems(menuItems);
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category) {
      toast({
        title: 'Error',
        description: 'Nombre y categoría son requeridos',
        variant: 'destructive',
      });
      return;
    }

    const itemData = {
      name: newItem.name,
      description: newItem.description,
      price: newItem.price ? parseFloat(newItem.price) : undefined,
      category: newItem.category as any,
      is_vegetarian: newItem.is_vegetarian,
      is_vegan: newItem.is_vegan,
      is_gluten_free: newItem.is_gluten_free,
      sort_order: items.length,
    };

    const result = await addMenuItem(menuId, itemData);
    if (result) {
      await loadItems();
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: '',
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const success = await deleteMenuItem(itemId);
    if (success) {
      await loadItems();
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (!menu) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-medium mx-auto mb-4"></div>
          <p>Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-lato-bold text-slate-dark">
              Editando: {menu.name}
            </h1>
            <p className="text-slate-medium">
              Gestiona los elementos de tu menú
            </p>
          </div>
        </div>

        {/* Add New Item Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Agregar Nuevo Elemento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del plato"
                />
              </div>
              <div>
                <Label>Precio (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="12.50"
                />
              </div>
              <div>
                <Label>Categoría *</Label>
                <Select 
                  value={newItem.category} 
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <Label>Descripción</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del plato..."
                rows={2}
              />
            </div>
            <div className="mt-4 flex space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vegetarian"
                  checked={newItem.is_vegetarian}
                  onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, is_vegetarian: !!checked }))}
                />
                <Label htmlFor="vegetarian">Vegetariano</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vegan"
                  checked={newItem.is_vegan}
                  onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, is_vegan: !!checked }))}
                />
                <Label htmlFor="vegan">Vegano</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gluten_free"
                  checked={newItem.is_gluten_free}
                  onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, is_gluten_free: !!checked }))}
                />
                <Label htmlFor="gluten_free">Sin Gluten</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items by Category */}
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([categoryKey, categoryItems]) => (
            <Card key={categoryKey}>
              <CardHeader>
                <CardTitle className="text-xl font-lato-bold">
                  {categories.find(c => c.value === categoryKey)?.label || categoryKey}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-lato-bold">{item.name}</h3>
                          {item.price && (
                            <span className="text-purple-medium font-bold">
                              €{item.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-slate-medium text-sm mb-2">{item.description}</p>
                        )}
                        <div className="flex space-x-2">
                          {item.is_vegetarian && <Badge variant="outline" className="text-xs">Vegetariano</Badge>}
                          {item.is_vegan && <Badge variant="outline" className="text-xs">Vegano</Badge>}
                          {item.is_gluten_free && <Badge variant="outline" className="text-xs">Sin Gluten</Badge>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-purple-medium" />
              </div>
              <h3 className="text-lg font-lato-bold text-slate-dark mb-2">
                No hay elementos en el menú
              </h3>
              <p className="text-slate-medium">
                Comienza agregando elementos a tu menú usando el formulario de arriba
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};