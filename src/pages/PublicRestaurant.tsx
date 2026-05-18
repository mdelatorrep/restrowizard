import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicWebsite } from '@/hooks/useRestaurantWebsite';
import { usePublicReservation } from '@/hooks/useReservations';
import { usePublicCart } from '@/hooks/usePublicCart';
import { usePublicRestaurantMenus } from '@/hooks/usePublicRestaurantMenus';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils } from 'lucide-react';
import { DeliveryCart, CartButton } from '@/components/public-website/DeliveryCart';
import { PublicReservationWidget } from '@/components/reservations/PublicReservationWidget';
import { PublicRestaurantNav } from '@/components/public-restaurant/PublicRestaurantNav';
import { PublicRestaurantHero } from '@/components/public-restaurant/PublicRestaurantHero';
import { PublicRestaurantAbout } from '@/components/public-restaurant/PublicRestaurantAbout';
import { PublicRestaurantMenu } from '@/components/public-restaurant/PublicRestaurantMenu';
import { PublicRestaurantGallery } from '@/components/public-restaurant/PublicRestaurantGallery';
import { PublicRestaurantHours } from '@/components/public-restaurant/PublicRestaurantHours';
import { PublicRestaurantContact } from '@/components/public-restaurant/PublicRestaurantContact';
import { PublicRestaurantFooter } from '@/components/public-restaurant/PublicRestaurantFooter';

export default function PublicRestaurant() {
  const { slug } = useParams<{ slug: string }>();
  const { data: website, loading, error } = usePublicWebsite(slug || '');
  const { createPublicReservation, loading: reservationLoading } = usePublicReservation();
  const [showCart, setShowCart] = useState(false);

  const cart = usePublicCart(website?.user_id || '');
  const { menus, menuItems, selectedMenu, setSelectedMenu } = usePublicRestaurantMenus(
    website?.user_id,
    !!website?.show_menu
  );

  useEffect(() => {
    if (website?.user_id && website.show_delivery) {
      cart.loadZones();
    }
  }, [website?.user_id, website?.show_delivery]);

  const handleReservationSubmit = async (data: any) => {
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
            <p className="text-muted-foreground">El restaurante que buscas no existe o no está disponible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brand = website.brand;
  const profile = website.profile;
  const restaurantName = website.site_title || brand?.brand_name || profile?.restaurant_name || 'Restaurante';

  const brandStyles: React.CSSProperties = {
    ['--brand-primary' as any]: brand?.primary_color || 'hsl(var(--primary))',
    ['--brand-secondary' as any]: brand?.secondary_color || 'hsl(var(--secondary))',
    ['--brand-accent' as any]: brand?.accent_color || 'hsl(var(--accent))',
  };

  return (
    <div className="min-h-screen bg-background" style={brandStyles}>
      <PublicRestaurantNav website={website} restaurantName={restaurantName} />
      <PublicRestaurantHero website={website} restaurantName={restaurantName} />

      {website.show_about && <PublicRestaurantAbout website={website} />}

      {website.show_menu && menus.length > 0 && (
        <PublicRestaurantMenu
          website={website}
          menus={menus}
          menuItems={menuItems}
          selectedMenu={selectedMenu}
          onSelectMenu={setSelectedMenu}
          onAddToCart={(item) => cart.addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url || undefined,
          })}
        />
      )}

      {website.show_gallery && website.gallery_images.length > 0 && <PublicRestaurantGallery website={website} />}

      {Object.keys(website.business_hours).length > 0 && <PublicRestaurantHours website={website} />}

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

      {website.show_contact && <PublicRestaurantContact website={website} />}

      <PublicRestaurantFooter website={website} restaurantName={restaurantName} />

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
