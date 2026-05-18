import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterCategory: string;
  onCategoryChange: (v: string) => void;
  filterType: string;
  onTypeChange: (v: string) => void;
  categories: (string | null)[];
}

export const RecipesFilterBar = ({
  searchTerm, onSearchChange, filterCategory, onCategoryChange, filterType, onTypeChange, categories,
}: Props) => (
  <div className="flex gap-4">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Buscar recetas..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
    </div>
    <Select value={filterCategory} onValueChange={onCategoryChange}>
      <SelectTrigger className="w-40"><SelectValue placeholder="Categoría" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas</SelectItem>
        {categories.map(cat => <SelectItem key={cat} value={cat!}>{cat}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={filterType} onValueChange={onTypeChange}>
      <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="main">Recetas principales</SelectItem>
        <SelectItem value="sub">Sub-recetas</SelectItem>
      </SelectContent>
    </Select>
  </div>
);
