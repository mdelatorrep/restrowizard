import React from 'react';
import { Plus, Sparkles, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  onCreate: () => void;
}

export const MenusEmptyState: React.FC<Props> = ({ onCreate }) => (
  <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-card via-card to-muted/20">
    <CardContent className="flex flex-col items-center justify-center py-20">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-pulse">
          <Utensils className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        ¡Comienza tu aventura gastronómica!
      </h3>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Crea menús digitales profesionales con códigos QR, alérgenos, precios dinámicos y mucho más
      </p>
      <Button
        onClick={onCreate}
        size="lg"
        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg group"
      >
        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
        Crear Mi Primer Menú
      </Button>
    </CardContent>
  </Card>
);
