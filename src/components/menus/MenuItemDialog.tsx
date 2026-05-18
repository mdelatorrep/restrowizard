import React, { useState, useRef } from 'react';
import { 
  Upload, X, Clock, Flame, DollarSign, Image as ImageIcon,
  AlertTriangle, ChefHat, Sparkles, Star
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { MenuItemSchema } from '@/lib/schemas/menuItem';

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

const LEGACY_CATEGORIES = [
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
  { value: 'cocktails', label: 'Cócteles' },
  { value: 'kids', label: 'Niños' },
  { value: 'specials', label: 'Especiales' },
];

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetariano', icon: '🥬' },
  { value: 'vegan', label: 'Vegano', icon: '🌱' },
  { value: 'gluten_free', label: 'Sin Gluten', icon: '🌾' },
  { value: 'keto', label: 'Keto', icon: '🥓' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'kosher', label: 'Kosher', icon: '✡️' },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(item?.image_url || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
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
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const toggleDietaryTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  const toggleAllergen = (code: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(code)
        ? prev.allergens.filter(a => a !== code)
        : [...prev.allergens, code],
    }));
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
      
      // Upload image if new file selected
      if (result && selectedFile && onUploadImage) {
        await onUploadImage(result.id, selectedFile);
      }

      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const profitMargin = formData.price && formData.cost 
    ? (((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Platillo' : 'Nuevo Platillo'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">General</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="allergens">Alérgenos</TabsTrigger>
            <TabsTrigger value="pricing">Precios</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Image upload */}
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
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Formatos: JPG, PNG, WebP<br />
                    Tamaño recomendado: 800x600px
                  </p>
                  {!previewImage && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Seleccionar imagen
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Recipe selector */}
            {recipes.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                <Label className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Vincular con Receta (opcional)
                </Label>
                <Select value={formData.recipe_id} onValueChange={handleRecipeSelect}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecciona una receta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name} 
                        {recipe.cost_per_portion && (
                          <span className="text-muted-foreground ml-2">
                            ({currencySymbol}{recipe.cost_per_portion.toFixed(2)}/porción)
                          </span>
                        )}
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
                  value={formData.category} 
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

            {/* Badges */}
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
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <Label className="flex items-center gap-2">
                Etiquetas dietéticas
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIETARY_OPTIONS.map(option => (
                  <Badge
                    key={option.value}
                    variant={formData.dietary_tags.includes(option.value) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1.5 text-sm"
                    onClick={() => toggleDietaryTag(option.value)}
                  >
                    {option.icon} {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tiempo de preparación (min)
                </Label>
                <Input
                  type="number"
                  value={formData.preparation_time_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparation_time_minutes: e.target.value }))}
                  placeholder="15"
                />
              </div>

              <div>
                <Label>Calorías (kcal)</Label>
                <Input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                  placeholder="450"
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Nivel de picante: {formData.spicy_level || 0}
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-muted-foreground">Suave</span>
                <Slider
                  value={[formData.spicy_level]}
                  onValueChange={([val]) => setFormData(prev => ({ ...prev, spicy_level: val }))}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">🔥🔥🔥🔥🔥</span>
              </div>
              <div className="flex justify-between mt-1">
                {[0, 1, 2, 3, 4, 5].map(level => (
                  <span 
                    key={level}
                    className={`text-xs ${formData.spicy_level === level ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                  >
                    {level === 0 ? 'Sin' : Array(level).fill('🌶️').join('')}
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Allergens Tab */}
          <TabsContent value="allergens" className="space-y-4 mt-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Información importante</p>
                <p className="text-orange-700">
                  Marca los alérgenos presentes en este platillo. Esta información 
                  se mostrará a los clientes en el menú digital.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allergens.map(allergen => (
                <div
                  key={allergen.id}
                  onClick={() => toggleAllergen(allergen.code)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.allergens.includes(allergen.code)
                      ? 'border-red-400 bg-red-50'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={formData.allergens.includes(allergen.code)}
                    onCheckedChange={() => toggleAllergen(allergen.code)}
                  />
                  <span className="text-lg">{allergen.icon}</span>
                  <span className="text-sm font-medium">{allergen.name}</span>
                </div>
              ))}
            </div>

            {formData.allergens.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Alérgenos seleccionados:</p>
                <div className="flex flex-wrap gap-1">
                  {formData.allergens.map(code => {
                    const allergen = allergens.find(a => a.code === code);
                    return allergen ? (
                      <Badge key={code} variant="destructive" className="text-xs">
                        {allergen.icon} {allergen.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Costo del platillo ({currencySymbol})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="Costo de ingredientes + mano de obra"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Incluye ingredientes, porción y preparación
                </p>
              </div>

              <div>
                <Label>Precio de venta ({currencySymbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Precio al cliente"
                />
              </div>
            </div>

            {profitMargin && (
              <div className={`p-4 rounded-lg ${
                parseFloat(profitMargin) >= 70 ? 'bg-green-50 border border-green-200' :
                parseFloat(profitMargin) >= 50 ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Margen de ganancia</p>
                    <p className="text-2xl font-bold">{profitMargin}%</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Ganancia por unidad</p>
                    <p className="font-semibold text-lg">
                      {currencySymbol}{(parseFloat(formData.price || '0') - parseFloat(formData.cost || '0')).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  {parseFloat(profitMargin) >= 70 
                    ? '✅ Excelente margen para este tipo de platillo'
                    : parseFloat(profitMargin) >= 50
                    ? '⚠️ Margen aceptable, considera optimizar costos'
                    : '❌ Margen bajo, revisa precios o costos'
                  }
                </p>
              </div>
            )}

            {formData.recipe_id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <ChefHat className="w-4 h-4 inline mr-1" />
                  Este platillo está vinculado a una receta. El costo se sincroniza automáticamente.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
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
