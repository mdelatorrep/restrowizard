import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TalentAIModule from '@/components/TalentAIModule';
import StaffSchedule from './StaffSchedule';
import { AvailabilityManager } from '@/components/talent/AvailabilityManager';
import { TimeOffRequestsPanel } from '@/components/talent/TimeOffRequestsPanel';
import { ShiftTemplatesManager } from '@/components/talent/ShiftTemplatesManager';
import { StaffProfileSheet } from '@/components/talent/StaffProfileSheet';
import { useTalentAdvanced, StaffMemberExtended } from '@/hooks/useTalentAdvanced';
import { Users, CalendarDays, Clock, CalendarOff, LayoutTemplate, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';

const Talent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'talent';
  const [selectedStaff, setSelectedStaff] = useState<StaffMemberExtended | null>(null);

  const {
    loading,
    staff,
    timeOffRequests,
    shiftTemplates,
    setStaffAvailability,
    createTimeOffRequest,
    updateTimeOffRequest,
    createShiftTemplate,
    deleteShiftTemplate,
    updateStaffMember,
    addCertification
  } = useTalentAdvanced();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Talento y Turnos
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Gestión integral de tu equipo, disponibilidad y programación de turnos
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="talent" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Turnos
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Clock className="h-4 w-4" />
            Disponibilidad
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="gap-2">
            <CalendarOff className="h-4 w-4" />
            Ausencias
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="talent" className="mt-6">
          <TalentAIModule />
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-6">
          <StaffSchedule />
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <AvailabilityManager
            staff={staff}
            onSave={setStaffAvailability}
          />
        </TabsContent>

        <TabsContent value="timeoff" className="mt-6">
          <TimeOffRequestsPanel
            requests={timeOffRequests}
            staff={staff}
            onCreate={createTimeOffRequest}
            onUpdate={updateTimeOffRequest}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <ShiftTemplatesManager
            templates={shiftTemplates}
            onCreate={createShiftTemplate}
            onDelete={deleteShiftTemplate}
          />
        </TabsContent>
      </Tabs>

      {/* Staff Profile Sheet */}
      <StaffProfileSheet
        staff={selectedStaff}
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        onUpdate={updateStaffMember}
        onAddCertification={addCertification}
      />
    </div>
  );
};

export default Talent;
