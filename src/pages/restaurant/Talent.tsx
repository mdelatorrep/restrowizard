import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, CalendarDays, Clock, CalendarOff, LayoutTemplate, GraduationCap, Gift, Loader2 } from 'lucide-react';
import TalentAIModule from '@/components/TalentAIModule';
import StaffSchedule from './StaffSchedule';
import { AvailabilityManager } from '@/components/talent/AvailabilityManager';
import { TimeOffRequestsPanel } from '@/components/talent/TimeOffRequestsPanel';
import { ShiftTemplatesManager } from '@/components/talent/ShiftTemplatesManager';
import { StaffProfileSheet } from '@/components/talent/StaffProfileSheet';
import { TrainingProgramsManager } from '@/components/talent/TrainingProgramsManager';
import { BenefitsManager } from '@/components/talent/BenefitsManager';
import { useTalentAdvanced, StaffMemberExtended } from '@/hooks/useTalentAdvanced';
import { useStaffDevelopment } from '@/hooks/useStaffDevelopment';
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

  const {
    loading: devLoading,
    programs,
    progress,
    trainingKPIs,
    benefits,
    assignments,
    benefitKPIs,
    createProgram,
    deleteProgram,
    assignTraining,
    updateProgress,
    createBenefit,
    deleteBenefit,
    assignBenefit,
    updateAssignment,
    removeAssignment,
  } = useStaffDevelopment();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading || devLoading) {
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
     { value: 'training', label: 'Formación', icon: GraduationCap },
     { value: 'benefits', label: 'Beneficios', icon: Gift },
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

         <TabsContent value="training">
          <TrainingProgramsManager
            programs={programs}
            progress={progress}
            kpis={trainingKPIs}
            staff={staff}
            onCreateProgram={createProgram}
            onDeleteProgram={deleteProgram}
            onAssignTraining={assignTraining}
            onUpdateProgress={updateProgress}
          />
         </TabsContent>

         <TabsContent value="benefits">
          <BenefitsManager
            benefits={benefits}
            assignments={assignments}
            kpis={benefitKPIs}
            staff={staff}
            onCreateBenefit={createBenefit}
            onDeleteBenefit={deleteBenefit}
            onAssignBenefit={assignBenefit}
            onUpdateAssignment={updateAssignment}
            onRemoveAssignment={removeAssignment}
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
