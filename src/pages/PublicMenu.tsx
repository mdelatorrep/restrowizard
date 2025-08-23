import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PublicMenu = () => {
  const { slug } = useParams();
  const [menu, setMenu] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadMenu();
    }
  }, [slug]);

  const loadMenu = async () => {
    try {
      const { data: menuData } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('public_url_slug', slug)
        .eq('status', 'published')
        .single();

      if (menuData) {
        setMenu(menuData);
        
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('menu_id', menuData.id)
          .eq('is_available', true)
          .order('sort_order');

        setItems(itemsData || []);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-medium"></div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Menú no encontrado</h1>
          <p className="text-slate-medium">Este menú no está disponible o no existe.</p>
        </div>
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-light py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-lato-bold text-slate-dark mb-2">{menu.name}</h1>
          {menu.description && (
            <p className="text-lg text-slate-medium">{menu.description}</p>
          )}
        </div>

        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, categoryItems]: [string, any]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-2xl font-lato-bold capitalize">
                  {category.replace('_', ' ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryItems.map((item: any) => (
                    <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-lato-bold text-lg text-slate-dark">{item.name}</h3>
                          {item.description && (
                            <p className="text-slate-medium mt-1">{item.description}</p>
                          )}
                          <div className="flex space-x-2 mt-2">
                            {item.is_vegetarian && <Badge variant="outline">Vegetariano</Badge>}
                            {item.is_vegan && <Badge variant="outline">Vegano</Badge>}
                            {item.is_gluten_free && <Badge variant="outline">Sin Gluten</Badge>}
                          </div>
                        </div>
                        {item.price && (
                          <div className="text-xl font-lato-bold text-purple-medium">
                            €{item.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicMenu;