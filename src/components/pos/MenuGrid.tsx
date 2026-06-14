import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { labelFor } from '@/lib/enumLabels';
import { formatCurrency } from '@/lib/formatCurrency';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
  is_available?: boolean;
}

interface MenuGridProps {
  items: MenuItem[];
  categories: (string | null | undefined)[];
  selectedCategory: string | null;
  onSelectCategory: (c: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddToCart: (item: MenuItem) => void;
  disabled?: boolean;
}

export const MenuGrid = ({
  items,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddToCart,
  disabled,
}: MenuGridProps) => {
  return (
    <div className="flex-1 flex flex-col border-r">
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={!selectedCategory ? 'default' : 'outline'}
              onClick={() => onSelectCategory(null)}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat ?? 'none'}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => onSelectCategory(cat || null)}
              >
                {labelFor('menu_category', cat ?? undefined)}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay productos disponibles</p>
            <p className="text-sm">Agrega productos desde el módulo de Menús</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'cursor-pointer hover:border-primary transition-colors',
                  disabled && 'opacity-50 pointer-events-none'
                )}
                onClick={() => onAddToCart(item)}
              >
                <CardContent className="p-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-20 object-cover rounded mb-2"
                    />
                  )}
                  <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                  <p className="text-primary font-bold mt-1">
                    {formatCurrency(Number(item.price))}
                  </p>
                  {item.category && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {labelFor('menu_category', item.category)}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
