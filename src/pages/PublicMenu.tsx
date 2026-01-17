import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BrandStyles {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  logo_url: string | null;
  brand_name: string;
}

const PublicMenu = () => {
  const { slug } = useParams();
  const [menu, setMenu] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [brand, setBrand] = useState<BrandStyles | null>(null);
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
        
        // Load menu items
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('menu_id', menuData.id)
          .eq('is_available', true)
          .order('sort_order');

        setItems(itemsData || []);

        // Load brand data for styling
        const { data: brandData } = await supabase
          .from('restaurant_brands')
          .select('primary_color, secondary_color, accent_color, font_primary, font_secondary, logo_url, brand_name')
          .eq('user_id', menuData.user_id)
          .maybeSingle();

        if (brandData) {
          setBrand(brandData as BrandStyles);
        }
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate CSS custom properties from brand colors
  const brandStyles = brand ? {
    '--brand-primary': brand.primary_color,
    '--brand-secondary': brand.secondary_color,
    '--brand-accent': brand.accent_color,
  } as React.CSSProperties : {};

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
    <div 
      className="min-h-screen py-8"
      style={{
        ...brandStyles,
        backgroundColor: brand?.secondary_color || '#f8fafc',
        fontFamily: brand?.font_secondary || 'Lato, sans-serif',
      }}
    >
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header with Brand */}
        <div className="text-center mb-8">
          {brand?.logo_url && (
            <img 
              src={brand.logo_url} 
              alt={brand.brand_name}
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
          )}
          <h1 
            className="text-4xl font-bold mb-2"
            style={{
              color: brand?.primary_color || '#1e293b',
              fontFamily: brand?.font_primary || 'Montserrat, sans-serif',
            }}
          >
            {menu.name}
          </h1>
          {menu.description && (
            <p 
              className="text-lg"
              style={{ color: brand?.primary_color ? `${brand.primary_color}99` : '#64748b' }}
            >
              {menu.description}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, categoryItems]: [string, any]) => (
            <Card 
              key={category}
              style={{
                borderColor: brand?.accent_color ? `${brand.accent_color}40` : undefined,
              }}
            >
              <CardHeader
                style={{
                  backgroundColor: brand?.primary_color ? `${brand.primary_color}08` : undefined,
                }}
              >
                <CardTitle 
                  className="text-2xl capitalize"
                  style={{
                    color: brand?.primary_color || '#1e293b',
                    fontFamily: brand?.font_primary || 'Montserrat, sans-serif',
                  }}
                >
                  {category.replace('_', ' ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryItems.map((item: any) => (
                    <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 
                            className="font-bold text-lg"
                            style={{ color: brand?.primary_color || '#1e293b' }}
                          >
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-gray-600 mt-1">{item.description}</p>
                          )}
                          <div className="flex space-x-2 mt-2">
                            {item.dietary_tags?.includes('vegetarian') && (
                              <Badge 
                                variant="outline"
                                style={{ borderColor: brand?.accent_color, color: brand?.accent_color }}
                              >
                                Vegetariano
                              </Badge>
                            )}
                            {item.dietary_tags?.includes('vegan') && (
                              <Badge 
                                variant="outline"
                                style={{ borderColor: brand?.accent_color, color: brand?.accent_color }}
                              >
                                Vegano
                              </Badge>
                            )}
                            {item.dietary_tags?.includes('gluten_free') && (
                              <Badge 
                                variant="outline"
                                style={{ borderColor: brand?.accent_color, color: brand?.accent_color }}
                              >
                                Sin Gluten
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.price && (
                          <div 
                            className="text-xl font-bold"
                            style={{ color: brand?.accent_color || '#7c3aed' }}
                          >
                            ${item.price.toFixed(2)}
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

        {/* Footer with brand */}
        {brand && (
          <div className="text-center mt-12 pt-8 border-t" style={{ borderColor: brand.accent_color ? `${brand.accent_color}30` : undefined }}>
            <p className="text-sm" style={{ color: brand.primary_color ? `${brand.primary_color}80` : '#94a3b8' }}>
              {brand.brand_name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;