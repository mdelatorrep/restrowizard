 import { useState, useEffect, useMemo } from 'react';
 import { useParams } from 'react-router-dom';
 import { usePublicRestaurantData } from '@/hooks/usePublicRestaurantData';
 import { usePublicCart } from '@/hooks/usePublicCart';
 import { PublicHeader } from '@/components/public/PublicHeader';
 import { PublicFooter } from '@/components/public/PublicFooter';
 import { PublicLoadingState, PublicErrorState } from '@/components/public/PublicLoadingState';
 import { CartButton } from '@/components/public-website/DeliveryCart';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent } from '@/components/ui/card';
 import { Search, Truck, Plus, ShoppingCart, X, ChefHat } from 'lucide-react';
 import type { Tables } from '@/integrations/supabase/types';
 
 type MenuItemRow = Tables<'menu_items'>;
 
 export default function PublicDeliveryPage() {
   const { slug } = useParams<{ slug: string }>();
   const { data, loading, error, brandStyles } = usePublicRestaurantData(slug || '');
 
   const [menus, setMenus] = useState<Array<{ id: string; name: string }>>([]);
   const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
   const [items, setItems] = useState<MenuItemRow[]>([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [showCart, setShowCart] = useState(false);
 
   const cart = usePublicCart(data?.userId || '');
 
   useEffect(() => {
     if (data?.userId) {
       loadMenus();
       cart.loadZones();
     }
   }, [data?.userId]);
 
   useEffect(() => {
     if (selectedMenu) {
       loadMenuItems(selectedMenu);
     }
   }, [selectedMenu]);
 
   const loadMenus = async () => {
     if (!data?.userId) return;
     const { data: menuData } = await supabase
       .from('restaurant_menus')
       .select('id, name')
       .eq('user_id', data.userId)
       .eq('status', 'published');
 
     if (menuData && menuData.length > 0) {
       setMenus(menuData);
       setSelectedMenu(menuData[0].id);
     }
   };
 
   const loadMenuItems = async (menuId: string) => {
     const { data: itemsData } = await supabase
       .from('menu_items')
       .select('*')
       .eq('menu_id', menuId)
       .eq('is_available', true)
       .order('category')
       .order('sort_order');
 
     setItems(itemsData || []);
   };
 
   const filteredItems = useMemo(() => {
     if (!searchQuery) return items;
     const query = searchQuery.toLowerCase();
     return items.filter(item =>
       item.name.toLowerCase().includes(query) ||
       item.description?.toLowerCase().includes(query)
     );
   }, [items, searchQuery]);
 
   const groupedItems = useMemo(() => {
     return filteredItems.reduce((acc, item) => {
       if (!acc[item.category]) acc[item.category] = [];
       acc[item.category].push(item);
       return acc;
     }, {} as Record<string, MenuItemRow[]>);
   }, [filteredItems]);
 
   if (loading) return <PublicLoadingState />;
   if (error || !data) return <PublicErrorState type={error || 'not_found'} />;
 
   const { website, brand, profile, restaurantName } = data;
 
   if (!website?.show_delivery) {
     return <PublicErrorState type="not_found" message="El servicio de domicilios no está habilitado para este restaurante." />;
   }
 
   const primaryColor = brand.primary_color;
   const accentColor = brand.accent_color;
 
   return (
     <div className="min-h-screen flex flex-col bg-background" style={brandStyles}>
       <PublicHeader
         restaurantName={restaurantName}
         logoUrl={brand.logo_url}
         primaryFont={brand.primary_font}
         showMenu={website?.show_menu}
         showReservations={website?.show_reservations}
         showDelivery={website?.show_delivery}
         showLoyalty={website?.show_loyalty}
         showFeedback={website?.show_feedback}
         currentSection="domicilios"
       />
 
       {/* Hero */}
       <section className="bg-gradient-to-br from-green-500/10 via-background to-primary/10 py-12">
         <div className="container mx-auto px-4 text-center">
           <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
             <Truck className="w-10 h-10 text-green-600" />
           </div>
           <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: brand.primary_font || undefined }}>
             Pide a Domicilio
           </h1>
           <p className="text-xl text-muted-foreground max-w-xl mx-auto">
             {website.delivery_message || 'Disfruta de nuestros platos en la comodidad de tu hogar'}
           </p>
           {website.delivery_min_order && (
             <Badge variant="secondary" className="mt-4 text-sm px-4 py-1">
               Pedido mínimo: ${website.delivery_min_order.toLocaleString()}
             </Badge>
           )}
         </div>
       </section>
 
       {/* Search & Menu Selector */}
       <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
         <div className="container mx-auto px-4 py-4 space-y-3">
           <div className="relative max-w-md mx-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
             <Input
               type="text"
               placeholder="Buscar platillos..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 pr-10 h-12 rounded-full"
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted">
                 <X className="w-4 h-4 text-muted-foreground" />
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
         </div>
       </div>
 
       {/* Menu Items */}
       <main className="flex-1 container mx-auto px-4 py-8">
         {Object.keys(groupedItems).length === 0 ? (
           <div className="text-center py-16">
             <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
             <p className="text-lg text-muted-foreground">No se encontraron platillos</p>
           </div>
         ) : (
           <div className="space-y-10">
             {Object.entries(groupedItems).map(([category, categoryItems]) => (
               <section key={category}>
                 <h2 className="text-2xl font-bold mb-6 pb-3 border-b capitalize" style={{ fontFamily: brand.primary_font || undefined }}>
                   {category.replace(/_/g, ' ')}
                 </h2>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {categoryItems.map((item) => (
                     <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                       {item.image_url && (
                         <div className="aspect-video">
                           <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                         </div>
                       )}
                       <CardContent className="p-4">
                         <div className="flex justify-between items-start mb-2">
                           <h3 className="font-semibold">{item.name}</h3>
                           <span className="font-bold" style={{ color: accentColor }}>
                             ${item.price?.toLocaleString()}
                           </span>
                         </div>
                         {item.description && (
                           <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                         )}
                         <Button
                           size="sm"
                           className="w-full"
                           onClick={() => cart.addItem({
                             id: item.id,
                             name: item.name,
                             price: item.price || 0,
                             image_url: item.image_url || undefined,
                           })}
                         >
                           <Plus className="w-4 h-4 mr-1" /> Agregar
                         </Button>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               </section>
             ))}
           </div>
         )}
       </main>
 
       {/* Floating Cart Button */}
       {cart.items.length > 0 && (
         <div className="fixed bottom-6 right-6 z-50">
           <CartButton
             itemCount={cart.items.reduce((sum, i) => sum + i.quantity, 0)}
             total={cart.subtotal}
             onClick={() => setShowCart(true)}
           />
         </div>
       )}
 
       {/* Cart Sheet */}
       <Sheet open={showCart} onOpenChange={setShowCart}>
         <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
           <SheetHeader>
             <SheetTitle className="flex items-center gap-2">
               <ShoppingCart className="w-5 h-5" />
               Tu Pedido
             </SheetTitle>
           </SheetHeader>
           
           <div className="mt-6 space-y-4">
             {cart.items.length === 0 ? (
               <div className="text-center py-8">
                 <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">Tu carrito está vacío</p>
               </div>
             ) : (
               <>
                 {cart.items.map(item => (
                   <div key={item.id} className="flex gap-3 pb-4 border-b">
                     {item.image_url && (
                       <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded object-cover" />
                     )}
                     <div className="flex-1">
                       <div className="flex justify-between">
                         <span className="font-medium">{item.name}</span>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cart.removeItem(item.id)}>
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                       <p className="text-sm text-muted-foreground">${(item.price * item.quantity).toLocaleString()}</p>
                       <div className="flex items-center gap-2 mt-2">
                         <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}>
                           <span>-</span>
                         </Button>
                         <span className="w-6 text-center">{item.quantity}</span>
                         <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}>
                           <Plus className="w-3 h-3" />
                         </Button>
                       </div>
                     </div>
                   </div>
                 ))}
 
                 <div className="pt-4 space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Subtotal</span>
                     <span>${cart.subtotal.toLocaleString()}</span>
                   </div>
                   {cart.deliveryFee > 0 && (
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Domicilio</span>
                       <span>${cart.deliveryFee.toLocaleString()}</span>
                     </div>
                   )}
                   <div className="flex justify-between font-bold text-lg pt-2 border-t">
                     <span>Total</span>
                     <span>${cart.total.toLocaleString()}</span>
                   </div>
                 </div>
 
                 {!cart.minOrderMet && website.delivery_min_order && (
                   <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                     Pedido mínimo: ${website.delivery_min_order.toLocaleString()}
                   </p>
                 )}
 
                 <Button className="w-full" size="lg" disabled={!cart.minOrderMet} onClick={() => setShowCart(false)}>
                   Continuar
                 </Button>
               </>
             )}
           </div>
         </SheetContent>
       </Sheet>
 
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