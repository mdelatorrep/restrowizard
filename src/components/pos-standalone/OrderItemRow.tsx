import { Minus, Plus, Trash2, ChefHat, Clock, Check } from "lucide-react";
import type { POSOrderLine } from "@/hooks/usePOSOrder";

interface Props {
  line: POSOrderLine;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}

const STATUS_LABEL: Record<POSOrderLine["status"], { label: string; cls: string; icon: any }> = {
  pending: { label: "Pendiente", cls: "bg-zinc-800 text-zinc-400", icon: Clock },
  sent: { label: "Cocina", cls: "bg-amber-500/15 text-amber-300", icon: ChefHat },
  ready: { label: "Listo", cls: "bg-emerald-500/15 text-emerald-300", icon: Check },
  delivered: { label: "Entregado", cls: "bg-zinc-700/40 text-zinc-300 line-through", icon: Check },
};

export function OrderItemRow({ line, onInc, onDec, onRemove }: Props) {
  const s = STATUS_LABEL[line.status];
  const SIcon = s.icon;
  const mods = line.modifiers || [];
  const lineTotal = (line.unit_price + mods.reduce((a, m) => a + m.price, 0)) * line.quantity;

  return (
    <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${s.cls}`}>
              <SIcon className="h-3 w-3" /> {s.label}
            </span>
          </div>
          <div className="text-sm font-medium text-zinc-100 truncate">{line.name}</div>
          {mods.length > 0 && (
            <div className="text-xs text-zinc-500 mt-0.5">
              {mods.map((m) => m.name).join(", ")}
            </div>
          )}
          {line.notes && (
            <div className="text-xs text-amber-300/80 italic mt-1">"{line.notes}"</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-[var(--pos-accent)]">
            ${Math.round(lineTotal).toLocaleString("es-CO")}
          </div>
          <div className="text-[10px] text-zinc-500">
            ${Math.round(line.unit_price).toLocaleString("es-CO")} c/u
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 rounded-md bg-zinc-950 border border-zinc-800">
          <button
            onClick={onDec}
            className="p-1.5 hover:bg-zinc-900 text-zinc-300 disabled:opacity-40"
            disabled={line.status !== "pending"}
            aria-label="Restar"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-2 text-sm font-semibold w-8 text-center">{line.quantity}</span>
          <button
            onClick={onInc}
            className="p-1.5 hover:bg-zinc-900 text-zinc-300 disabled:opacity-40"
            disabled={line.status !== "pending"}
            aria-label="Sumar"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-zinc-500 hover:text-red-400"
          aria-label="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
