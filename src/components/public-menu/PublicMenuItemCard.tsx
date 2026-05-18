import { ChefHat, Heart, Flame, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';
import { DIETARY_ICONS } from './publicMenuConstants';

interface Props {
  item: Tables<'menu_items'>;
  primaryColor: string;
  accentColor: string;
}

export const PublicMenuItemCard = ({ item, primaryColor, accentColor }: Props) => (
  <article
    className="group flex gap-4 p-4 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 border"
    style={{ borderColor: `${primaryColor}08` }}
  >
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

    <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg" style={{ color: primaryColor }}>{item.name}</h3>
            {item.is_new && (
              <Badge className="text-[10px] px-1.5 py-0" style={{ backgroundColor: '#10b981', color: 'white' }}>NUEVO</Badge>
            )}
            {item.is_bestseller && (
              <Badge className="text-[10px] px-1.5 py-0 flex items-center gap-0.5" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                <Heart className="w-2.5 h-2.5 fill-current" />
                Popular
              </Badge>
            )}
          </div>
        </div>

        {item.price !== null && (
          <span className="font-bold text-lg flex-shrink-0" style={{ color: accentColor }}>
            ${item.price.toFixed(2)}
          </span>
        )}
      </div>

      {item.description && (
        <p className="text-sm mt-1 line-clamp-2 flex-1" style={{ color: `${primaryColor}70` }}>
          {item.description}
        </p>
      )}

      <div className="flex items-center gap-3 mt-auto pt-2 flex-wrap">
        {(item.dietary_tags || []).map(tag => {
          const tagInfo = DIETARY_ICONS[tag];
          if (!tagInfo) return null;
          return (
            <span key={tag} className={`flex items-center gap-1 text-xs ${tagInfo.color}`} title={tagInfo.label}>
              {tagInfo.icon}
              <span className="hidden sm:inline">{tagInfo.label}</span>
            </span>
          );
        })}

        {item.spicy_level && item.spicy_level > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-orange-500" title={`Nivel de picante: ${item.spicy_level}`}>
            {[...Array(item.spicy_level)].map((_, i) => (
              <Flame key={i} className="w-3 h-3 fill-current" />
            ))}
          </span>
        )}

        {item.preparation_time_minutes && (
          <span className="flex items-center gap-1 text-xs" style={{ color: `${primaryColor}50` }}>
            <Clock className="w-3 h-3" />
            {item.preparation_time_minutes} min
          </span>
        )}

        {item.calories && (
          <span className="text-xs" style={{ color: `${primaryColor}50` }}>
            {item.calories} kcal
          </span>
        )}
      </div>
    </div>
  </article>
);
