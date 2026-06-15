import { useEffect, useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Item { menu_item_id: string; name: string; quantity: number; price?: number }
interface Suggestion { menu_item_id: string; name: string; reason: string; score: number }

interface Props {
  userId: string;
  currentItems: Item[];
  onAdd: (s: Suggestion) => void;
}

export function AISuggestPanel({ userId, currentItems, onAdd }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pitch, setPitch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any).functions.invoke("pos-ai-suggest", {
          body: {
            user_id: userId,
            current_items: currentItems.map((i) => ({ menu_item_id: i.menu_item_id, name: i.name, quantity: i.quantity })),
            max_suggestions: 3,
          },
        });
        if (!error && data?.ok) {
          setSuggestions(data.suggestions ?? []);
          setPitch(data.pitch ?? null);
        }
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [userId, currentItems.length]);

  if (loading && suggestions.length === 0) return null;
  if (suggestions.length === 0) return null;

  return (
    <div className="border-t border-zinc-800/80 p-2 bg-zinc-950/40">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="h-3 w-3 text-[var(--pos-accent,#D4A5DB)]" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">Sugerencias IA</span>
      </div>
      {pitch && <p className="text-[11px] text-zinc-300 italic mb-1.5">"{pitch}"</p>}
      <div className="flex flex-col gap-1">
        {suggestions.map((s) => (
          <Button
            key={s.menu_item_id}
            variant="outline"
            size="sm"
            className="justify-between h-8 bg-zinc-900 border-zinc-800 text-xs hover:border-[var(--pos-accent,#D4A5DB)]"
            onClick={() => onAdd(s)}
          >
            <span className="truncate">{s.name}</span>
            <Plus className="h-3 w-3 ml-1 flex-shrink-0" />
          </Button>
        ))}
      </div>
    </div>
  );
}
