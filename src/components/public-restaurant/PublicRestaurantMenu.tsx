import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';
import type { PublicMenuList, PublicMenuItem } from '@/hooks/usePublicRestaurantMenus';

interface Props {
  website: PublicWebsiteData;
  menus: PublicMenuList[];
  menuItems: PublicMenuItem[];
  selectedMenu: string | null;
  onSelectMenu: (id: string) => void;
  onAddToCart: (item: PublicMenuItem) => void;
}

export const PublicRestaurantMenu = ({ website, menus, menuItems, selectedMenu, onSelectMenu, onAddToCart }: Props) => {
  const brand = website.brand;
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PublicMenuItem[]>);

  return (
    <section id="menu" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: brand?.primary_font }}>
          {website.show_delivery ? 'Pide a Domicilio' : 'Nuestro Menú'}
        </h2>

        {website.show_delivery && website.delivery_message && (
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{website.delivery_message}</p>
        )}

        {website.show_delivery && website.delivery_min_order && (
          <div className="flex justify-center mb-8">
            <Badge variant="secondary" className="text-sm px-4 py-1">
              Pedido mínimo: ${website.delivery_min_order.toLocaleString()}
            </Badge>
          </div>
        )}

        {menus.length > 1 && (
          <div className="flex justify-center gap-4 mb-8">
            {menus.map(menu => (
              <Button key={menu.id} variant={selectedMenu === menu.id ? 'default' : 'outline'} onClick={() => onSelectMenu(menu.id)}>
                {menu.name}
              </Button>
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-12">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-2xl font-semibold mb-6 pb-2 border-b">{category}</h3>
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{item.name}</h4>
                          {item.dietary_tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {item.dietary_tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>
                            ${item.price.toLocaleString()}
                          </span>
                          {website.show_delivery && (
                            <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onAddToCart(item)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {item.description && <p className="text-muted-foreground mt-2">{item.description}</p>}
                      {website.show_delivery && (
                        <Button size="sm" variant="ghost" className="mt-2 md:hidden" onClick={() => onAddToCart(item)}>
                          <Plus className="h-4 w-4 mr-1" /> Agregar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
