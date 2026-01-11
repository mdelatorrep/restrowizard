import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConsultantProfile } from '@/hooks/useConsultantProfile';
import { useToast } from '@/hooks/use-toast';

export interface RestaurantZone {
  id: string;
  restaurant_id?: string | null;
  consultant_id: string;
  name: string;
  description?: string;
  capacity_min: number;
  capacity_max: number;
  price_per_hour: number;
  price_per_event: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  restaurant?: { id: string; name: string };
}

export interface ZoneFormData {
  restaurant_id?: string | null;
  name: string;
  description?: string;
  capacity_min: number;
  capacity_max: number;
  price_per_hour: number;
  price_per_event: number;
  amenities: string[];
  images: string[];
}

export function useRestaurantZones() {
  const [zones, setZones] = useState<RestaurantZone[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useConsultantProfile();
  const { toast } = useToast();

  const fetchZones = useCallback(async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_zones')
        .select(`
          *,
          restaurant:restaurant_businesses(id, name)
        `)
        .eq('consultant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse amenities from JSONB
      const parsedData = (data || []).map((zone: any) => ({
        ...zone,
        amenities: Array.isArray(zone.amenities) ? zone.amenities : [],
        images: zone.images || [],
      }));

      setZones(parsedData as RestaurantZone[]);
    } catch (error: any) {
      console.error('Error fetching zones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los espacios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id, toast]);

  useEffect(() => {
    if (profile?.id) {
      fetchZones();
    }
  }, [profile?.id, fetchZones]);

  const createZone = async (data: ZoneFormData): Promise<string | null> => {
    if (!profile?.id) return null;

    try {
      const { data: zone, error } = await supabase
        .from('restaurant_zones')
        .insert({
          consultant_id: profile.id,
          restaurant_id: data.restaurant_id,
          name: data.name,
          description: data.description,
          capacity_min: data.capacity_min,
          capacity_max: data.capacity_max,
          price_per_hour: data.price_per_hour,
          price_per_event: data.price_per_event,
          amenities: data.amenities,
          images: data.images,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Espacio creado',
        description: 'El espacio se ha guardado correctamente',
      });

      await fetchZones();
      return zone.id;
    } catch (error: any) {
      console.error('Error creating zone:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el espacio',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateZone = async (id: string, data: Partial<ZoneFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('restaurant_zones')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Espacio actualizado',
        description: 'Los cambios se han guardado correctamente',
      });

      await fetchZones();
      return true;
    } catch (error: any) {
      console.error('Error updating zone:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el espacio',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteZone = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('restaurant_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Espacio eliminado',
        description: 'El espacio se ha eliminado correctamente',
      });

      await fetchZones();
      return true;
    } catch (error: any) {
      console.error('Error deleting zone:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el espacio',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleZoneStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('restaurant_zones')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isActive ? 'Espacio activado' : 'Espacio desactivado',
      });

      await fetchZones();
      return true;
    } catch (error: any) {
      console.error('Error toggling zone status:', error);
      return false;
    }
  };

  return {
    zones,
    loading,
    createZone,
    updateZone,
    deleteZone,
    toggleZoneStatus,
    refetch: fetchZones,
    activeZones: zones.filter((z) => z.is_active),
  };
}
