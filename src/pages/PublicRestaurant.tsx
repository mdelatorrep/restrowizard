import { useParams } from 'react-router-dom';
import { usePublicWebsite, PublicWebsiteData } from '@/hooks/useRestaurantWebsite';
import { usePublicReservation } from '@/hooks/useReservations';
import { usePublicCart } from '@/hooks/usePublicCart';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DeliveryCart, CartButton } from '@/components/public-website/DeliveryCart';
import { PublicReservationWidget } from '@/components/reservations/PublicReservationWidget';
import { 
  Phone, Mail, MapPin, Clock, Calendar, Users, 
  Facebook, Instagram, Twitter, Globe, ChevronDown,
  Utensils, Star, Heart, ShoppingCart, Plus, Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  dietary_tags: string[];
}

interface RestaurantMenu {
  id: string;
  name: string;
  description: string | null;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export default function PublicRestaurant() {
  const { slug } = useParams<{ slug: string }>();
  const { data: website, loading, error } = usePublicWebsite(slug || '');
  const { createPublicReservation, loading: reservationLoading } = usePublicReservation();
  
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  
  // Cart hook - initialized with website user_id
  const cart = usePublicCart(website?.user_id || '');

  useEffect(() => {
    if (website?.user_id && website.show_menu) {
      loadMenus(website.user_id);
    }
    // Load delivery zones if delivery is enabled
    if (website?.user_id && website.show_delivery) {
      cart.loadZones();
    }
  }, [website?.user_id, website?.show_menu, website?.show_delivery]);

  useEffect(() => {
    if (selectedMenu) {
      loadMenuItems(selectedMenu);
    }
  }, [selectedMenu]);

  const loadMenus = async (userId: string) => {
    const { data } = await supabase
      .from('restaurant_menus')
      .select('id, name, description')
      .eq('user_id', userId)
      .eq('status', 'published');
    
    if (data && data.length > 0) {
      setMenus(data);
      setSelectedMenu(data[0].id);
    }
  };

  const loadMenuItems = async (menuId: string) => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', menuId)
      .eq('is_available', true)
      .order('category')
      .order('sort_order');
    
    if (data) {
      setMenuItems(data.map(item => ({
        ...item,
        dietary_tags: (item.dietary_tags as string[]) || [],
      })));
    }
  };

