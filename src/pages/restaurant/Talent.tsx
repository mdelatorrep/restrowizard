import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TalentAIModule from '@/components/TalentAIModule';
import StaffSchedule from './StaffSchedule';
import { Users, CalendarDays } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Talent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'talent';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Talento y Turnos
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Gestión integral de tu equipo y programación de turnos
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="talent" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Turnos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="talent" className="mt-6">
          <TalentAIModule />
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-6">
          <StaffSchedule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Talent;
