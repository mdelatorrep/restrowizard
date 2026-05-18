import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecipeMenuLink, Recipe, MenuItem } from '@/hooks/useRecipeMenuLink';
import { useMenus } from '@/hooks/useMenus';
import { Link2, PlusCircle, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LinkRecipeSchema, CreateMenuItemFromRecipeSchema } from '@/lib/schemas/publishRecipe';

interface PublishRecipeToMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe;
  onSuccess?: () => void;
}

export const PublishRecipeToMenuDialog: React.FC<PublishRecipeToMenuDialogProps> = ({
  open,
  onOpenChange,
  recipe,
  onSuccess
}) => {
  const { 
    getAvailableMenuItems, 
    linkRecipeToMenuItem, 
    createMenuItemFromRecipe 
  } = useRecipeMenuLink();
  const { menus } = useMenus();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [markupPercentage, setMarkupPercentage] = useState<number>(300);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const loadMenuItems = async () => {
      setLoadingItems(true);
      const items = await getAvailableMenuItems();
      setMenuItems(items);
      setLoadingItems(false);
    };
    if (open) {
      loadMenuItems();
    }
  }, [open, getAvailableMenuItems]);

  const suggestedPrice = recipe.cost_per_portion * (markupPercentage / 100);

  const handleLinkExisting = async () => {
    const parsed = LinkRecipeSchema.safeParse({ recipeId: recipe.id, menuItemId: selectedMenuItem });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    setLoading(true);
    const success = await linkRecipeToMenuItem(parsed.data.recipeId, parsed.data.menuItemId);
    setLoading(false);
    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleCreateNew = async () => {
    const parsed = CreateMenuItemFromRecipeSchema.safeParse({
      recipeId: recipe.id,
      menuId: selectedMenu,
      markupPercentage: Number(markupPercentage),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    setLoading(true);
    const newItemId = await createMenuItemFromRecipe(recipe, parsed.data.menuId, parsed.data.markupPercentage);
    setLoading(false);
    if (newItemId) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Publicar en Menú
          </DialogTitle>
          <DialogDescription>
            Vincula "{recipe.name}" a un producto del menú o crea uno nuevo
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{recipe.name}</p>
              <p className="text-sm text-muted-foreground">
                Costo por porción: ${recipe.cost_per_portion.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>

        <Tabs defaultValue="link">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="link">Vincular Existente</TabsTrigger>
            <TabsTrigger value="create">Crear Nuevo</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            {loadingItems ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No hay productos de menú disponibles</p>
                <p className="text-sm">Crea un menú primero o usa la pestaña "Crear Nuevo"</p>
              </div>
            ) : (
              <>
                <div>
                  <Label>Seleccionar Producto del Menú</Label>
                  <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige un producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{item.name}</span>
                            <Badge variant="outline" className="ml-2">
                              ${item.price}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleLinkExisting} 
                  disabled={!selectedMenuItem || loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Vincular Receta
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            {menus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No hay menús disponibles</p>
                <p className="text-sm">Crea un menú primero en la sección de Menús</p>
              </div>
            ) : (
              <>
                <div>
                  <Label>Menú de Destino</Label>
                  <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un menú..." />
                    </SelectTrigger>
                    <SelectContent>
                      {menus.map(menu => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Markup (% sobre costo)</Label>
                  <Input 
                    type="number"
                    value={markupPercentage}
                    onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                    min={100}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    300% = precio es 3x el costo (recomendado para restaurantes)
                  </p>
                </div>

                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="flex justify-between">
                    <span>Precio Sugerido:</span>
                    <span className="font-bold text-primary">
                      ${suggestedPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Margen:</span>
                    <span>{((markupPercentage - 100) / markupPercentage * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateNew} 
                  disabled={!selectedMenu || loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Crear Producto en Menú
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
