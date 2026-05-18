import { Star, ChefHat } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface Props {
  items: Tables<'menu_items'>[];
  primaryColor: string;
  accentColor: string;
  fontPrimary?: string;
}

export const PublicMenuFeatured = ({ items, primaryColor, accentColor, fontPrimary }: Props) => (
  <section className="container mx-auto px-4 py-8">
    <div className="flex items-center gap-2 mb-6">
      <Star className="w-6 h-6" style={{ color: accentColor }} />
      <h2 className="text-2xl font-bold" style={{ color: primaryColor, fontFamily: fontPrimary }}>
        Destacados
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(items || []).map((item) => (
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
            <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}08` }}>
              <ChefHat className="w-16 h-16" style={{ color: `${primaryColor}20` }} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>
                )}
              </div>
              {item.price && (
                <span className="text-xl font-bold px-3 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }}>
                  ${item.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

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
);
