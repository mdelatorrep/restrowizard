 import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
 import { Users, CalendarDays, Clock, CalendarOff, LayoutTemplate, Loader2 } from 'lucide-react';
 import TalentAIModule from '@/components/TalentAIModule';
 import StaffSchedule from './StaffSchedule';
 import { AvailabilityManager } from '@/components/talent/AvailabilityManager';
 import { TimeOffRequestsPanel } from '@/components/talent/TimeOffRequestsPanel';
 import { ShiftTemplatesManager } from '@/components/talent/ShiftTemplatesManager';
 import { StaffProfileSheet } from '@/components/talent/StaffProfileSheet';
 import { useTalentAdvanced, StaffMemberExtended } from '@/hooks/useTalentAdvanced';
 import { ModulePageLayout, PageHeader, ResponsiveTabs, TabsContent } from '@/components/layout';

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
       <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

   const tabs = [
     { value: 'talent', label: 'Equipo', icon: Users },
     { value: 'schedule', label: 'Turnos', icon: CalendarDays },
     { value: 'availability', label: 'Disponibilidad', icon: Clock },
     { value: 'timeoff', label: 'Ausencias', icon: CalendarOff },
     { value: 'templates', label: 'Plantillas', icon: LayoutTemplate },
   ];
 
  return (
     <ModulePageLayout>
       <PageHeader
         title="Talento y Turnos"
         description="Gestión integral de tu equipo, disponibilidad y programación de turnos"
         icon={Users}
       />
 
       <ResponsiveTabs tabs={tabs} value={activeTab} onValueChange={handleTabChange}>
         <TabsContent value="talent">
          <TalentAIModule />
        </TabsContent>
 
         <TabsContent value="schedule">
          <StaffSchedule />
        </TabsContent>

         <TabsContent value="availability">
          <AvailabilityManager
            staff={staff}
            onSave={setStaffAvailability}
          />
        </TabsContent>

         <TabsContent value="timeoff">
          <TimeOffRequestsPanel
            requests={timeOffRequests}
            staff={staff}
            onCreate={createTimeOffRequest}
            onUpdate={updateTimeOffRequest}
          />
        </TabsContent>

         <TabsContent value="templates">
          <ShiftTemplatesManager
            templates={shiftTemplates}
            onCreate={createShiftTemplate}
            onDelete={deleteShiftTemplate}
          />
        </TabsContent>
       </ResponsiveTabs>

      {/* Staff Profile Sheet */}
      <StaffProfileSheet
        staff={selectedStaff}
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        onUpdate={updateStaffMember}
        onAddCertification={addCertification}
      />
     </ModulePageLayout>
  );
};

export default Talent;
