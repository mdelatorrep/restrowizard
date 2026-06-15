import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { POSOrder } from "@/hooks/usePOSOrder";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: POSOrder;
  onSplit: () => void;
}

export function SplitBillDialog({ open, onOpenChange, order, onSplit }: Props) {
  const [mode, setMode] = useState<"persons" | "items">("persons");
  const [persons, setPersons] = useState(2);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = async () => {
    setBusy(true);
    try {
      const sb = supabase as any;
      if (mode === "persons") {
        if (persons < 2) {
          toast.error("Mínimo 2 personas");
          return;
        }
        const portion = order.total / persons;
        const splits = Array.from({ length: persons - 1 }).map(() => ({
          user_id: order.user_id,
          table_id: order.table_id,
          guests_count: 1,
          waiter_name: order.waiter_name,
          order_type: "dine_in",
          sales_channel: "pos",
          is_pos_order: true,
          status: "pending",
          payment_status: "pending",
          items: [],
          subtotal: portion,
          total: portion,
          split_from_order_id: order.id,
          notes: `Cuenta dividida ${persons} formas`,
        }));
        await sb.from("restaurant_orders").insert(splits);
        await sb
          .from("restaurant_orders")
          .update({ subtotal: portion, total: portion, notes: `Cuenta dividida ${persons} formas` })
          .eq("id", order.id);
        toast.success(`Cuenta dividida en ${persons} partes`);
      } else {
        const movedItems = order.items.filter((i) => selected.has(i.line_id));
        if (movedItems.length === 0) {
          toast.error("Selecciona al menos un ítem");
          return;
        }
        const movedSubtotal = movedItems.reduce(
          (s, i) => s + (i.unit_price + (i.modifiers || []).reduce((a, m) => a + m.price, 0)) * i.quantity,
          0,
        );
        const remainingItems = order.items.filter((i) => !selected.has(i.line_id));
        const remainingSubtotal = remainingItems.reduce(
          (s, i) => s + (i.unit_price + (i.modifiers || []).reduce((a, m) => a + m.price, 0)) * i.quantity,
          0,
        );
        await sb.from("restaurant_orders").insert({
          user_id: order.user_id,
          table_id: order.table_id,
          guests_count: 1,
          waiter_name: order.waiter_name,
          order_type: "dine_in",
          sales_channel: "pos",
          is_pos_order: true,
          status: "pending",
          payment_status: "pending",
          items: movedItems,
          subtotal: movedSubtotal,
          total: movedSubtotal,
          split_from_order_id: order.id,
        });
        await sb
          .from("restaurant_orders")
          .update({ items: remainingItems, subtotal: remainingSubtotal, total: remainingSubtotal })
          .eq("id", order.id);
        toast.success("Ítems movidos a nueva cuenta");
      }
      onSplit();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Error al dividir cuenta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 text-zinc-100 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Dividir cuenta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("persons")}
              className={`p-3 rounded-lg border text-sm ${mode === "persons" ? "border-[var(--pos-accent)] bg-zinc-900" : "border-zinc-800 bg-zinc-900/50"}`}
            >
              Por personas (montos iguales)
            </button>
            <button
              onClick={() => setMode("items")}
              className={`p-3 rounded-lg border text-sm ${mode === "items" ? "border-[var(--pos-accent)] bg-zinc-900" : "border-zinc-800 bg-zinc-900/50"}`}
            >
              Por ítems
            </button>
          </div>

          {mode === "persons" ? (
            <div>
              <Label className="text-xs text-zinc-400">Número de personas</Label>
              <Input
                type="number"
                min={2}
                value={persons}
                onChange={(e) => setPersons(parseInt(e.target.value) || 2)}
                className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Cada persona pagará ${Math.round(order.total / Math.max(persons, 1)).toLocaleString("es-CO")}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {order.items.map((i) => (
                <label
                  key={i.line_id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i.line_id)}
                    onChange={() => toggle(i.line_id)}
                  />
                  <span className="flex-1 text-sm">
                    {i.quantity}× {i.name}
                  </span>
                  <span className="text-sm text-[var(--pos-accent)]">
                    ${Math.round(i.unit_price * i.quantity).toLocaleString("es-CO")}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-300">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={busy} className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90">
            Dividir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
