import React from 'react';
import { 
  Edit3, Trash2, Eye, EyeOff, Star, Clock, Flame, 
  Image as ImageIcon, GripVertical, MoreVertical, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, available: boolean) => void;
  onToggleFeatured?: (id: string, featured: boolean) => void;
  currencySymbol?: string;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: '🌾',
  crustaceans: '🦐',
  eggs: '🥚',
  fish: '🐟',
  peanuts: '🥜',
  soybeans: '🫘',
  milk: '🥛',
  nuts: '🌰',
  celery: '🥬',
  mustard: '🟡',
  sesame: '⚪',
  sulphites: '🍷',
  lupin: '🌸',
  molluscs: '🐚',
};

const DIETARY_LABELS: Record<string, { label: string; color: string }> = {
  vegetarian: { label: 'Vegetariano', color: 'bg-green-100 text-green-800 border-green-200' },
  vegan: { label: 'Vegano', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  gluten_free: { label: 'Sin Gluten', color: 'bg-amber-100 text-amber-800 border-amber-200' },
};

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  onToggleFeatured,
  currencySymbol = '$',
  isDragging = false,
  dragHandleProps,
}) => {
  const hasImage = !!item.image_url;
  const isUnavailable = !item.is_available;

  return (
    <Card 
      className={`group transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-md'
      } ${isUnavailable ? 'opacity-60 bg-muted/30' : ''}`}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Drag handle */}
          {dragHandleProps && (
            <div 
              {...dragHandleProps}
              className="flex items-center justify-center w-8 bg-muted/50 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Image */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-muted overflow-hidden">
            {hasImage ? (
              <img 
                src={item.image_url!} 
                alt={item.name}
                className={`w-full h-full object-cover ${isUnavailable ? 'grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
            
            {/* Badges overlay */}
            <div className="absolute top-1 left-1 flex flex-col gap-1">
              {item.is_featured && (
                <Badge className="bg-yellow-500 text-yellow-950 text-[10px] px-1.5 py-0.5">
                  <Star className="w-3 h-3 mr-0.5 fill-current" />
                  Destacado
                </Badge>
              )}
              {(item as any).is_new && (
                <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  Nuevo
                </Badge>
              )}
              {(item as any).is_bestseller && (
                <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                  🔥 Popular
                </Badge>
              )}
            </div>

            {/* Unavailable overlay */}
            {isUnavailable && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Badge variant="destructive" className="text-xs">
                  <EyeOff className="w-3 h-3 mr-1" />
                  No disponible
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold text-sm sm:text-base truncate ${isUnavailable ? 'text-muted-foreground' : ''}`}>
                  {item.name}
                </h3>
                
                {item.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
              
              {/* Price */}
              <div className="text-right flex-shrink-0">
                <span className={`font-bold text-base sm:text-lg ${isUnavailable ? 'text-muted-foreground' : 'text-primary'}`}>
                  {currencySymbol}{item.price?.toFixed(2)}
                </span>
                {(item as any).cost && item.price && (
                  <p className="text-[10px] text-muted-foreground">
                    Margen: {(((item.price - (item as any).cost) / item.price) * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {/* Dietary tags */}
              {item.dietary_tags?.map(tag => {
                const info = DIETARY_LABELS[tag];
                return info ? (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 ${info.color}`}
                  >
                    {info.label}
                  </Badge>
                ) : null;
              })}

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-[10px]">
                        {item.allergens.slice(0, 4).map(a => (
                          <span key={a}>{ALLERGEN_ICONS[a] || '⚠️'}</span>
                        ))}
                        {item.allergens.length > 4 && <span>+{item.allergens.length - 4}</span>}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Alérgenos: {item.allergens.join(', ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Prep time */}
              {(item as any).preparation_time_minutes && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <Clock className="w-3 h-3 mr-0.5" />
                  {(item as any).preparation_time_minutes} min
                </Badge>
              )}

              {/* Spicy level */}
              {(item as any).spicy_level && (item as any).spicy_level > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 border-red-200">
                  {Array.from({ length: (item as any).spicy_level }).map((_, i) => (
                    <Flame key={i} className="w-3 h-3 fill-current" />
                  ))}
                </Badge>
              )}

              {/* Calories */}
              {(item as any).calories && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {(item as any).calories} kcal
                </Badge>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t">
              {/* Availability toggle */}
              <div className="flex items-center gap-2">
                <Switch 
                  checked={item.is_available}
                  onCheckedChange={(checked) => onToggleAvailability(item.id, checked)}
                  className="h-4 w-7"
                />
                <span className="text-xs text-muted-foreground">
                  {item.is_available ? 'Disponible' : 'Agotado'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onEdit(item)}
                  className="h-7 px-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onToggleFeatured && (
                      <DropdownMenuItem onClick={() => onToggleFeatured(item.id, !item.is_featured)}>
                        <Star className={`w-4 h-4 mr-2 ${item.is_featured ? 'fill-current text-yellow-500' : ''}`} />
                        {item.is_featured ? 'Quitar destacado' : 'Destacar'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onToggleAvailability(item.id, !item.is_available)}>
                      {item.is_available ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Marcar como agotado
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Marcar como disponible
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(item.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