  const handleReservationSubmit = async (data: {
    customer_name: string;
    customer_email?: string;
    customer_phone: string;
    party_size: number;
    reservation_date: string;
    reservation_time: string;
    special_requests?: string;
  }) => {
    if (!website?.user_id) return null;
    
    return await createPublicReservation(website.user_id, data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error === 'not_found' || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Utensils className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Restaurante no encontrado</h1>
            <p className="text-muted-foreground">
              El restaurante que buscas no existe o no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brand = website.brand;
  const profile = website.profile;
  const restaurantName = website.site_title || brand?.brand_name || profile?.restaurant_name || 'Restaurante';
  
  // Build CSS variables from brand
  const brandStyles: React.CSSProperties = {
    '--brand-primary': brand?.primary_color || 'hsl(var(--primary))',
    '--brand-secondary': brand?.secondary_color || 'hsl(var(--secondary))',
    '--brand-accent': brand?.accent_color || 'hsl(var(--accent))',
  } as React.CSSProperties;

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const socialLinks = brand?.social_links || {};

  return (
    <div className="min-h-screen bg-background" style={brandStyles}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {brand?.logo_url && (
                <img src={brand.logo_url} alt={restaurantName} className="h-10 w-auto" />
              )}
              <span className="font-bold text-xl" style={{ fontFamily: brand?.primary_font }}>
                {restaurantName}
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#inicio" className="text-sm hover:text-primary transition-colors">Inicio</a>
              {website.show_about && <a href="#nosotros" className="text-sm hover:text-primary transition-colors">Nosotros</a>}
              {website.show_menu && <a href="#menu" className="text-sm hover:text-primary transition-colors">Menú</a>}
              {website.show_delivery && <a href="#menu" className="text-sm hover:text-primary transition-colors flex items-center gap-1"><Truck className="h-4 w-4" />Pedir</a>}
              {website.show_gallery && <a href="#galeria" className="text-sm hover:text-primary transition-colors">Galería</a>}
              {website.show_reservations && <a href="#reservas" className="text-sm hover:text-primary transition-colors">Reservas</a>}
              {website.show_contact && <a href="#contacto" className="text-sm hover:text-primary transition-colors">Contacto</a>}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="relative min-h-[70vh] flex items-center justify-center">
        {website.hero_image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${website.hero_image_url})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}
        {!website.hero_image_url && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg"
            style={{ fontFamily: brand?.primary_font }}
          >
            {website.hero_title || restaurantName}
          </h1>
          {(website.hero_subtitle || brand?.tagline) && (
            <p className="text-xl md:text-2xl text-white/90 mb-8" style={{ fontFamily: brand?.secondary_font }}>
              {website.hero_subtitle || brand?.tagline}
            </p>
          )}
          <div className="flex flex-wrap gap-4 justify-center">
            {website.hero_cta_text && (
              <Button size="lg" className="text-lg px-8" asChild>
                <a href={website.hero_cta_link || '#menu'}>{website.hero_cta_text}</a>
              </Button>
            )}
            {website.show_reservations && (
              <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                <a href="#reservas">
                  <Calendar className="w-5 h-5 mr-2" />
                  Reservar mesa
                </a>
              </Button>
            )}
          </div>
        </div>
        
        <a href="#nosotros" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-white" />
        </a>
      </section>

      {/* About Section */}
      {website.show_about && (
        <section id="nosotros" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: brand?.primary_font }}>
                  {website.about_title || 'Nuestra Historia'}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {website.about_description || 'Bienvenidos a nuestro restaurante. Cada plato cuenta una historia de pasión, tradición y los mejores ingredientes.'}
                </p>
              </div>
              {website.about_image_url && (
                <div className="rounded-lg overflow-hidden shadow-xl">
                  <img src={website.about_image_url} alt="Sobre nosotros" className="w-full h-80 object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Menu Section */}
      {website.show_menu && menus.length > 0 && (
        <section id="menu" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: brand?.primary_font }}>
              {website.show_delivery ? 'Pide a Domicilio' : 'Nuestro Menú'}
            </h2>
            
            {website.show_delivery && website.delivery_message && (
              <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                {website.delivery_message}
              </p>
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
                  <Button
                    key={menu.id}
                    variant={selectedMenu === menu.id ? 'default' : 'outline'}
                    onClick={() => setSelectedMenu(menu.id)}
                  >
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
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-lg">{item.name}</h4>
                              {item.dietary_tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {item.dietary_tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>
                                ${item.price.toLocaleString()}
                              </span>
                              {website.show_delivery && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => cart.addItem({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    image_url: item.image_url || undefined,
                                  })}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-muted-foreground mt-2">{item.description}</p>
                          )}
                          {website.show_delivery && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 md:hidden"
                              onClick={() => cart.addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image_url: item.image_url || undefined,
                              })}
                            >
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
      )}

      {/* Gallery Section */}
      {website.show_gallery && website.gallery_images.length > 0 && (
        <section id="galeria" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
              Galería
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {website.gallery_images.map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden shadow-lg">
                  <img src={img} alt={`Galería ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hours Section */}
      {Object.keys(website.business_hours).length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
              Horarios
            </h2>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {DAYS.map(day => {
                    const hours = website.business_hours[day];
                    return (
                      <div key={day} className="flex justify-between items-center">
                        <span className="font-medium">{DAY_NAMES[day]}</span>
                        <span className="text-muted-foreground">
                          {hours?.closed ? 'Cerrado' : hours ? `${hours.open} - ${hours.close}` : 'No definido'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Reservations Section - Premium Widget */}
      {website.show_reservations && (
        <section id="reservas" className="py-20 bg-gradient-to-br from-muted/50 via-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: brand?.primary_font }}>
                Reserva tu mesa
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Asegura tu lugar en {restaurantName}. Reserva en segundos y recibe confirmación instantánea.
              </p>
            </div>
            
            <PublicReservationWidget
              restaurantName={restaurantName}
              restaurantLogo={brand?.logo_url}
              primaryColor={brand?.primary_color || 'hsl(var(--primary))'}
              accentColor={brand?.accent_color || brand?.secondary_color || 'hsl(var(--primary))'}
              maxPartySize={website.reservation_max_party_size}
              onSubmit={handleReservationSubmit}
              loading={reservationLoading}
            />
          </div>
        </section>
      )}

      {/* Contact Section */}
      {website.show_contact && (
        <section id="contacto" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
              Contacto
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {profile?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p>{profile.address}</p>
                    </div>
                  )}
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <a href={`tel:${profile.phone}`} className="hover:text-primary transition-colors">
                    {profile.phone}
                  </a>
                </div>
              )}
              
              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="flex gap-4">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.website && (
                      <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Map placeholder */}
          <Card className="overflow-hidden">
            <div className="h-full min-h-[300px] bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Mapa próximamente</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )}

  {/* Footer */}
  <footer className="bg-muted/50 py-8 border-t">
    <div className="container mx-auto px-4 text-center">
      <div className="flex items-center justify-center gap-3 mb-4">
        {brand?.logo_url && (
          <img src={brand.logo_url} alt={restaurantName} className="h-8 w-auto" />
        )}
        <span className="font-semibold">{restaurantName}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} {restaurantName}. Todos los derechos reservados.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Potenciado por RestroWizard
      </p>
    </div>
  </footer>

  {/* Delivery Cart */}
  {website.show_delivery && (
    <>
      <CartButton itemCount={cart.itemCount} total={cart.total} onClick={() => setShowCart(true)} />
      <DeliveryCart
        items={cart.items}
        zones={cart.zones}
        selectedZone={cart.deliveryZone}
        subtotal={cart.subtotal}
        deliveryFee={cart.deliveryFee}
        total={cart.total}
        minOrderMet={cart.minOrderMet}
        minOrderAmount={cart.deliveryZone?.min_order}
        submitting={cart.submitting}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onUpdateNotes={cart.updateNotes}
        onSelectZone={cart.setDeliveryZone}
        onSubmit={cart.submitOrder}
        onClose={() => setShowCart(false)}
      />
    </>
  )}
</div>
);
}
