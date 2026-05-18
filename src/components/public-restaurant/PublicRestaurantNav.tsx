import { Truck } from 'lucide-react';
import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';

interface Props {
  website: PublicWebsiteData;
  restaurantName: string;
}

export const PublicRestaurantNav = ({ website, restaurantName }: Props) => {
  const brand = website.brand;
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {brand?.logo_url && <img src={brand.logo_url} alt={restaurantName} className="h-10 w-auto" />}
            <span className="font-bold text-xl" style={{ fontFamily: brand?.primary_font }}>{restaurantName}</span>
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
  );
};
