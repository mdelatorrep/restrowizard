import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { MenuItemSchema } from '@/lib/schemas/menuItem';
import { MenuItemFormData } from './menuItemDialogTypes';
import { MenuItemBasicTab } from './MenuItemBasicTab';
import { MenuItemDetailsTab } from './MenuItemDetailsTab';
import { MenuItemAllergensTab } from './MenuItemAllergensTab';
import { MenuItemPricingTab } from './MenuItemPricingTab';

type MenuItem = Tables<'menu_items'>;
type MenuCategory = Tables<'menu_categories'>;
type MenuAllergen = Tables<'menu_allergens'>;

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  categories: MenuCategory[];
  allergens: MenuAllergen[];
  recipes?: Array<{ id: string; name: string; cost_per_portion: number | null }>;
  currencySymbol?: string;
  onSave: (data: Partial<TablesInsert<'menu_items'>>) => Promise<any>;
  onUploadImage?: (itemId: string, file: File) => Promise<string | null>;
}

export const MenuItemDialog: React.FC<MenuItemDialogProps> = ({
  open,
  onOpenChange,
  item,
  categories,
  allergens,
  recipes = [],
  currencySymbol = '$',
  onSave,
  onUploadImage,
}) => {
  const isEditing = !!item;
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(item?.image_url || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    category: item?.category || '',
    category_id: (item as any)?.category_id || '',
    dietary_tags: item?.dietary_tags || [],
    allergens: item?.allergens || [],
    is_available: item?.is_available ?? true,
    is_featured: item?.is_featured ?? false,
    is_new: (item as any)?.is_new ?? false,
    is_bestseller: (item as any)?.is_bestseller ?? false,
    preparation_time_minutes: (item as any)?.preparation_time_minutes?.toString() || '',
    calories: (item as any)?.calories?.toString() || '',
    spicy_level: (item as any)?.spicy_level || 0,
    cost: (item as any)?.cost?.toString() || '',
    recipe_id: (item as any)?.recipe_id || '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const handleRecipeSelect = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setFormData(prev => ({
        ...prev,
        recipe_id: recipeId,
        name: prev.name || recipe.name,
        cost: recipe.cost_per_portion?.toString() || prev.cost,
        price: prev.price || (recipe.cost_per_portion ? (recipe.cost_per_portion * 3).toFixed(2) : ''),
      }));
    }
  };

  const handleSave = async () => {
    const parsed = MenuItemSchema.safeParse({
      name: formData.name.trim(),
      description: formData.description || null,
      price: formData.price ? parseFloat(formData.price) : 0,
      category: formData.category,
      category_id: formData.category_id || null,
      dietary_tags: formData.dietary_tags,
      allergens: formData.allergens,
      is_available: formData.is_available,
      is_featured: formData.is_featured,
      is_new: formData.is_new,
      is_bestseller: formData.is_bestseller,
      preparation_time_minutes: formData.preparation_time_minutes ? parseInt(formData.preparation_time_minutes) : null,
      calories: formData.calories ? parseInt(formData.calories) : null,
      spicy_level: formData.spicy_level || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      recipe_id: formData.recipe_id || null,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }

    setSaving(true);
    try {
      const result = await onSave(parsed.data as Partial<TablesInsert<'menu_items'>>);
      if (result && selectedFile && onUploadImage) {
        await onUploadImage(result.id, selectedFile);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Platillo' : 'Nuevo Platillo'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">General</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="allergens">Alérgenos</TabsTrigger>
            <TabsTrigger value="pricing">Precios</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <MenuItemBasicTab
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              recipes={recipes}
              currencySymbol={currencySymbol}
              previewImage={previewImage}
              onImageSelect={handleImageSelect}
              onRemoveImage={handleRemoveImage}
              onRecipeSelect={handleRecipeSelect}
            />
          </TabsContent>

          <TabsContent value="details">
            <MenuItemDetailsTab formData={formData} setFormData={setFormData} />
          </TabsContent>

          <TabsContent value="allergens">
            <MenuItemAllergensTab formData={formData} setFormData={setFormData} allergens={allergens} />
          </TabsContent>

          <TabsContent value="pricing">
            <MenuItemPricingTab formData={formData} setFormData={setFormData} currencySymbol={currencySymbol} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.category || saving}
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Agregar Platillo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
