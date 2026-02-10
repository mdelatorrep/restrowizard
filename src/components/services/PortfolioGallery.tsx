import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const categoryLabels: Record<string, string> = {
  equipment: 'Equipamiento', technology: 'Tecnología', food_supplies: 'Ingredientes',
  consulting: 'Consultoría', design: 'Diseño', other: 'Otro',
};

interface PortfolioGalleryProps {
  items: any[];
}

const PortfolioGallery = ({ items }: PortfolioGalleryProps) => {
  const [selected, setSelected] = useState<any>(null);

  if (!items.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map(item => (
          <div key={item.id} className="group cursor-pointer relative rounded-lg overflow-hidden aspect-square bg-muted"
            onClick={() => setSelected(item)}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
                {item.title}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2">
              <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">{item.title}</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <div className="space-y-4">
              {selected.image_url && (
                <img src={selected.image_url} alt={selected.title} className="w-full rounded-lg max-h-96 object-contain" />
              )}
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              <div className="flex gap-2 text-xs text-muted-foreground">
                {selected.client_name && <span>Cliente: {selected.client_name}</span>}
                {selected.project_date && <span>• {format(new Date(selected.project_date), 'MMM yyyy', { locale: es })}</span>}
                {selected.category && <Badge variant="outline" className="text-xs">{categoryLabels[selected.category] || selected.category}</Badge>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PortfolioGallery;
