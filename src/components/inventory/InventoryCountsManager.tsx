import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Plus, Play, CheckCircle, BarChart3, AlertTriangle } from 'lucide-react';
import { InventoryCount, StorageLocation } from '@/hooks/useEnterpriseInventory';

interface Props {
  counts: InventoryCount[];
  locations: StorageLocation[];
  onCreate: (data: Partial<InventoryCount>, itemIds?: string[]) => Promise<any>;
  onComplete: (countId: string, applyAdjustments: boolean) => Promise<void>;
}

const countTypes = [
  { value: 'full', label: 'Conteo Completo' },
  { value: 'cycle', label: 'Conteo Cíclico' },
  { value: 'spot', label: 'Conteo Rápido' }
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  in_progress: { label: 'En Progreso', variant: 'secondary' },
  completed: { label: 'Completado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' }
};

export const InventoryCountsManager = ({ counts, locations, onCreate, onComplete }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    count_name: '',
    count_type: 'full',
    storage_location_id: '',
    counted_by: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      count_name: '',
      count_type: 'full',
      storage_location_id: '',
      counted_by: '',
      notes: ''
    });
  };

  const handleSubmit = async () => {
    await onCreate({
      count_name: formData.count_name || `Conteo ${new Date().toLocaleDateString()}`,
      count_type: formData.count_type,
      storage_location_id: formData.storage_location_id || undefined,
      counted_by: formData.counted_by || undefined,
      notes: formData.notes || undefined
    });
    setDialogOpen(false);
    resetForm();
  };

  const getLocationName = (id: string | null) => {
    if (!id) return 'Todas';
    return locations.find(l => l.id === id)?.location_name || '-';
  };

  const inProgressCounts = counts.filter(c => c.status === 'in_progress');
  const completedCounts = counts.filter(c => c.status === 'completed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Conteos Físicos
        </h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Conteo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Conteo Físico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre del Conteo</Label>
                <Input
                  value={formData.count_name}
                  onChange={(e) => setFormData({ ...formData, count_name: e.target.value })}
                  placeholder={`Conteo ${new Date().toLocaleDateString()}`}
                />
              </div>
              <div>
                <Label>Tipo de Conteo</Label>
                <Select value={formData.count_type} onValueChange={(v) => setFormData({ ...formData, count_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ubicación (opcional)</Label>
                <Select value={formData.storage_location_id} onValueChange={(v) => setFormData({ ...formData, storage_location_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las ubicaciones</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contado por</Label>
                <Input
                  value={formData.counted_by}
                  onChange={(e) => setFormData({ ...formData, counted_by: e.target.value })}
                  placeholder="Nombre del responsable"
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSubmit}>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Conteo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active counts */}
      {inProgressCounts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Conteos en Progreso</h4>
          {inProgressCounts.map((count) => {
            const progress = count.total_items > 0 
              ? (count.items_counted / count.total_items) * 100 
              : 0;
            
            return (
              <Card key={count.id} className="border-primary/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{count.count_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getLocationName(count.storage_location_id)} • {count.counted_by || 'Sin asignar'}
                      </p>
                    </div>
                    <Badge variant="secondary">{countTypes.find(t => t.value === count.count_type)?.label}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso: {count.items_counted} / {count.total_items}</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {count.total_variance_value > 0 && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      Varianza acumulada: ${Math.abs(count.total_variance_value).toFixed(2)}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onComplete(count.id, false)}
                    >
                      Completar sin ajustes
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onComplete(count.id, true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completar y ajustar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed counts history */}
      {completedCounts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Historial de Conteos</h4>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Varianza</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedCounts.slice(0, 10).map((count) => {
                  const status = statusConfig[count.status] || statusConfig.in_progress;
                  return (
                    <TableRow key={count.id}>
                      <TableCell className="font-medium">{count.count_name}</TableCell>
                      <TableCell>{countTypes.find(t => t.value === count.count_type)?.label}</TableCell>
                      <TableCell>{getLocationName(count.storage_location_id)}</TableCell>
                      <TableCell>
                        {count.completed_at 
                          ? new Date(count.completed_at).toLocaleDateString() 
                          : new Date(count.started_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className={`text-right ${count.total_variance_value !== 0 ? 'text-yellow-600' : ''}`}>
                        ${Math.abs(count.total_variance_value).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {counts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sin conteos registrados</p>
            <p className="text-sm">Inicia un conteo físico para auditar tu inventario</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
