import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Search, 
  Leaf, 
  Wheat, 
  Flame, 
  Star, 
  Clock, 
  ChefHat,
  Sparkles,
  Heart,
  X,
  Instagram,
  Facebook,
  Globe
} from 'lucide-react';
import type { Tables, Json } from '@/integrations/supabase/types';

type MenuItemRow = Tables<'menu_items'>;
type RestaurantBrandRow = Tables<'restaurant_brands'>;

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
}

const DIETARY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  vegetarian: { icon: <Leaf className="w-3.5 h-3.5" />, label: 'Vegetariano', color: 'text-green-500' },
  vegan: { icon: <Leaf className="w-3.5 h-3.5" />, label: 'Vegano', color: 'text-green-600' },
  gluten_free: { icon: <Wheat className="w-3.5 h-3.5" />, label: 'Sin Gluten', color: 'text-amber-600' },
};

const PublicMenu = () => {
  const { slug } = useParams();
  const [menu, setMenu] = useState<Tables<'restaurant_menus'> | null>(null);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [brand, setBrand] = useState<RestaurantBrandRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

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
        .maybeSingle();

      if (menuData) {
        setMenu(menuData);
        
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('menu_id', menuData.id)
          .eq('is_available', true)
          .order('sort_order');

        setItems(itemsData || []);

        const { data: brandData } = await supabase
          .from('restaurant_brands')
          .select('*')
          .eq('user_id', menuData.user_id)
          .maybeSingle();

        if (brandData) {
          setBrand(brandData);
        }
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const socialLinks = useMemo((): SocialLinks => {
    if (!brand?.social_links) return {};
    try {
      return brand.social_links as SocialLinks;
    } catch {
      return {};
    }
  }, [brand?.social_links]);

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(item => item.category))];
    return cats;
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query)
      );
    }

    if (activeCategory) {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    if (activeFilters.length > 0) {
      filtered = filtered.filter(item => 
        activeFilters.every(filter => item.dietary_tags?.includes(filter))
      );
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

  const featuredItems = useMemo(() => {
    return items.filter(item => item.is_featured).slice(0, 3);
  }, [items]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Dynamic brand colors
  const primaryColor = brand?.primary_color || '#1a1a2e';
  const accentColor = brand?.accent_color || '#e94560';
  const secondaryColor = brand?.secondary_color || '#f8f9fa';

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: secondaryColor }}
      >
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
          <p className="text-white/60">
            Este menú no está publicado actualmente o el enlace es incorrecto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: secondaryColor,
        fontFamily: brand?.font_secondary || 'system-ui, sans-serif'
      }}
    >
      {/* Hero Header */}
      <header 
        className="relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, ${accentColor} 0%, transparent 50%), 
                               radial-gradient(circle at 80% 50%, ${accentColor} 0%, transparent 50%)`
            }}
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col items-center text-center space-y-4">
            {brand?.logo_url && (
              <div className="relative">
                <div 
                  className="absolute inset-0 blur-2xl opacity-50"
                  style={{ backgroundColor: accentColor }}
                />
                <img 
                  src={brand.logo_url} 
                  alt={brand.brand_name}
                  className="relative h-20 md:h-28 w-auto object-contain drop-shadow-2xl"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <h1 
                className="text-3xl md:text-5xl font-bold tracking-tight text-white"
                style={{ fontFamily: brand?.font_primary || 'system-ui, sans-serif' }}
              >
                {menu.name}
              </h1>
              {menu.description && (
                <p className="text-white/70 text-lg max-w-xl mx-auto">
                  {menu.description}
                </p>
              )}
              {brand?.tagline && (
                <p className="text-white/50 text-sm italic">
                  {brand.tagline}
                </p>
              )}
            </div>

            {/* Social links */}
            <div className="flex gap-3 pt-2">
              {socialLinks.instagram && (
                <a 
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
              )}
              {socialLinks.facebook && (
                <a 
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-white" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill={secondaryColor}
            />
          </svg>
        </div>
      </header>

      {/* Search & Filters - Sticky */}
      <div 
        className="sticky top-0 z-40 border-b backdrop-blur-lg"
        style={{ 
          backgroundColor: `${secondaryColor}ee`,
          borderColor: `${primaryColor}10`
        }}
      >
        <div className="container mx-auto px-4 py-4 space-y-3">
          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: `${primaryColor}60` }}
            />
            <Input
              type="text"
              placeholder="Buscar en el menú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-full border-2 transition-all focus:ring-2"
              style={{ 
                borderColor: `${primaryColor}20`,
                backgroundColor: 'white'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5"
              >
                <X className="w-4 h-4" style={{ color: `${primaryColor}60` }} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2 justify-center">
              <Button
                variant={activeCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(null)}
                className="rounded-full whitespace-nowrap transition-all"
                style={activeCategory === null ? {
                  backgroundColor: accentColor,
                  color: 'white'
                } : {
                  borderColor: `${primaryColor}30`,
                  color: primaryColor
                }}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Todo
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="rounded-full whitespace-nowrap transition-all capitalize"
                  style={activeCategory === category ? {
                    backgroundColor: accentColor,
                    color: 'white'
                  } : {
                    borderColor: `${primaryColor}30`,
                    color: primaryColor
                  }}
                >
                  {category.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Dietary filters */}
          <div className="flex gap-2 justify-center">
            {Object.entries(DIETARY_ICONS).map(([key, { icon, label, color }]) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilters.includes(key) 
                    ? 'ring-2 ring-offset-1' 
                    : 'hover:bg-black/5'
                }`}
                style={{
                  backgroundColor: activeFilters.includes(key) ? `${accentColor}15` : 'transparent',
                  color: activeFilters.includes(key) ? accentColor : `${primaryColor}80`
                }}
              >
                <span className={color}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Items */}
      {featuredItems.length > 0 && !activeCategory && !searchQuery && activeFilters.length === 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-6 h-6" style={{ color: accentColor }} />
            <h2 
              className="text-2xl font-bold"
              style={{ color: primaryColor, fontFamily: brand?.font_primary || undefined }}
            >
              Destacados
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <div 
                key={item.id}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ backgroundColor: 'white' }}
              >
                {item.image_url ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div 
                    className="aspect-[4/3] flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}08` }}
                  >
                    <ChefHat className="w-16 h-16" style={{ color: `${primaryColor}20` }} />
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    {item.price && (
                      <span 
                        className="text-xl font-bold px-3 py-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: accentColor }}
                      >
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Featured badge */}
                <div 
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                  style={{ backgroundColor: accentColor, color: 'white' }}
                >
                  <Star className="w-3 h-3 fill-current" />
                  Destacado
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Items by Category */}
      <main className="container mx-auto px-4 py-8">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <Search className="w-10 h-10" style={{ color: `${primaryColor}40` }} />
            </div>
            <p className="text-lg" style={{ color: `${primaryColor}60` }}>
              No se encontraron platillos
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setActiveCategory(null);
                setActiveFilters([]);
              }}
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
                  <span 
                    className="w-1.5 h-8 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  {category.replace(/_/g, ' ')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryItems.map((item) => (
                    <article 
                      key={item.id}
                      className="group flex gap-4 p-4 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 border"
                      style={{ borderColor: `${primaryColor}08` }}
                    >
                      {/* Image */}
                      {item.image_url ? (
                        <div className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden">
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div 
                          className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}05` }}
                        >
                          <ChefHat className="w-10 h-10" style={{ color: `${primaryColor}15` }} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 
                                className="font-bold text-lg"
                                style={{ color: primaryColor }}
                              >
                                {item.name}
                              </h3>
                              {item.is_new && (
                                <Badge 
                                  className="text-[10px] px-1.5 py-0"
                                  style={{ backgroundColor: '#10b981', color: 'white' }}
                                >
                                  NUEVO
                                </Badge>
                              )}
                              {item.is_bestseller && (
                                <Badge 
                                  className="text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                                  style={{ backgroundColor: '#f59e0b', color: 'white' }}
                                >
                                  <Heart className="w-2.5 h-2.5 fill-current" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {item.price !== null && (
                            <span 
                              className="font-bold text-lg flex-shrink-0"
                              style={{ color: accentColor }}
                            >
                              ${item.price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p 
                            className="text-sm mt-1 line-clamp-2 flex-1"
                            style={{ color: `${primaryColor}70` }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-auto pt-2 flex-wrap">
                          {/* Dietary tags */}
                          {item.dietary_tags?.map(tag => {
                            const tagInfo = DIETARY_ICONS[tag];
                            if (!tagInfo) return null;
                            return (
                              <span 
                                key={tag} 
                                className={`flex items-center gap-1 text-xs ${tagInfo.color}`}
                                title={tagInfo.label}
                              >
                                {tagInfo.icon}
                                <span className="hidden sm:inline">{tagInfo.label}</span>
                              </span>
                            );
                          })}

                          {/* Spicy level */}
                          {item.spicy_level && item.spicy_level > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-orange-500" title={`Nivel de picante: ${item.spicy_level}`}>
                              {[...Array(item.spicy_level)].map((_, i) => (
                                <Flame key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </span>
                          )}

                          {/* Prep time */}
                          {item.preparation_time_minutes && (
                            <span 
                              className="flex items-center gap-1 text-xs"
                              style={{ color: `${primaryColor}50` }}
                            >
                              <Clock className="w-3 h-3" />
                              {item.preparation_time_minutes} min
                            </span>
                          )}

                          {/* Calories */}
                          {item.calories && (
                            <span 
                              className="text-xs"
                              style={{ color: `${primaryColor}50` }}
                            >
                              {item.calories} kcal
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="mt-12 py-8 text-center"
        style={{ 
          backgroundColor: primaryColor,
          color: 'white'
        }}
      >
        <div className="container mx-auto px-4 space-y-4">
          {brand?.logo_url && (
            <img 
              src={brand.logo_url} 
              alt={brand.brand_name}
              className="h-12 w-auto mx-auto opacity-80"
            />
          )}
          <p className="text-white/60 text-sm">
            {brand?.brand_name || menu.name}
          </p>
          <p className="text-white/40 text-xs">
            Menú digital creado con RestroWizard
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicMenu;
