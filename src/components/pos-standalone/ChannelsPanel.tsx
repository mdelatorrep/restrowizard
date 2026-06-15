import { Truck, Calendar, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePOSChannels } from "@/hooks/usePOSChannels";

interface Props {
  userId: string;
}

const STATUS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-200 border-blue-500/40",
  accepted: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  preparing: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  ready: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  confirmed: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  pending: "bg-zinc-500/20 text-zinc-200 border-zinc-500/40",
  seated: "bg-[var(--pos-accent,#D4A5DB)]/20 text-[var(--pos-accent,#D4A5DB)] border-[var(--pos-accent,#D4A5DB)]/40",
};

export function ChannelsPanel({ userId }: Props) {
  const { delivery, reservations } = usePOSChannels(userId);

  return (
    <div className="h-full flex flex-col bg-zinc-900/40 border-l border-zinc-800/80">
      <div className="p-3 border-b border-zinc-800/80">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Canales</div>
        <h3 className="text-sm font-semibold">Delivery y reservas en vivo</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <section>
            <div className="flex items-center gap-1.5 mb-2 text-xs text-zinc-400">
              <Truck className="h-3.5 w-3.5" />
              <span>Delivery ({delivery.length})</span>
            </div>
            <div className="space-y-1.5">
              {delivery.length === 0 && <p className="text-xs text-zinc-600">Sin pedidos activos</p>}
              {delivery.map((o) => (
                <div key={o.id} className="rounded border border-zinc-800 p-2 bg-zinc-950/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{o.provider} · #{(o.external_order_id ?? o.id).slice(-5)}</span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS[o.status] ?? ""}`}>{o.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500">
                    <span className="truncate">{o.customer_name ?? "Cliente"}</span>
                    <span className="text-[var(--pos-accent,#D4A5DB)] font-semibold">
                      ${Math.round(Number(o.total ?? 0)).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-1.5 mb-2 text-xs text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>Reservas hoy ({reservations.length})</span>
            </div>
            <div className="space-y-1.5">
              {reservations.length === 0 && <p className="text-xs text-zinc-600">Sin reservas</p>}
              {reservations.map((r) => (
                <div key={r.id} className="rounded border border-zinc-800 p-2 bg-zinc-950/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{r.customer_name}</span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS[r.status] ?? ""}`}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.reservation_time}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.party_size}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
