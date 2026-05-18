import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreateOrderSchema } from '@/lib/schemas/order';

type OrderType = 'dine_in' | 'takeout' | 'delivery';

interface Item {
  name: string;
  quantity: number;
  price: number;
}

interface Props {
  onCreate: (payload: any) => Promise<any>;
}

const initialForm = {
  customer_name: '',
  customer_phone: '',
  delivery_address: '',
  order_type: 'delivery' as OrderType,
  items: [{ name: '', quantity: 1, price: 0 }] as Item[],
};

export const CreateOrderDialog: React.FC<Props> = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async () => {
    const parsed = CreateOrderSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    const subtotal = form.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await onCreate({
      ...form,
      items: form.items,
      subtotal,
      total: subtotal,
      source: 'phone',
    });
    setOpen(false);
    setForm(initialForm);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Pedido Manual</DialogTitle>
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
            <Label>Items</Label>
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Producto"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...form.items];
                    newItems[idx].name = e.target.value;
                    setForm({ ...form, items: newItems });
                  }}
                  className="col-span-2"
                />
                <Input
                  type="number"
                  placeholder="Cant."
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...form.items];
                    newItems[idx].quantity = parseInt(e.target.value) || 1;
                    setForm({ ...form, items: newItems });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={item.price}
                  onChange={(e) => {
                    const newItems = [...form.items];
                    newItems[idx].price = parseFloat(e.target.value) || 0;
                    setForm({ ...form, items: newItems });
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({
                ...form,
                items: [...form.items, { name: '', quantity: 1, price: 0 }],
              })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Item
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Crear Pedido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
