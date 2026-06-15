import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ActiveOrderSummary } from "@/hooks/usePOSLiveMap";
import type { POSOrder, POSOrderLine } from "@/hooks/usePOSOrder";
import type { RestaurantTable } from "@/hooks/usePOSTables";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: POSOrder;
  tables: RestaurantTable[];
  otherOrders: ActiveOrderSummary[];
  onDone: () => void;
}

export function MergeTablesDialog({ open, onOpenChange, order, tables, otherOrders, onDone }: Props) {
  const [sourceOrderId, setSourceOrderId] = useState("");
  const [busy, setBusy] = useState(false);

  const sources = otherOrders.filter((o) => o.id !== order.id && o.table_id);

  const submit = async () => {
    if (!sourceOrderId) {
      toast.error("Selecciona la mesa a fusionar");
      return;
    }
    setBusy(true);
    try {
      const sb = supabase as any;
      const { data: src } = await sb
        .from("restaurant_orders")
        .select("*")
        .eq("id", sourceOrderId)
        .single();
      const srcItems: POSOrderLine[] = Array.isArray(src.items) ? src.items : [];
      const mergedItems = [...order.items, ...srcItems];
      const subtotal = mergedItems.reduce(
        (s, i) => s + (i.unit_price + (i.modifiers || []).reduce((a, m) => a + m.price, 0)) * i.quantity,
        0,
      );
      await sb
        .from("restaurant_orders")
        .update({ items: mergedItems, subtotal, total: subtotal })
        .eq("id", order.id);
      await sb
        .from("restaurant_orders")
        .update({ merged_into_order_id: order.id, status: "cancelled", payment_status: "merged" })
        .eq("id", sourceOrderId);
      if (src.table_id) {
        await sb.from("restaurant_tables").update({ status: "available" }).eq("id", src.table_id);
      }
      toast.success("Mesas fusionadas");
      onDone();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Error al fusionar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 text-zinc-100 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Fusionar mesa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-zinc-400">Los ítems de la mesa elegida se moverán a esta cuenta.</p>
          <Label className="text-xs text-zinc-400">Mesa origen</Label>
          <Select value={sourceOrderId} onValueChange={setSourceOrderId}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800">
              <SelectValue placeholder="Selecciona mesa con comanda activa" />
            </SelectTrigger>
            <SelectContent>
              {sources.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-500">No hay otras mesas con comanda activa</div>
              ) : (
                sources.map((o) => {
                  const t = tables.find((x) => x.id === o.table_id);
                  return (
                    <SelectItem key={o.id} value={o.id}>
                      Mesa {t?.table_number ?? "?"} · ${Math.round(o.total).toLocaleString("es-CO")}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-300">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={busy || !sourceOrderId} className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90">
            Fusionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
