import React, { useState } from 'react';
import { Plus, GripVertical, Edit3, Trash2, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import type { Tables } from '@/integrations/supabase/types';

type MenuCategory = Tables<'menu_categories'>;

interface MenuCategoriesManagerProps {
  categories: MenuCategory[];
  itemsCount: Record<string, number>;
  onCreateCategory: (data: { name: string; description?: string; icon?: string }) => Promise<any>;
  onUpdateCategory: (id: string, data: Partial<MenuCategory>) => Promise<any>;
  onDeleteCategory: (id: string) => Promise<boolean>;
  onReorderCategories: (newOrder: MenuCategory[]) => Promise<boolean>;
}

const CATEGORY_ICONS = [
  { value: '🍽️', label: 'Platos' },
  { value: '🥗', label: 'Ensaladas' },
  { value: '🍜', label: 'Sopas' },
  { value: '🥩', label: 'Carnes' },
  { value: '🐟', label: 'Pescados' },
  { value: '🍕', label: 'Pizza' },
  { value: '🍝', label: 'Pastas' },
  { value: '🍰', label: 'Postres' },
  { value: '🥤', label: 'Bebidas' },
  { value: '🍷', label: 'Vinos' },
  { value: '🍹', label: 'Cócteles' },
  { value: '☕', label: 'Café' },
  { value: '🥪', label: 'Sándwiches' },
  { value: '🌮', label: 'Tacos' },
  { value: '🍔', label: 'Hamburguesas' },
  { value: '👶', label: 'Niños' },
  { value: '⭐', label: 'Especiales' },
  { value: '🌱', label: 'Vegano' },
];

export const MenuCategoriesManager: React.FC<MenuCategoriesManagerProps> = ({
  categories,
  itemsCount,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🍽️',
    is_active: true,
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '🍽️', is_active: true });
    setShowDialog(true);
  };

  const handleOpenEdit = (category: MenuCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '🍽️',
      is_active: category.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          is_active: formData.is_active,
        });
      } else {
        await onCreateCategory({
          name: formData.name,
          description: formData.description || undefined,
          icon: formData.icon,
        });
      }
      setShowDialog(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDeleteCategory(deleteId);
    setDeleteId(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onReorderCategories(newCategories);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Categorías del Menú</h3>
          <p className="text-sm text-muted-foreground">
            Arrastra para reordenar • {categories.length} categorías
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No hay categorías personalizadas.<br />
              Crea una para organizar mejor tu menú.
            </p>
            <Button onClick={handleOpenCreate} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((category, index) => (
            <Card
              key={category.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${
                draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
              } ${!category.is_active ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="text-2xl">{category.icon || '🍽️'}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{category.name}</h4>
                    {!category.is_active && (
                      <Badge variant="outline" className="text-[10px]">Oculta</Badge>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {category.description}
                    </p>
                  )}
                </div>

                <Badge variant="secondary" className="shrink-0">
                  {itemsCount[category.name] || 0} platillos
                </Badge>

                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleOpenEdit(category)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setDeleteId(category.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Entradas, Platos Fuertes, Postres..."
              />
            </div>

            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción breve de la categoría..."
                rows={2}
              />
            </div>

            <div>
              <Label>Icono</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORY_ICONS.map(icon => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                      formData.icon === icon.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent hover:border-muted'
                    }`}
                    title={icon.label}
                  >
                    {icon.value}
                  </button>
                ))}
              </div>
            </div>

            {editingCategory && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Visible en el menú</Label>
                  <p className="text-xs text-muted-foreground">
                    Si está desactivada, no aparecerá en el menú público
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || saving}>
              {saving ? 'Guardando...' : editingCategory ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Los platillos de esta categoría no serán eliminados, 
              pero perderán su categoría asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
