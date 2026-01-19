import { useParams } from 'react-router-dom';
import { usePublicWebsite, PublicWebsiteData } from '@/hooks/useRestaurantWebsite';
import { usePublicReservation } from '@/hooks/useReservations';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, Mail, MapPin, Clock, Calendar, Users, 
  Facebook, Instagram, Twitter, Globe, ChevronDown,
  Utensils, Star, Heart
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
  const [activeSection, setActiveSection] = useState('inicio');
  
  // Reservation form
  const [reservationForm, setReservationForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    party_size: 2,
    reservation_date: '',
    reservation_time: '',
    special_requests: '',
  });
  const [reservationSuccess, setReservationSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (website?.user_id && website.show_menu) {
      loadMenus(website.user_id);
    }
  }, [website?.user_id, website?.show_menu]);

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

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website?.user_id) return;
    
    const code = await createPublicReservation(website.user_id, {
      ...reservationForm,
      party_size: Number(reservationForm.party_size),
    });
    
    if (code) {
      setReservationSuccess(code);
      setReservationForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        party_size: 2,
        reservation_date: '',
        reservation_time: '',
        special_requests: '',
      });
    }
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
          {website.hero_cta_text && (
            <Button size="lg" className="text-lg px-8" asChild>
              <a href={website.hero_cta_link || '#menu'}>{website.hero_cta_text}</a>
            </Button>
          )}
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
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
              Nuestro Menú
            </h2>
            
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
                      <div key={item.id} className="flex gap-4">
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
                            <span className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>
                              ${item.price.toLocaleString()}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-muted-foreground mt-2">{item.description}</p>
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

      {/* Reservations Section */}
      {website.show_reservations && (
        <section id="reservas" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
              Reservaciones
            </h2>
            
            <Card className="max-w-xl mx-auto">
              <CardContent className="pt-6">
                {reservationSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">¡Reserva Confirmada!</h3>
                    <p className="text-muted-foreground mb-4">Tu código de confirmación es:</p>
                    <p className="text-3xl font-mono font-bold text-primary">{reservationSuccess}</p>
                    <Button className="mt-6" onClick={() => setReservationSuccess(null)}>
                      Hacer otra reserva
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleReservationSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nombre *</label>
                        <Input
                          required
                          value={reservationForm.customer_name}
                          onChange={e => setReservationForm(prev => ({ ...prev, customer_name: e.target.value }))}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Teléfono *</label>
                        <Input
                          required
                          value={reservationForm.customer_phone}
                          onChange={e => setReservationForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                          placeholder="+57 300 123 4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={reservationForm.customer_email}
                        onChange={e => setReservationForm(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="tu@email.com"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Fecha *</label>
                        <Input
                          type="date"
                          required
                          min={format(new Date(), 'yyyy-MM-dd')}
                          value={reservationForm.reservation_date}
                          onChange={e => setReservationForm(prev => ({ ...prev, reservation_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Hora *</label>
                        <Input
                          type="time"
                          required
                          value={reservationForm.reservation_time}
                          onChange={e => setReservationForm(prev => ({ ...prev, reservation_time: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Personas *</label>
                        <Input
                          type="number"
                          required
                          min={1}
                          max={website.reservation_max_party_size}
                          value={reservationForm.party_size}
                          onChange={e => setReservationForm(prev => ({ ...prev, party_size: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Peticiones especiales</label>
                      <Textarea
                        value={reservationForm.special_requests}
                        onChange={e => setReservationForm(prev => ({ ...prev, special_requests: e.target.value }))}
                        placeholder="Alergias, ocasiones especiales, preferencias de mesa..."
                        rows={3}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg" disabled={reservationLoading}>
                      {reservationLoading ? 'Procesando...' : 'Confirmar Reserva'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
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
            
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {profile?.address && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Dirección</p>
                        <p className="text-muted-foreground">{profile.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile?.phone && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Teléfono</p>
                        <a href={`tel:${profile.phone}`} className="text-muted-foreground hover:text-primary">
                          {profile.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Social Links */}
                  {Object.keys(socialLinks).length > 0 && (
                    <div className="pt-4">
                      <Separator className="mb-6" />
                      <p className="font-medium mb-4">Síguenos</p>
                      <div className="flex gap-4">
                        {socialLinks.facebook && (
                          <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" 
                             className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:opacity-80">
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {socialLinks.instagram && (
                          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                             className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white hover:opacity-80">
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {socialLinks.twitter && (
                          <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                             className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white hover:opacity-80">
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {socialLinks.website && (
                          <a href={socialLinks.website} target="_blank" rel="noopener noreferrer"
                             className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white hover:opacity-80">
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 bg-muted/50 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {restaurantName}. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Powered by RestroWizard
          </p>
        </div>
      </footer>
    </div>
  );
}
