import { ArrowLeft, Plus, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  menu: { name: string; status: string; public_url_slug?: string | null };
  onBack: () => void;
  onCreateItem: () => void;
}

export function MenuEditorHero({ menu, onBack, onCreateItem }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary p-6 text-primary-foreground">
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                className={`${
                  menu.status === 'published'
                    ? 'bg-green-500/20 text-green-100 border-green-400/30'
                    : 'bg-amber-500/20 text-amber-100 border-amber-400/30'
                } border`}
              >
                {menu.status === 'published' ? '✓ Publicado' : '◯ Borrador'}
              </Badge>
              {menu.public_url_slug && menu.status === 'published' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/menu/${menu.public_url_slug}`, '_blank')}
                  className="h-6 text-xs text-white/80 hover:text-white hover:bg-white/10"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver público
                </Button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{menu.name}</h1>
          </div>
        </div>

        <Button
          onClick={onCreateItem}
          className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20 group"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          Nuevo Platillo
          <Sparkles className="w-4 h-4 ml-2 opacity-50" />
        </Button>
      </div>

      <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-3xl" />
    </div>
  );
}
