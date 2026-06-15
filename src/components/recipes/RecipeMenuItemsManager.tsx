import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { useRecipeMenuLinks } from '@/hooks/useRecipeMenuLinks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Trash2, Plus, Link2 } from 'lucide-react';

interface Props { recipeId: string; }

export const RecipeMenuItemsManager = ({ recipeId }: Props) => {
  const { userId } = useDataUserId();
  const { links, addLink, removeLink, setPrimary, updateVariant } = useRecipeMenuLinks(recipeId);
  const [menuItems, setMenuItems] = useState<{ id: string; name: string; category: string | null }[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [variant, setVariant] = useState('');

  useEffect(() => {
    if (!userId) return;
    (supabase.from('menu_items') as any).select('id, name, category').eq('user_id', userId).order('name')
      .then(({ data }: any) => setMenuItems((data as any) || []));
  }, [userId]);

  const handleAdd = async () => {
    if (!selectedItem) return;
    await addLink(selectedItem, variant.trim() || undefined, links.length === 0);
    setSelectedItem('');
    setVariant('');
  };

  const availableItems = menuItems.filter(mi => !links.some(l => l.menu_item_id === mi.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="h-5 w-5 text-primary" />
          Ítems de Menú vinculados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Una receta puede servir a varios ítems del menú (versión base, vegana, XL, etc.).
          La receta "Principal" es la que se usa por defecto para costeo y descuento de stock.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div className="md:col-span-2">
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger><SelectValue placeholder="Selecciona ítem de menú..." /></SelectTrigger>
              <SelectContent>
                {availableItems.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No quedan ítems sin vincular
                  </div>
                ) : availableItems.map(mi => (
                  <SelectItem key={mi.id} value={mi.id}>
                    {mi.name} {mi.category ? <span className="text-muted-foreground">· {mi.category}</span> : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Variante (opcional)"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            />
            <Button onClick={handleAdd} disabled={!selectedItem} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {links.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            Aún no hay ítems de menú vinculados.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map(link => (
              <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  className={link.is_primary ? 'text-yellow-500' : 'text-muted-foreground'}
                  onClick={() => !link.is_primary && setPrimary(link.id, link.menu_item_id)}
                  title={link.is_primary ? 'Receta principal' : 'Marcar como principal'}
                >
                  <Star className="h-4 w-4" fill={link.is_primary ? 'currentColor' : 'none'} />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{link.menu_item?.name || 'Ítem'}</p>
                  {link.menu_item?.category && (
                    <p className="text-xs text-muted-foreground">{link.menu_item.category}</p>
                  )}
                </div>
                <Input
                  className="w-32 h-8 text-xs"
                  placeholder="Variante"
                  defaultValue={link.variant_name || ''}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (link.variant_name || '')) updateVariant(link.id, v || null);
                  }}
                />
                {link.is_primary && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                <Button variant="ghost" size="icon" onClick={() => removeLink(link.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
