import type { RestaurantTable } from "@/hooks/usePOSTables";
import type { ActiveOrderSummary } from "@/hooks/usePOSLiveMap";
import { Clock, User, Receipt } from "lucide-react";

interface Props {
  table: RestaurantTable | null;
  order?: ActiveOrderSummary;
}

function formatElapsed(fromIso?: string) {
  if (!fromIso) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function TableSummaryPanel({ table, order }: Props) {
  if (!table) {
    return (
      <div className="h-full grid place-items-center p-6 text-center text-zinc-500">
        <div>
          <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Selecciona una mesa para ver el detalle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500">Mesa</div>
        <h2 className="text-3xl font-semibold mt-1">{table.table_number}</h2>
        <div className="text-sm text-zinc-400 mt-1">
          Capacidad {table.capacity} · Estado:{" "}
          <span className="text-zinc-200">{table.status}</span>
        </div>
      </div>

      {order ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-zinc-400">
                <Clock className="h-4 w-4" /> Tiempo
              </span>
              <span className="font-medium">{formatElapsed(order.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="flex items-center gap-2 text-zinc-400">
                <User className="h-4 w-4" /> Mesero
              </span>
              <span className="font-medium">{order.waiter_name || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="flex items-center gap-2 text-zinc-400">
                <Receipt className="h-4 w-4" /> Consumo
              </span>
              <span className="font-semibold text-[var(--pos-accent)]">
                ${Math.round(order.total).toLocaleString("es-CO")}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center">
            La comanda detallada llega en la Fase 2.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <p className="text-sm text-zinc-400 mb-3">Esta mesa no tiene comanda activa.</p>
          <button
            className="px-4 py-2 rounded-lg bg-[var(--pos-accent)] text-zinc-900 text-sm font-medium opacity-60 cursor-not-allowed"
            disabled
          >
            Abrir comanda (próximamente)
          </button>
        </div>
      )}
    </div>
  );
}
