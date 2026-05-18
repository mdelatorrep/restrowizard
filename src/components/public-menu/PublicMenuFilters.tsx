import { Search, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DIETARY_ICONS } from './publicMenuConstants';

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (c: string | null) => void;
  activeFilters: string[];
  onToggleFilter: (f: string) => void;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
}

export const PublicMenuFilters = ({
  searchQuery, onSearchChange, categories, activeCategory, onCategoryChange,
  activeFilters, onToggleFilter, primaryColor, accentColor, secondaryColor,
}: Props) => (
  <div
    className="sticky top-0 z-40 border-b backdrop-blur-lg"
    style={{ backgroundColor: `${secondaryColor}ee`, borderColor: `${primaryColor}10` }}
  >
    <div className="container mx-auto px-4 py-4 space-y-3">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: `${primaryColor}60` }} />
        <Input
          type="text"
          placeholder="Buscar en el menú..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-12 rounded-full border-2 transition-all focus:ring-2"
          style={{ borderColor: `${primaryColor}20`, backgroundColor: 'white' }}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5">
            <X className="w-4 h-4" style={{ color: `${primaryColor}60` }} />
          </button>
        )}
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2 justify-center">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className="rounded-full whitespace-nowrap transition-all"
            style={activeCategory === null
              ? { backgroundColor: accentColor, color: 'white' }
              : { borderColor: `${primaryColor}30`, color: primaryColor }}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Todo
          </Button>
          {(categories || []).map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className="rounded-full whitespace-nowrap transition-all capitalize"
              style={activeCategory === category
                ? { backgroundColor: accentColor, color: 'white' }
                : { borderColor: `${primaryColor}30`, color: primaryColor }}
            >
              {category.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex gap-2 justify-center">
        {Object.entries(DIETARY_ICONS).map(([key, { icon, label, color }]) => (
          <button
            key={key}
            onClick={() => onToggleFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilters.includes(key) ? 'ring-2 ring-offset-1' : 'hover:bg-black/5'
            }`}
            style={{
              backgroundColor: activeFilters.includes(key) ? `${accentColor}15` : 'transparent',
              color: activeFilters.includes(key) ? accentColor : `${primaryColor}80`,
            }}
          >
            <span className={color}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  </div>
);
