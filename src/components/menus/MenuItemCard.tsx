import React from 'react';
import { 
  Edit3, Trash2, Eye, EyeOff, Star, Clock, Flame, 
  Image as ImageIcon, GripVertical, MoreVertical, Sparkles, Zap
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
import { formatCurrency } from '@/lib/formatCurrency';

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

const DIETARY_LABELS: Record<string, { label: string; gradient: string; icon: string }> = {
  vegetarian: { label: 'Vegetariano', gradient: 'from-green-400 to-emerald-500', icon: '🥬' },
  vegan: { label: 'Vegano', gradient: 'from-emerald-400 to-teal-500', icon: '🌱' },
  gluten_free: { label: 'Sin Gluten', gradient: 'from-amber-400 to-orange-500', icon: '🌾' },
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
  const cost = (item as any).cost;
  const profitMargin = cost && item.price ? (((item.price - cost) / item.price) * 100) : null;

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 ${
        isDragging 
          ? 'shadow-2xl ring-2 ring-primary/30 scale-[1.02]' 
          : 'hover:shadow-xl hover:-translate-y-1'
      } ${isUnavailable ? 'opacity-70' : ''} border-0 bg-card`}
    >
      {/* Top gradient bar */}
      <div className={`h-1 ${
        isUnavailable 
          ? 'bg-gradient-to-r from-gray-300 to-gray-400' 
          : item.is_featured 
            ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500'
            : 'bg-gradient-to-r from-primary/60 to-secondary/60'
      }`} />

      <CardContent className="p-0">
        <div className="flex">
          {/* Drag handle */}
          {dragHandleProps && (
            <div 
              {...dragHandleProps}
              className="flex items-center justify-center w-10 bg-gradient-to-b from-muted/30 to-muted/50 cursor-grab active:cursor-grabbing hover:from-primary/10 hover:to-primary/20 transition-all"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Image Section */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {hasImage ? (
              <img 
                src={item.image_url!} 
                alt={item.name}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                  isUnavailable ? 'grayscale' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Badges overlay */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              {item.is_featured && (
                <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 text-[10px] px-2 py-0.5 shadow-lg border-0">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Destacado
                </Badge>
              )}
              {(item as any).is_new && (
                <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-[10px] px-2 py-0.5 shadow-lg border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Nuevo
                </Badge>
              )}
              {(item as any).is_bestseller && (
                <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] px-2 py-0.5 shadow-lg border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>

            {/* Unavailable overlay */}
            {isUnavailable && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-end justify-center pb-4">
                <Badge variant="destructive" className="text-xs shadow-lg">
                  <EyeOff className="w-3 h-3 mr-1" />
                  No disponible
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className={`font-bold text-base sm:text-lg leading-tight ${
                  isUnavailable ? 'text-muted-foreground' : 'group-hover:text-primary transition-colors'
                }`}>
                  {item.name}
                </h3>
                
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              
              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className={`text-xl sm:text-2xl font-bold ${
                  isUnavailable 
                    ? 'text-muted-foreground' 
                    : 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                }`}>
                  {currencySymbol}{item.price?.toFixed(2)}
                </div>
                {profitMargin !== null && (
                  <div className={`text-[10px] font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block ${
                    profitMargin >= 70 
                      ? 'bg-green-100 text-green-700' 
                      : profitMargin >= 50 
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {profitMargin.toFixed(0)}% margen
                  </div>
                )}
              </div>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {/* Dietary tags */}
              {item.dietary_tags?.map(tag => {
                const info = DIETARY_LABELS[tag];
                return info ? (
                  <Badge 
                    key={tag} 
                    className={`bg-gradient-to-r ${info.gradient} text-white text-[10px] px-2 py-0.5 border-0 shadow-sm`}
                  >
                    {info.icon} {info.label}
                  </Badge>
                ) : null;
              })}

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5 px-2 py-1 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-full text-xs cursor-help hover:shadow-sm transition-shadow">
                        {item.allergens.slice(0, 4).map(a => (
                          <span key={a} className="text-sm">{ALLERGEN_ICONS[a] || '⚠️'}</span>
                        ))}
                        {item.allergens.length > 4 && (
                          <span className="text-[10px] text-red-600 ml-1">+{item.allergens.length - 4}</span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs font-medium mb-1">Alérgenos:</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.allergens.join(', ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Prep time */}
              {(item as any).preparation_time_minutes && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/50">
                  <Clock className="w-3 h-3 mr-1" />
                  {(item as any).preparation_time_minutes} min
                </Badge>
              )}

              {/* Spicy level */}
              {(item as any).spicy_level && (item as any).spicy_level > 0 && (
                <Badge className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-red-400 to-orange-500 text-white border-0">
                  {Array.from({ length: Math.min((item as any).spicy_level, 5) }).map((_, i) => (
                    <Flame key={i} className="w-3 h-3 fill-current inline" />
                  ))}
                </Badge>
              )}

              {/* Calories */}
              {(item as any).calories && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/50">
                  🔥 {(item as any).calories} kcal
                </Badge>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-dashed">
              {/* Availability toggle */}
              <div className="flex items-center gap-2">
                <Switch 
                  checked={item.is_available}
                  onCheckedChange={(checked) => onToggleAvailability(item.id, checked)}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-400 data-[state=checked]:to-emerald-500"
                />
                <span className={`text-xs font-medium ${
                  item.is_available ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {item.is_available ? 'Disponible' : 'Agotado'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onEdit(item)}
                  className="h-8 px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onToggleFeatured && (
                      <DropdownMenuItem onClick={() => onToggleFeatured(item.id, !item.is_featured)}>
                        <Star className={`w-4 h-4 mr-2 ${item.is_featured ? 'fill-current text-yellow-500' : ''}`} />
                        {item.is_featured ? 'Quitar destacado' : 'Destacar platillo'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onToggleAvailability(item.id, !item.is_available)}>
                      {item.is_available ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Marcar agotado
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Marcar disponible
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(item.id)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar platillo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
};
