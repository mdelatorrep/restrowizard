import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, ChefHat } from 'lucide-react';
import { usePublicMenuData } from '@/hooks/usePublicMenuData';
import { PublicMenuHero } from '@/components/public-menu/PublicMenuHero';
import { PublicMenuFilters } from '@/components/public-menu/PublicMenuFilters';
import { PublicMenuFeatured } from '@/components/public-menu/PublicMenuFeatured';
import { PublicMenuItemCard } from '@/components/public-menu/PublicMenuItemCard';
import type { SocialLinks } from '@/components/public-menu/publicMenuConstants';
import type { Tables } from '@/integrations/supabase/types';

type MenuItemRow = Tables<'menu_items'>;

const PublicMenu = () => {
  const { slug } = useParams();
  const { menu, items, brand, loading } = usePublicMenuData(slug);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const socialLinks = useMemo<SocialLinks>(() => {
    if (!brand?.social_links) return {};
    try { return brand.social_links as SocialLinks; } catch { return {}; }
  }, [brand?.social_links]);

  const categories = useMemo(() => [...new Set((items || []).map(i => i.category))], [items]);

  const filteredItems = useMemo(() => {
    let filtered = items || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    if (activeCategory) filtered = filtered.filter(i => i.category === activeCategory);
    if (activeFilters.length > 0) {
      filtered = filtered.filter(i => activeFilters.every(f => i.dietary_tags?.includes(f)));
    }
    return filtered;
  }, [items, searchQuery, activeCategory, activeFilters]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItemRow[]>);
  }, [filteredItems]);

  const featuredItems = useMemo(
    () => (items || []).filter(i => i.is_featured).slice(0, 3),
    [items]
  );

  const toggleFilter = (filter: string) =>
    setActiveFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);

  const primaryColor = brand?.primary_color || '#1a1a2e';
  const accentColor = brand?.accent_color || '#e94560';
  const secondaryColor = brand?.secondary_color || '#f8f9fa';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: `${primaryColor}20`, borderTopColor: accentColor }}
          />
          <p className="text-sm animate-pulse" style={{ color: primaryColor }}>Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
            <ChefHat className="w-12 h-12 text-white/60" />
          </div>
          <h1 className="text-3xl font-bold text-white">Menú no disponible</h1>
          <p className="text-white/60">Este menú no está publicado actualmente o el enlace es incorrecto.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: secondaryColor, fontFamily: brand?.font_secondary || 'system-ui, sans-serif' }}
    >
      <PublicMenuHero
        menu={menu}
        brand={brand}
        socialLinks={socialLinks}
        primaryColor={primaryColor}
        accentColor={accentColor}
        secondaryColor={secondaryColor}
      />

      <PublicMenuFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        primaryColor={primaryColor}
        accentColor={accentColor}
        secondaryColor={secondaryColor}
      />

      {featuredItems.length > 0 && !activeCategory && !searchQuery && activeFilters.length === 0 && (
        <PublicMenuFeatured
          items={featuredItems}
          primaryColor={primaryColor}
          accentColor={accentColor}
          fontPrimary={brand?.font_primary || undefined}
        />
      )}

      <main className="container mx-auto px-4 py-8">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${primaryColor}10` }}>
              <Search className="w-10 h-10" style={{ color: `${primaryColor}40` }} />
            </div>
            <p className="text-lg" style={{ color: `${primaryColor}60` }}>No se encontraron platillos</p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setActiveCategory(null); setActiveFilters([]); }}
              className="rounded-full"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <section key={category} id={category}>
                <h2
                  className="text-2xl md:text-3xl font-bold mb-6 capitalize flex items-center gap-3"
                  style={{ color: primaryColor, fontFamily: brand?.font_primary || undefined }}
                >
                  <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: accentColor }} />
                  {category.replace(/_/g, ' ')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryItems.map(item => (
                    <PublicMenuItemCard
                      key={item.id}
                      item={item}
                      primaryColor={primaryColor}
                      accentColor={accentColor}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 py-8 text-center" style={{ backgroundColor: primaryColor, color: 'white' }}>
        <div className="container mx-auto px-4 space-y-4">
          {brand?.logo_url && (
            <img src={brand.logo_url} alt={brand.brand_name} className="h-12 w-auto mx-auto opacity-80" />
          )}
          <p className="text-white/60 text-sm">{brand?.brand_name || menu.name}</p>
          <p className="text-white/40 text-xs">Menú digital creado con RestroWizard</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicMenu;
