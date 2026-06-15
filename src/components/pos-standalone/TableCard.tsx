import { useEffect, useState } from "react";
import type { RestaurantTable } from "@/hooks/usePOSTables";
import type { ActiveOrderSummary } from "@/hooks/usePOSLiveMap";
import { cn } from "@/lib/utils";
import { Users, Clock } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; ring: string; label: string; text: string }> = {
  available: {
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/40",
    text: "text-emerald-300",
    label: "Disponible",
  },
  occupied: {
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/40",
    text: "text-amber-300",
    label: "Ocupada",
  },
  reserved: {
    bg: "bg-sky-500/15",
    ring: "ring-sky-500/40",
    text: "text-sky-300",
    label: "Reservada",
  },
  billing: {
    bg: "bg-purple-500/15",
    ring: "ring-purple-500/40",
    text: "text-purple-300",
    label: "Cobrando",
  },
  maintenance: {
    bg: "bg-zinc-500/15",
    ring: "ring-zinc-500/40",
    text: "text-zinc-400",
    label: "Limpieza",
  },
};

function formatElapsed(fromIso: string | undefined): string {
  if (!fromIso) return "—";
  const ms = Date.now() - new Date(fromIso).getTime();
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

interface Props {
  table: RestaurantTable;
  order?: ActiveOrderSummary;
  onClick: (t: RestaurantTable) => void;
  selected?: boolean;
}

export function TableCard({ table, order, onClick, selected }: Props) {
  const style = STATUS_STYLES[table.status] || STATUS_STYLES.available;
  const [, force] = useState(0);

  // Tick once a minute so elapsed time updates while the screen is open
  useEffect(() => {
    if (table.status !== "occupied") return;
    const id = setInterval(() => force((x) => x + 1), 30_000);
    return () => clearInterval(id);
  }, [table.status]);

  const shape =
    table.shape === "circle"
      ? "rounded-full aspect-square"
      : table.shape === "square"
      ? "rounded-2xl aspect-square"
      : "rounded-2xl aspect-[4/3]";

  return (
    <button
      onClick={() => onClick(table)}
      className={cn(
        "relative flex flex-col items-center justify-center p-3 ring-1 ring-inset transition-all text-left",
        "hover:brightness-125 active:scale-[0.98]",
        style.bg,
        style.ring,
        shape,
        selected && "ring-2 ring-[var(--pos-accent)] shadow-lg shadow-[var(--pos-accent)]/20",
      )}
    >
      <div className="absolute top-2 left-2 text-xs uppercase tracking-wider opacity-70">
        {style.label}
      </div>
      <div className="text-2xl font-semibold text-zinc-100">{table.table_number}</div>
      <div className="flex items-center gap-1 text-xs text-zinc-300 mt-1">
        <Users className="h-3 w-3" />
        {table.capacity}
      </div>
      {table.status === "occupied" && order && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px]">
          <span className={cn("flex items-center gap-1", style.text)}>
            <Clock className="h-3 w-3" /> {formatElapsed(order.created_at)}
          </span>
          <span className="text-zinc-200 font-medium">
            ${Math.round(order.total).toLocaleString("es-CO")}
          </span>
        </div>
      )}
    </button>
  );
}
