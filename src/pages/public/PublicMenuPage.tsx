 import { useState, useEffect, useMemo } from 'react';
 import { useParams, Link } from 'react-router-dom';
 import { usePublicRestaurantData } from '@/hooks/usePublicRestaurantData';
 import { PublicHeader } from '@/components/public/PublicHeader';
 import { PublicFooter } from '@/components/public/PublicFooter';
 import { PublicLoadingState, PublicErrorState } from '@/components/public/PublicLoadingState';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
 import { Search, Leaf, Wheat, Star, ChefHat, Sparkles, X, ShoppingCart, Plus } from 'lucide-react';
 import type { Tables } from '@/integrations/supabase/types';
 
 type MenuItemRow = Tables<'menu_items'>;
 
 const DIETARY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
   vegetarian: { icon: <Leaf className="w-3.5 h-3.5" />, label: 'Vegetariano', color: 'text-green-500' },
   vegan: { icon: <Leaf className="w-3.5 h-3.5" />, label: 'Vegano', color: 'text-green-600' },
   gluten_free: { icon: <Wheat className="w-3.5 h-3.5" />, label: 'Sin Gluten', color: 'text-amber-600' },
 };
 
 export default function PublicMenuPage() {
   const { slug } = useParams<{ slug: string }>();
   const { data, loading, error, brandStyles } = usePublicRestaurantData(slug || '');
 
   const [menus, setMenus] = useState<Array<{ id: string; name: string }>>([]);
   const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
   const [items, setItems] = useState<MenuItemRow[]>([]);
   const [menuLoading, setMenuLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [activeCategory, setActiveCategory] = useState<string | null>(null);
   const [activeFilters, setActiveFilters] = useState<string[]>([]);
 
   useEffect(() => {
     if (data?.userId) {
       loadMenus();
     }
   }, [data?.userId]);
 
   useEffect(() => {
     if (selectedMenu) {
       loadMenuItems(selectedMenu);
     }
   }, [selectedMenu]);
 
   const loadMenus = async () => {
     if (!data?.userId) return;
     setMenuLoading(true);
     const { data: menuData } = await supabase
       .from('restaurant_menus')
       .select('id, name')
       .eq('user_id', data.userId)
       .eq('status', 'published');
 
     if (menuData && menuData.length > 0) {
       setMenus(menuData);
       setSelectedMenu(menuData[0].id);
     }
     setMenuLoading(false);
   };
 
   const loadMenuItems = async (menuId: string) => {
     const { data: itemsData } = await supabase
       .from('menu_items')
       .select('*')
       .eq('menu_id', menuId)
       .eq('is_available', true)
       .order('sort_order');
 
     setItems(itemsData || []);
   };
 
   const categories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);
 
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
         activeFilters.every(filter => (item.dietary_tags as string[] || []).includes(filter))
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
 
   const featuredItems = useMemo(() => items.filter(item => item.is_featured).slice(0, 3), [items]);
 
   const toggleFilter = (filter: string) => {
     setActiveFilters(prev =>
       prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
     );
   };
 
   if (loading) return <PublicLoadingState />;
   if (error || !data) return <PublicErrorState type={error || 'not_found'} />;
 
   const { website, brand, profile, restaurantName } = data;
 
   const primaryColor = brand.primary_color;
   const accentColor = brand.accent_color;
   const secondaryColor = brand.secondary_color;
 
   return (
     <div className="min-h-screen flex flex-col" style={{ ...brandStyles, backgroundColor: secondaryColor }}>
       <PublicHeader
         restaurantName={restaurantName}
         logoUrl={brand.logo_url}
         primaryFont={brand.primary_font}
         showMenu={website?.show_menu}
         showReservations={website?.show_reservations}
         showDelivery={website?.show_delivery}
         showLoyalty={website?.show_loyalty}
         showFeedback={website?.show_feedback}
         currentSection="menu"
       />
 
       {/* Hero Header */}
       <header className="relative overflow-hidden py-12" style={{ backgroundColor: primaryColor }}>
         <div className="absolute inset-0 opacity-10">
           <div className="absolute inset-0" style={{
             backgroundImage: `radial-gradient(circle at 20% 50%, ${accentColor} 0%, transparent 50%),
                              radial-gradient(circle at 80% 50%, ${accentColor} 0%, transparent 50%)`
           }} />
         </div>
         <div className="relative z-10 container mx-auto px-4 text-center">
           {brand.logo_url && (
             <img src={brand.logo_url} alt={restaurantName} className="h-16 md:h-20 w-auto mx-auto mb-4" />
           )}
           <h1 className="text-3xl md:text-5xl font-bold text-white" style={{ fontFamily: brand.primary_font || undefined }}>
             Menú Digital
           </h1>
           {brand.tagline && <p className="text-white/70 mt-2">{brand.tagline}</p>}
         </div>
       </header>
 
       {/* Search & Filters */}
       <div className="sticky top-16 z-40 border-b backdrop-blur-lg" style={{ backgroundColor: `${secondaryColor}ee` }}>
         <div className="container mx-auto px-4 py-4 space-y-3">
           <div className="relative max-w-md mx-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: `${primaryColor}60` }} />
             <Input
               type="text"
               placeholder="Buscar en el menú..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 pr-10 h-12 rounded-full border-2"
               style={{ borderColor: `${primaryColor}20` }}
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5">
                 <X className="w-4 h-4" style={{ color: `${primaryColor}60` }} />
               </button>
             )}
           </div>
 
           {menus.length > 1 && (
             <div className="flex justify-center gap-2">
               {menus.map(menu => (
                 <Button
                   key={menu.id}
                   variant={selectedMenu === menu.id ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => setSelectedMenu(menu.id)}
                   className="rounded-full"
                 >
                   {menu.name}
                 </Button>
               ))}
             </div>
           )}
 
           <ScrollArea className="w-full">
             <div className="flex gap-2 pb-2 justify-center">
               <Button
                 variant={activeCategory === null ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setActiveCategory(null)}
                 className="rounded-full whitespace-nowrap"
                 style={activeCategory === null ? { backgroundColor: accentColor, color: 'white' } : {}}
               >
                 <Sparkles className="w-4 h-4 mr-1.5" />Todo
               </Button>
               {categories.map(category => (
                 <Button
                   key={category}
                   variant={activeCategory === category ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => setActiveCategory(category)}
                   className="rounded-full whitespace-nowrap capitalize"
                   style={activeCategory === category ? { backgroundColor: accentColor, color: 'white' } : {}}
                 >
                   {category.replace(/_/g, ' ')}
                 </Button>
               ))}
             </div>
             <ScrollBar orientation="horizontal" />
           </ScrollArea>
 
           <div className="flex gap-2 justify-center">
             {Object.entries(DIETARY_ICONS).map(([key, { icon, label, color }]) => (
               <button
                 key={key}
                 onClick={() => toggleFilter(key)}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                   activeFilters.includes(key) ? 'ring-2 ring-offset-1' : 'hover:bg-black/5'
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
             <h2 className="text-2xl font-bold" style={{ color: primaryColor, fontFamily: brand.primary_font || undefined }}>
               Destacados
             </h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {featuredItems.map((item) => (
               <div key={item.id} className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white">
                 {item.image_url ? (
                   <div className="aspect-[4/3] overflow-hidden">
                     <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   </div>
                 ) : (
                   <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}08` }}>
                     <ChefHat className="w-16 h-16" style={{ color: `${primaryColor}20` }} />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                 <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                   <div className="flex items-start justify-between gap-3">
                     <div>
                       <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                       {item.description && <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>}
                     </div>
                     {item.price && (
                       <span className="text-xl font-bold px-3 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }}>
                         ${item.price.toLocaleString()}
                       </span>
                     )}
                   </div>
                 </div>
                 <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: accentColor, color: 'white' }}>
                   <Star className="w-3 h-3 fill-current" />Destacado
                 </div>
               </div>
             ))}
           </div>
         </section>
       )}
 
       {/* Menu Items */}
       <main className="container mx-auto px-4 py-8 flex-1">
         {Object.keys(groupedItems).length === 0 ? (
           <div className="text-center py-16 space-y-4">
             <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${primaryColor}10` }}>
               <Search className="w-10 h-10" style={{ color: `${primaryColor}40` }} />
             </div>
             <p className="text-lg" style={{ color: `${primaryColor}60` }}>No se encontraron platillos</p>
             <Button variant="outline" onClick={() => { setSearchQuery(''); setActiveCategory(null); setActiveFilters([]); }} className="rounded-full">
               Limpiar filtros
             </Button>
           </div>
         ) : (
           <div className="space-y-12">
             {Object.entries(groupedItems).map(([category, categoryItems]) => (
               <section key={category}>
                 <h2 className="text-2xl font-bold mb-6 pb-3 border-b capitalize" style={{ color: primaryColor, fontFamily: brand.primary_font || undefined }}>
                   {category.replace(/_/g, ' ')}
                 </h2>
                 <div className="grid gap-4">
                   {categoryItems.map((item) => (
                     <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                       {item.image_url && (
                         <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                       )}
                       <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between gap-2">
                           <div>
                             <h3 className="font-semibold text-lg">{item.name}</h3>
                             {(item.dietary_tags as string[] || []).length > 0 && (
                               <div className="flex gap-1 mt-1">
                                 {(item.dietary_tags as string[]).map(tag => (
                                   <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                 ))}
                               </div>
                             )}
                           </div>
                           <span className="font-bold text-lg flex-shrink-0" style={{ color: accentColor }}>
                             ${item.price?.toLocaleString()}
                           </span>
                         </div>
                         {item.description && <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>}
                       </div>
                     </div>
                   ))}
                 </div>
               </section>
             ))}
           </div>
         )}
       </main>
 
       {/* CTA to Delivery */}
       {website?.show_delivery && (
         <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
           <div className="container mx-auto flex justify-center">
             <Button size="lg" asChild>
               <Link to={`/r/${slug}/domicilios`}>
                 <ShoppingCart className="w-5 h-5 mr-2" />
                 Pedir a Domicilio
               </Link>
             </Button>
           </div>
         </div>
       )}
 
       <PublicFooter
         restaurantName={restaurantName}
         logoUrl={brand.logo_url}
         socialLinks={brand.social_links}
         phone={profile?.phone}
         showMenu={website?.show_menu}
         showReservations={website?.show_reservations}
         showDelivery={website?.show_delivery}
         showLoyalty={website?.show_loyalty}
       />
     </div>
   );
 }