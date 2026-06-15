import { useState } from "react";
import { Receipt, Send, CreditCard, Split, ArrowRightLeft, GitMerge, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderItemRow } from "./OrderItemRow";
import { PaymentDialogV2 } from "./PaymentDialogV2";
import { SplitBillDialog } from "./SplitBillDialog";
import { TransferTableDialog } from "./TransferTableDialog";
import { MergeTablesDialog } from "./MergeTablesDialog";
import { usePOSOrder } from "@/hooks/usePOSOrder";
import { usePOSPayment } from "@/hooks/usePOSPayment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RestaurantTable } from "@/hooks/usePOSTables";
import type { ActiveOrderSummary } from "@/hooks/usePOSLiveMap";

interface Props {
  table: RestaurantTable;
  restaurantUserId: string;
  waiterName: string | null;
  allTables: RestaurantTable[];
  activeOrders: ActiveOrderSummary[];
}

export function OrderPanel({ table, restaurantUserId, waiterName, allTables, activeOrders }: Props) {
  const o = usePOSOrder(restaurantUserId, table.id);
  const { processPayment } = usePOSPayment();
  const [payOpen, setPayOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  const order = o.order;
  const hasItems = !!order && order.items.length > 0;
  const hasPending = !!order && order.items.some((i) => i.status === "pending");

  const handleStart = async () => {
    await o.ensureOrder({ tableId: table.id, waiterName, guests: 1 });
  };

  const handlePay = async (
    payments: { method_id: string; method_name: string; amount: number; reference?: string }[],
    tipAmount: number,
    tipBreakdown: { method_id: string; amount: number }[],
  ) => {
    if (!order) return;
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const result = await processPayment(order.id, payments, tipAmount);
    if (!result) return;
    const sb = supabase as any;
    await sb
      .from("restaurant_orders")
      .update({
        payment_status: "paid",
        status: "completed",
        completed_at: new Date().toISOString(),
        tip_amount: tipAmount,
        tip_breakdown: tipBreakdown,
        total,
      })
      .eq("id", order.id);
    await sb.from("restaurant_tables").update({ status: "available" }).eq("id", table.id);
    toast.success("Pago registrado, mesa liberada");
    o.refresh();
  };

  const availableTables = allTables.filter(
    (t) => t.id !== table.id && t.status === "available",
  );

  if (!order) {
    return (
      <div className="h-full flex flex-col bg-zinc-900/40">
        <div className="p-4 border-b border-zinc-800/80">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Mesa</div>
          <h2 className="text-2xl font-semibold">{table.table_number}</h2>
          <div className="text-xs text-zinc-500 mt-0.5">Capacidad {table.capacity}</div>
        </div>
        <div className="flex-1 grid place-items-center p-6 text-center">
          <div>
            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm text-zinc-400 mb-4">Sin comanda activa</p>
            <Button
              onClick={handleStart}
              className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90"
              disabled={o.loading}
            >
              Abrir comanda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900/40">
      <div className="p-3 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Mesa</div>
            <h2 className="text-xl font-semibold">{table.table_number}</h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Total</div>
            <div className="text-xl font-bold text-[var(--pos-accent)]">
              ${Math.round(order.total).toLocaleString("es-CO")}
            </div>
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          <ActionBtn icon={Split} label="Dividir" onClick={() => setSplitOpen(true)} disabled={!hasItems} />
          <ActionBtn icon={GitMerge} label="Fusionar" onClick={() => setMergeOpen(true)} />
          <ActionBtn icon={ArrowRightLeft} label="Transferir" onClick={() => setTransferOpen(true)} />
          <ActionBtn icon={Printer} label="Reimprimir" onClick={() => toast.info("Comanda reenviada a cocina")} disabled={!hasItems} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {order.items.length === 0 ? (
          <div className="h-full grid place-items-center text-zinc-500 text-sm py-12">
            Toca un producto para agregarlo
          </div>
        ) : (
          order.items.map((line) => (
            <OrderItemRow
              key={line.line_id}
              line={line}
              onInc={() => o.updateQuantity(line.line_id, line.quantity + 1)}
              onDec={() => o.updateQuantity(line.line_id, line.quantity - 1)}
              onRemove={() => o.removeItem(line.line_id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-zinc-800/80 p-3 space-y-2 bg-zinc-950/60">
        <Row label="Subtotal" value={order.subtotal} />
        {order.discount_amount > 0 && <Row label="Descuento" value={-order.discount_amount} />}
        {order.tax_amount > 0 && <Row label="Impuestos" value={order.tax_amount} />}
        <Row label="Total" value={order.total} strong />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            onClick={() => o.sendToKitchen()}
            disabled={!hasPending}
            className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30"
          >
            <Send className="h-4 w-4 mr-1.5" /> A cocina
          </Button>
          <Button
            onClick={() => setPayOpen(true)}
            disabled={!hasItems}
            className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90"
          >
            <CreditCard className="h-4 w-4 mr-1.5" /> Cobrar
          </Button>
        </div>
      </div>

      <PaymentDialogV2
        open={payOpen}
        onOpenChange={setPayOpen}
        total={order.total}
        onComplete={handlePay}
      />
      {order && (
        <>
          <SplitBillDialog open={splitOpen} onOpenChange={setSplitOpen} order={order} onSplit={o.refresh} />
          <TransferTableDialog
            open={transferOpen}
            onOpenChange={setTransferOpen}
            order={order}
            fromTable={table}
            availableTables={availableTables}
            onDone={o.refresh}
          />
          <MergeTablesDialog
            open={mergeOpen}
            onOpenChange={setMergeOpen}
            order={order}
            tables={allTables}
            otherOrders={activeOrders}
            onDone={o.refresh}
          />
        </>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled }: { icon: any; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 hover:border-[var(--pos-accent)] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${strong ? "text-zinc-100 font-bold text-base" : "text-zinc-400"}`}>
      <span>{label}</span>
      <span className={strong ? "text-[var(--pos-accent)]" : ""}>
        ${Math.round(value).toLocaleString("es-CO")}
      </span>
    </div>
  );
}

export { OrderPanel as default };
