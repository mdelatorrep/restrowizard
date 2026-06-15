import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { RestaurantTable } from "@/hooks/usePOSTables";
import type { POSOrder } from "@/hooks/usePOSOrder";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: POSOrder;
  fromTable: RestaurantTable;
  availableTables: RestaurantTable[];
  onDone: () => void;
}

export function TransferTableDialog({ open, onOpenChange, order, fromTable, availableTables, onDone }: Props) {
  const [targetId, setTargetId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!targetId) {
      toast.error("Selecciona una mesa destino");
      return;
    }
    setBusy(true);
    try {
      const sb = supabase as any;
      const { data: userData } = await supabase.auth.getUser();
      await sb
        .from("restaurant_orders")
        .update({
          table_id: targetId,
          transferred_from_table_id: fromTable.id,
          transferred_by: userData.user?.id,
        })
        .eq("id", order.id);
      await sb.from("restaurant_tables").update({ status: "available" }).eq("id", fromTable.id);
      await sb.from("restaurant_tables").update({ status: "occupied" }).eq("id", targetId);
      toast.success("Mesa transferida");
      onDone();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Error al transferir");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 text-zinc-100 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Transferir mesa {fromTable.table_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label className="text-xs text-zinc-400">Mesa destino</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800">
              <SelectValue placeholder="Selecciona una mesa libre" />
            </SelectTrigger>
            <SelectContent>
              {availableTables.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-500">No hay mesas libres</div>
              ) : (
                availableTables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    Mesa {t.table_number} · cap. {t.capacity}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-300">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={busy || !targetId} className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90">
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
