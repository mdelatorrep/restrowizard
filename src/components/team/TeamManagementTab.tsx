import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield } from 'lucide-react';
import { TeamMembersTab } from './TeamMembersTab';
import { RolesTab } from './RolesTab';

/**
 * Top-level team management screen with two sub-tabs:
 *  - Miembros: invite, suspend, edit per-member overrides
 *  - Roles: define system + custom roles with permissions per module
 */
export const TeamManagementTab: React.FC = () => {
  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList>
        <TabsTrigger value="members" className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Miembros
        </TabsTrigger>
        <TabsTrigger value="roles" className="flex items-center gap-2">
          <Shield className="h-4 w-4" /> Roles
        </TabsTrigger>
      </TabsList>
      <TabsContent value="members" className="mt-4">
        <TeamMembersTab />
      </TabsContent>
      <TabsContent value="roles" className="mt-4">
        <RolesTab />
      </TabsContent>
    </Tabs>
  );
};

export default TeamManagementTab;
