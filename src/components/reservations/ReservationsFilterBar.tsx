import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, List, CalendarDays, LayoutGrid } from 'lucide-react';

type ViewMode = 'timeline' | 'calendar' | 'list';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
}

export function ReservationsFilterBar({ search, onSearchChange, statusFilter, onStatusFilterChange, viewMode, onViewModeChange }: Props) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono o código..."
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="no_show">No asistió</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button variant={viewMode === 'timeline' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('timeline')}>
              <List className="h-4 w-4 mr-2" />Timeline
            </Button>
            <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('calendar')}>
              <CalendarDays className="h-4 w-4 mr-2" />Calendario
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('list')}>
              <LayoutGrid className="h-4 w-4 mr-2" />Lista
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { ViewMode };
