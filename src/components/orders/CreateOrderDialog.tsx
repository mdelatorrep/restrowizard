import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CreateOrderSchema } from '@/lib/schemas/order';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { useInventoryDeduction } from '@/hooks/useInventoryDeduction';
import { formatCurrency } from '@/lib/formatCurrency';

type OrderType = 'dine_in' | 'takeout' | 'delivery';

interface MenuItemOption {
  id: string;
  name: string;
  price: number;
  category: string | null;
}

interface Item {
  menu_item_id: string | null;
  name: string;
  quantity: number;
  price: number;
  isManual: boolean;
}

interface Props {
  onCreate: (payload: any) => Promise<any>;
}

const FREE_ITEM = '__manual__';

const initialForm = {
  customer_name: '',
  customer_phone: '',
  delivery_address: '',
  order_type: 'delivery' as OrderType,
  items: [{ menu_item_id: null, name: '', quantity: 1, price: 0, isManual: false }] as Item[],
};

const channelFor = (t: OrderType) => {
  if (t === 'dine_in') return 'dine_in';
  if (t === 'takeout') return 'takeout';
  return 'delivery_own';
};

export const CreateOrderDialog: React.FC<Props> = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { userId } = useDataUserId();
  const { deductInventoryForOrder } = useInventoryDeduction();

  // TK-17: cargar menú real para autocompletar precio y descontar stock al crear.
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoadingMenu(true);
    (async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('id, name, price, category, is_available')
        .eq('user_id', userId)
        .eq('is_available', true)
        .order('name');
      if (!cancelled) {
        setMenuItems(((data || []) as any[]).map(d => ({
          id: d.id, name: d.name, price: Number(d.price) || 0, category: d.category,
        })));
        setLoadingMenu(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setForm(f => {
      const next = [...f.items];
      next[idx] = { ...next[idx], ...patch };
      return { ...f, items: next };
    });
  };

  const pickMenuItem = (idx: number, value: string) => {
    if (value === FREE_ITEM) {
      updateItem(idx, { menu_item_id: null, name: '', price: 0, isManual: true });
      return;
    }
    const mi = menuItems.find(m => m.id === value);
    if (mi) updateItem(idx, { menu_item_id: mi.id, name: mi.name, price: mi.price, isManual: false });
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : f.items }));
  };

  const handleSubmit = async () => {
    const cleanItems = form.items.filter(i => i.name.trim().length > 0);
    if (cleanItems.length === 0) {
      toast.error('Agrega al menos un ítem al pedido');
      return;
    }
    const parsed = CreateOrderSchema.safeParse({ ...form, items: cleanItems });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    const subtotal = cleanItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    setSubmitting(true);
    try {
      const created = await onCreate({
        ...form,
        items: cleanItems.map(i => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        subtotal,
        total: subtotal,
        source: 'phone',
        sales_channel: channelFor(form.order_type),
      });

      // TK-17: descontar inventario igual que el POS, sólo para ítems del menú.
      if (created?.id) {
        const linked = cleanItems
          .filter(i => i.menu_item_id)
          .map(i => ({ menu_item_id: i.menu_item_id!, name: i.name, quantity: i.quantity }));
        if (linked.length > 0) {
          const res = await deductInventoryForOrder(created.id, linked);
          if (res.deductedCount > 0) toast.success(`Stock descontado para ${res.deductedCount} ítem(s)`);
          if (res.missingRecipeCount > 0) toast.message(`${res.missingRecipeCount} ítem(s) sin receta vinculada (no se descontó stock)`);
        }
      }

      setOpen(false);
      setForm(initialForm);
    } finally {
      setSubmitting(false);
    }
  };

  const totalLive = form.items.reduce((s, i) => s + (i.price * i.quantity), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Pedido Manual</DialogTitle>
          <DialogDescription>
            Selecciona productos del menú para auto-completar el precio y descontar inventario.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="Nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                placeholder="3001234567"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tipo de Pedido</Label>
            <Select
              value={form.order_type}
              onValueChange={(value: OrderType) => setForm({ ...form, order_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine_in">En Mesa</SelectItem>
                <SelectItem value="takeout">Para Llevar</SelectItem>
                <SelectItem value="delivery">Domicilio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.order_type === 'delivery' && (
            <div className="grid gap-2">
              <Label>Dirección de Entrega</Label>
              <Input
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
          )}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <span className="text-xs text-muted-foreground">
                {loadingMenu ? 'Cargando menú…' : `${menuItems.length} productos disponibles`}
              </span>
            </div>
            {form.items.map((item, idx) => (
              <div key={idx} className="grid gap-2 p-3 border rounded-lg">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
                  <div className="grid gap-1">
                    <Select
                      value={item.menu_item_id ?? (item.isManual ? FREE_ITEM : '')}
                      onValueChange={(v) => pickMenuItem(idx, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingMenu ? 'Cargando…' : 'Seleccionar del menú'} />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map(mi => (
                          <SelectItem key={mi.id} value={mi.id}>
                            {mi.name} — {formatCurrency(mi.price)}
                          </SelectItem>
                        ))}
                        <SelectItem value={FREE_ITEM}>＋ Ítem libre (sin menú)</SelectItem>
                      </SelectContent>
                    </Select>
                    {item.isManual && (
                      <Input
                        placeholder="Nombre del ítem libre"
                        value={item.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    aria-label="Quitar ítem"
                    disabled={form.items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Precio unitario</Label>
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(idx, { price: parseFloat(e.target.value) || 0 })}
                      disabled={!item.isManual && !!item.menu_item_id}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({
                ...form,
                items: [...form.items, { menu_item_id: null, name: '', quantity: 1, price: 0, isManual: false }],
              })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Ítem
            </Button>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <span className="text-lg font-semibold">{formatCurrency(totalLive)}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear Pedido'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
