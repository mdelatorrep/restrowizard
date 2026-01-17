import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit3, Save, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMenus, RestaurantMenu, MenuItem } from '@/hooks/useMenus';
import { useRecipes, RecipeWithIngredients } from '@/hooks/useRecipes';
import { useToast } from '@/hooks/use-toast';

interface MenuEditorProps {
  menuId: string;
  onBack: () => void;
}

export const MenuEditor: React.FC<MenuEditorProps> = ({ menuId, onBack }) => {
  const { menus, getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, updateMenu } = useMenus();
  const { recipes } = useRecipes();
  const { toast } = useToast();
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    dietary_tags: [] as string[],
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

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetariano' },
    { value: 'vegan', label: 'Vegano' },
    { value: 'gluten_free', label: 'Sin Gluten' },
  ];

  // Handle recipe selection to auto-fill item data
  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipe(recipeId);
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      // Map recipe category to menu category
      const categoryMap: Record<string, string> = {
        'entrada': 'appetizers',
        'plato_fuerte': 'main_courses',
        'postre': 'desserts',
        'bebida': 'beverages',
        'salsa': 'specials',
        'base': 'specials',
      };
      
      setNewItem({
        name: recipe.name,
        description: recipe.instructions?.substring(0, 150) || '',
        price: recipe.cost_per_portion ? (recipe.cost_per_portion * 3).toFixed(2) : '', // Suggest 3x cost markup
        category: categoryMap[recipe.category] || 'main_courses',
        dietary_tags: [],
      });
      
      toast({
        title: 'Receta seleccionada',
        description: `Costo por porción: $${recipe.cost_per_portion?.toFixed(2) || 0}. Precio sugerido: 3x costo.`,
      });
    }
  };

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

  const toggleDietaryTag = (tag: string) => {
    setNewItem(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }));
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
      price: newItem.price ? parseFloat(newItem.price) : 0,
      category: newItem.category,
      dietary_tags: newItem.dietary_tags,
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
        dietary_tags: [],
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
            {/* Recipe Selector */}
            {recipes.length > 0 && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-dashed">
                <Label className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-4 h-4" />
                  Crear desde Receta (opcional)
                </Label>
                <Select value={selectedRecipe} onValueChange={handleRecipeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una receta para autocompletar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        <span className="flex items-center gap-2">
                          {recipe.name}
                          <Badge variant="outline" className="text-xs">
                            ${recipe.cost_per_portion?.toFixed(2) || '0.00'}/porción
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Al seleccionar una receta, se calculará el precio sugerido (3x costo)
                </p>
              </div>
            )}

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
              {dietaryOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={newItem.dietary_tags.includes(option.value)}
                    onCheckedChange={() => toggleDietaryTag(option.value)}
                  />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
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
                          {item.dietary_tags?.includes('vegetarian') && <Badge variant="outline" className="text-xs">Vegetariano</Badge>}
                          {item.dietary_tags?.includes('vegan') && <Badge variant="outline" className="text-xs">Vegano</Badge>}
                          {item.dietary_tags?.includes('gluten_free') && <Badge variant="outline" className="text-xs">Sin Gluten</Badge>}
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
