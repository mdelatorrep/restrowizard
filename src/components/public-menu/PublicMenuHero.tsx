import { Instagram, Facebook } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { SocialLinks } from './publicMenuConstants';

interface Props {
  menu: Tables<'restaurant_menus'>;
  brand: Tables<'restaurant_brands'> | null;
  socialLinks: SocialLinks;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
}

export const PublicMenuHero = ({ menu, brand, socialLinks, primaryColor, accentColor, secondaryColor }: Props) => (
  <header className="relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
    <div className="absolute inset-0 opacity-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${accentColor} 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, ${accentColor} 0%, transparent 50%)`,
        }}
      />
    </div>

    <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col items-center text-center space-y-4">
        {brand?.logo_url && (
          <div className="relative">
            <div className="absolute inset-0 blur-2xl opacity-50" style={{ backgroundColor: accentColor }} />
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
            <p className="text-white/70 text-lg max-w-xl mx-auto">{menu.description}</p>
          )}
          {brand?.tagline && (
            <p className="text-white/50 text-sm italic">{brand.tagline}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Instagram className="w-5 h-5 text-white" />
            </a>
          )}
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Facebook className="w-5 h-5 text-white" />
            </a>
          )}
        </div>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <path
          d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
          fill={secondaryColor}
        />
      </svg>
    </div>
  </header>
);
