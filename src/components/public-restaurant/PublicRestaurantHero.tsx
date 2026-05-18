import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';

interface Props {
  website: PublicWebsiteData;
  restaurantName: string;
}

export const PublicRestaurantHero = ({ website, restaurantName }: Props) => {
  const brand = website.brand;
  return (
    <section id="inicio" className="relative min-h-[70vh] flex items-center justify-center">
      {website.hero_image_url ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${website.hero_image_url})` }}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
      )}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg" style={{ fontFamily: brand?.primary_font }}>
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
              <a href="#reservas"><Calendar className="w-5 h-5 mr-2" />Reservar mesa</a>
            </Button>
          )}
        </div>
      </div>
      <a href="#nosotros" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white" />
      </a>
    </section>
  );
};
