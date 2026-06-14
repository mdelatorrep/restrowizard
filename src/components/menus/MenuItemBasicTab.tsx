import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon, ChefHat, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Tables } from '@/integrations/supabase/types';
import { MenuItemFormData, LEGACY_CATEGORIES } from './menuItemDialogTypes';

type MenuCategory = Tables<'menu_categories'>;

interface Props {
  formData: MenuItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<MenuItemFormData>>;
  categories: MenuCategory[];
  recipes: Array<{ id: string; name: string; cost_per_portion: number | null }>;
  currencySymbol: string;
  previewImage: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onRecipeSelect: (recipeId: string) => void;
}

export const MenuItemBasicTab: React.FC<Props> = ({
  formData, setFormData, categories, recipes, currencySymbol,
  previewImage, onImageSelect, onRemoveImage, onRecipeSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label>Foto del platillo</Label>
        <div className="mt-2 flex gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
              previewImage ? 'border-transparent' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            {previewImage ? (
              <>
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveImage(); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Subir foto</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageSelect} />
          <div className="flex-1 space-y-2">
            <p className="text-xs text-muted-foreground">
              Formatos: JPG, PNG, WebP<br />
              Tamaño recomendado: 800x600px
            </p>
            {!previewImage && (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Seleccionar imagen
              </Button>
            )}
          </div>
        </div>
      </div>

      {recipes.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
          <Label className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Vincular con Receta (opcional)
          </Label>
          <Select value={formData.recipe_id || undefined} onValueChange={onRecipeSelect}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Selecciona una receta..." />
            </SelectTrigger>
            <SelectContent>
              {recipes.map((recipe) => (
                <SelectItem key={recipe.id} value={recipe.id}>
                  {recipe.name}
                  {recipe.cost_per_portion && recipe.cost_per_portion > 0 ? (
                    <span className="text-muted-foreground ml-2">
                      — {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(recipe.cost_per_portion)}/porción
                    </span>
                  ) : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nombre del platillo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ej: Tacos al Pastor"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe los ingredientes principales y preparación..."
            rows={3}
          />
        </div>

        <div>
          <Label>Categoría *</Label>
          <Select
            value={formData.category || undefined}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Categorías personalizadas
                  </div>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                  <div className="my-1 border-t" />
                </>
              )}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Categorías estándar
              </div>
              {LEGACY_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Precio ({currencySymbol}) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_featured}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
          />
          <Label className="flex items-center gap-1 cursor-pointer">
            <Star className="w-4 h-4 text-yellow-500" />
            Destacado
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_new}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: checked }))}
          />
          <Label className="flex items-center gap-1 cursor-pointer">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Nuevo
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_bestseller}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bestseller: checked }))}
          />
          <Label className="flex items-center gap-1 cursor-pointer">
            🔥 Más vendido
          </Label>
        </div>
      </div>
    </div>
  );
};
