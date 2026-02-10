import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, GraduationCap, Wrench, Rocket } from 'lucide-react';
import restrojobsLogo from '@/assets/logos/restrojobs.png';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import restroservicesLogo from '@/assets/logos/restroservices.png';
import restrogrowthLogo from '@/assets/logos/restrogrowth.png';
import JobsAdminPanel from '@/components/admin/JobsAdminPanel';
import JobsStatsPanel from '@/components/admin/JobsStatsPanel';
import CandidatesManager from '@/components/admin/CandidatesManager';
import LearnAdminPanel from '@/components/admin/LearnAdminPanel';
import ServicesAdminPanel from '@/components/admin/ServicesAdminPanel';
import GrowthAdminPanel from '@/components/admin/GrowthAdminPanel';
import EcosystemDashboard from '@/components/admin/EcosystemDashboard';

const EcosystemAdmin: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Administración del Ecosistema
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Gestión centralizada de todas las soluciones RestroWizard
        </p>
      </div>

      <EcosystemDashboard />

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <img src={restrojobsLogo} alt="" className="h-4 w-auto" />
            RestroJobs
          </TabsTrigger>
          <TabsTrigger value="learn" className="flex items-center gap-2">
            <img src={restrolearnLogo} alt="" className="h-4 w-auto" />
            RestroLearn
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <img src={restroservicesLogo} alt="" className="h-4 w-auto" />
            RestroServices
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center gap-2">
            <img src={restrogrowthLogo} alt="" className="h-4 w-auto" />
            RestroGrowth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <div className="space-y-6">
            <Tabs defaultValue="listings" className="space-y-4">
              <TabsList className="h-auto gap-1">
                <TabsTrigger value="listings">Empleos</TabsTrigger>
                <TabsTrigger value="candidates">Candidatos</TabsTrigger>
                <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              </TabsList>
              <TabsContent value="listings"><JobsAdminPanel /></TabsContent>
              <TabsContent value="candidates"><CandidatesManager /></TabsContent>
              <TabsContent value="stats"><JobsStatsPanel /></TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="learn"><LearnAdminPanel /></TabsContent>
        <TabsContent value="services"><ServicesAdminPanel /></TabsContent>
        <TabsContent value="growth"><GrowthAdminPanel /></TabsContent>
      </Tabs>
    </div>
  );
};

export default EcosystemAdmin;
