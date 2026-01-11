import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Users,
  DollarSign,
  Wifi,
  Music,
  Projector,
  Car,
  UtensilsCrossed,
  Trash2,
  Edit,
  Image,
} from 'lucide-react';
import { useRestaurantZones, ZoneFormData } from '@/hooks/useRestaurantZones';
import { Skeleton } from '@/components/ui/skeleton';

const amenityOptions = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'sonido', label: 'Sistema de Sonido', icon: Music },
  { id: 'proyector', label: 'Proyector/Pantalla', icon: Projector },
  { id: 'estacionamiento', label: 'Estacionamiento', icon: Car },
  { id: 'cocina', label: 'Acceso a Cocina', icon: UtensilsCrossed },
];

const initialFormData: ZoneFormData = {
  name: '',
  description: '',
  capacity_min: 10,
  capacity_max: 50,
  price_per_hour: 0,
  price_per_event: 0,
  amenities: [],
  images: [],
};

export default function EventSpaces() {
  const navigate = useNavigate();
  const { zones, loading, createZone, updateZone, deleteZone, toggleZoneStatus } =
    useRestaurantZones();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setEditingZone(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (zone: any) => {
    setFormData({
      restaurant_id: zone.restaurant_id,
      name: zone.name,
      description: zone.description || '',
      capacity_min: zone.capacity_min,
      capacity_max: zone.capacity_max,
      price_per_hour: zone.price_per_hour,
      price_per_event: zone.price_per_event,
      amenities: zone.amenities || [],
      images: zone.images || [],
    });
    setEditingZone(zone.id);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingZone) {
        await updateZone(editingZone, formData);
      } else {
        await createZone(formData);
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingZone(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteZone(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/c/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">
            Gestión de Espacios
          </h1>
          <p className="text-muted-foreground">
            Administra las zonas y ubicaciones disponibles para eventos
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Espacio
        </Button>
      </div>

      {/* Zones Grid */}
      {zones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No hay espacios registrados</h3>
            <p className="text-muted-foreground">
              Agrega espacios de tus clientes restaurantes para incluirlos en cotizaciones
            </p>
            <Button className="mt-4" onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Espacio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.id} className={!zone.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    {zone.restaurant && (
                      <p className="text-sm text-muted-foreground">{zone.restaurant.name}</p>
                    )}
                  </div>
                  <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                    {zone.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {zone.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{zone.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {zone.capacity_min} - {zone.capacity_max} personas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCurrency(zone.price_per_event)}/evento</span>
                  </div>
                </div>

                {zone.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {zone.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenityOptions.find((a) => a.id === amenity)?.label || amenity}
                      </Badge>
                    ))}
                    {zone.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{zone.amenities.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={zone.is_active}
                      onCheckedChange={(checked) => toggleZoneStatus(zone.id, checked)}
                    />
                    <span className="text-sm text-muted-foreground">Disponible</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmId(zone.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar Espacio' : 'Nuevo Espacio'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Espacio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Terraza Principal, Salón VIP"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el espacio, ambiente, características..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity_min">Capacidad Mínima</Label>
                <Input
                  id="capacity_min"
                  type="number"
                  value={formData.capacity_min}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity_min: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="capacity_max">Capacidad Máxima</Label>
                <Input
                  id="capacity_max"
                  type="number"
                  value={formData.capacity_max}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity_max: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_per_hour">Precio por Hora (MXN)</Label>
                <Input
                  id="price_per_hour"
                  type="number"
                  value={formData.price_per_hour}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_hour: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="price_per_event">Precio por Evento (MXN)</Label>
                <Input
                  id="price_per_event"
                  type="number"
                  value={formData.price_per_event}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_event: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Amenidades</Label>
              <div className="grid grid-cols-2 gap-2">
                {amenityOptions.map((amenity) => (
                  <Button
                    key={amenity.id}
                    type="button"
                    variant={formData.amenities.includes(amenity.id) ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start"
                    onClick={() => toggleAmenity(amenity.id)}
                  >
                    <amenity.icon className="mr-2 h-4 w-4" />
                    {amenity.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || saving}>
              {saving ? 'Guardando...' : editingZone ? 'Guardar Cambios' : 'Crear Espacio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar espacio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El espacio se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
