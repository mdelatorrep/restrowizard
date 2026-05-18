import React from 'react';
import { Plus, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onCreate: () => void;
}

export const MenusHero: React.FC<Props> = ({ onCreate }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary p-8 text-primary-foreground">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Gestión Profesional
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Menús Digitales</h1>
        <p className="text-primary-foreground/80 max-w-md">
          Crea experiencias gastronómicas memorables con menús interactivos y códigos QR personalizados
        </p>
      </div>
      <Button
        onClick={onCreate}
        size="lg"
        className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20 group"
      >
        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
        Crear Menú
        <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </Button>
    </div>
    <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full bg-white/5 blur-3xl" />
  </div>
);
