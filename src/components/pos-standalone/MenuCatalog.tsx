import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { POSCategory, POSMenuItem } from "@/hooks/usePOSMenu";

interface Props {
  items: POSMenuItem[];
  categories: POSCategory[];
  onPick: (item: POSMenuItem) => void;
  disabled?: boolean;
}

export function MenuCatalog({ items, categories, onPick, disabled }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("__all__");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((it) => {
      if (!it.is_available) return false;
      if (cat !== "__all__") {
        if (cat === "__none__" ? it.category_id || it.category : (it.category_id ? it.category_id !== cat : it.category !== cat)) {
          return false;
        }
      }
      if (ql && !it.name.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [items, q, cat]);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-3 border-b border-zinc-800/80 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar producto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="px-3 py-2 flex gap-2 overflow-x-auto border-b border-zinc-800/80 scrollbar-thin">
        <CategoryChip active={cat === "__all__"} onClick={() => setCat("__all__")}>
          Todos
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip
            key={c.id || c.name}
            active={cat === (c.id || c.name)}
            onClick={() => setCat(c.id || c.name)}
          >
            {c.name}
          </CategoryChip>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="h-full grid place-items-center text-zinc-500 text-sm">
            Sin productos
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filtered.map((it) => (
              <button
                key={it.id}
                disabled={disabled}
                onClick={() => onPick(it)}
                className="text-left rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[var(--pos-accent)] hover:bg-zinc-900/80 transition p-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {it.image_url ? (
                  <div
                    className="h-16 -mx-1 -mt-1 mb-2 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${it.image_url})` }}
                  />
                ) : null}
                <div className="text-sm font-medium text-zinc-100 line-clamp-2 min-h-[2.5rem]">
                  {it.name}
                </div>
                <div className="text-xs text-[var(--pos-accent)] mt-1 font-semibold">
                  ${Math.round(it.price).toLocaleString("es-CO")}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition ${
        active
          ? "bg-[var(--pos-accent)] text-zinc-900"
          : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}
