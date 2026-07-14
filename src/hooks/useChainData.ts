import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';

export const useChainData = () => {
  const { userId, isViewingClient, clientName } = useDataUserId();

  // Restaurant Chains
  const { data: chains, isLoading: chainsLoading } = useQuery({
    queryKey: ['restaurant-chains', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('restaurant_chains')
        .select('*')
        .eq('owner_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Get chain locations for user's chains
  const chainIds = chains?.map(c => c.id) || [];

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['chain-locations', chainIds],
    queryFn: async () => {
      if (chainIds.length === 0) return [];
      const { data, error } = await supabase
        .from('chain_locations')
        .select('*')
        .in('chain_id', chainIds);
      if (error) throw error;
      return data || [];
    },
    enabled: chainIds.length > 0,
  });

  // Compliance Checklists
  const { data: complianceChecklists, isLoading: checklistsLoading } = useQuery({
    queryKey: ['compliance-checklists', chainIds],
    queryFn: async () => {
      if (chainIds.length === 0) return [];
      const { data, error } = await supabase
        .from('compliance_checklists')
        .select('*')
        .in('chain_id', chainIds);
      if (error) throw error;
      return data || [];
    },
    enabled: chainIds.length > 0,
  });

  // Inventory Transfers
  const { data: inventoryTransfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['inventory-transfers', chainIds],
    queryFn: async () => {
      if (chainIds.length === 0) return [];
      const { data, error } = await supabase
        .from('inventory_transfers')
        .select('*')
        .in('chain_id', chainIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: chainIds.length > 0,
  });

  // Master Menus
  const { data: masterMenus, isLoading: menusLoading } = useQuery({
    queryKey: ['chain-master-menus', chainIds],
    queryFn: async () => {
      if (chainIds.length === 0) return [];
      const { data, error } = await supabase
        .from('chain_master_menus')
        .select('*')
        .in('chain_id', chainIds);
      if (error) throw error;
      return data || [];
    },
    enabled: chainIds.length > 0,
  });

  // Calculate summary metrics
  const totalLocations = locations?.length || 0;
  const activeLocations = locations?.filter(l => l.is_active)?.length || 0;
  const totalSeatingCapacity = locations?.reduce((sum, l) => sum + (l.seating_capacity || 0), 0) || 0;
  const pendingTransfers = inventoryTransfers?.filter(t => t.status === 'pending')?.length || 0;

  const hasData = (chains?.length || 0) > 0;

  return {
    chains: chains || [],
    locations: locations || [],
    complianceChecklists: complianceChecklists || [],
    inventoryTransfers: inventoryTransfers || [],
    masterMenus: masterMenus || [],
    summary: {
      totalLocations,
      activeLocations,
      totalSeatingCapacity,
      pendingTransfers,
    },
    hasData,
    isLoading: chainsLoading || locationsLoading || checklistsLoading || transfersLoading || menusLoading,
    isViewingClient,
    clientName,
  };
};
