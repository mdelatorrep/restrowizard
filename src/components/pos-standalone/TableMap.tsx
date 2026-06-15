import { useMemo, useState } from "react";
import type { RestaurantTable } from "@/hooks/usePOSTables";
import type { ActiveOrderSummary, Zone } from "@/hooks/usePOSLiveMap";
import { TableCard } from "./TableCard";

interface Props {
  tables: RestaurantTable[];
  zones: Zone[];
  orders: ActiveOrderSummary[];
  selectedTableId: string | null;
  onSelectTable: (t: RestaurantTable) => void;
}

const STATUS_FILTERS = [
  { id: "all", label: "Todas" },
  { id: "available", label: "Disponibles" },
  { id: "occupied", label: "Ocupadas" },
  { id: "reserved", label: "Reservadas" },
];

export function TableMap({ tables, zones, orders, selectedTableId, onSelectTable }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  const orderByTable = useMemo(() => {
    const map = new Map<string, ActiveOrderSummary>();
    for (const o of orders) {
      if (o.table_id) map.set(o.table_id, o);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    return tables.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (zoneFilter !== "all" && (t.zone_id || "no-zone") !== zoneFilter) return false;
      return true;
    });
  }, [tables, statusFilter, zoneFilter]);

  // Group by zone for display
  const groups = useMemo(() => {
    const zoneNames = new Map<string, string>();
    zones.forEach((z) => zoneNames.set(z.id, z.name));
    const out = new Map<string, RestaurantTable[]>();
    for (const t of filtered) {
      const key = t.zone_id || "no-zone";
      if (!out.has(key)) out.set(key, []);
      out.get(key)!.push(t);
    }
    return Array.from(out.entries()).map(([key, arr]) => ({
      id: key,
      name: key === "no-zone" ? "Sin zona" : zoneNames.get(key) || "Zona",
      tables: arr,
    }));
  }, [filtered, zones]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              statusFilter === f.id
                ? "bg-[var(--pos-accent)] text-zinc-900"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
        {zones.length > 0 && (
          <>
            <div className="w-px bg-zinc-800 mx-1" />
            <button
              onClick={() => setZoneFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                zoneFilter === "all"
                  ? "bg-zinc-700 text-zinc-100"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Todas las zonas
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setZoneFilter(z.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  zoneFilter === z.id
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {z.name}
              </button>
            ))}
          </>
        )}
      </div>

      {tables.length === 0 ? (
        <div className="h-full grid place-items-center text-center text-zinc-500 py-20">
          <div>
            <p className="text-lg">No hay mesas configuradas</p>
            <p className="text-sm mt-1">
              El administrador debe configurar el mapa de mesas desde el portal.
            </p>
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center text-zinc-500 py-20">No hay mesas con este filtro.</div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.id}>
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3 font-medium">
                {g.name} · {g.tables.length}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {g.tables.map((t) => (
                  <TableCard
                    key={t.id}
                    table={t}
                    order={orderByTable.get(t.id)}
                    onClick={onSelectTable}
                    selected={t.id === selectedTableId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
