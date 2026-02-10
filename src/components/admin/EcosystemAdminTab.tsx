import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, GraduationCap, Wrench, Rocket } from 'lucide-react';
import restrojobsLogo from '@/assets/logos/restrojobs.png';
import restrolearnLogo from '@/assets/logos/restrolearn.png';
import restroservicesLogo from '@/assets/logos/restroservices.png';
import restrogrowthLogo from '@/assets/logos/restrogrowth.png';
import JobsAdminPanel from './JobsAdminPanel';
import LearnAdminPanel from './LearnAdminPanel';
import ProvidersAdminPanel from './ProvidersAdminPanel';
import GrowthAdminPanel from './GrowthAdminPanel';

const EcosystemAdminTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Gestión del Ecosistema</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <img src={restrojobsLogo} alt="" className="h-4 w-auto" />
              RestroJobs
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <img src={restrolearnLogo} alt="" className="h-4 w-auto" />
              RestroLearn
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <img src={restroservicesLogo} alt="" className="h-4 w-auto" />
              RestroServices
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center gap-2">
              <img src={restrogrowthLogo} alt="" className="h-4 w-auto" />
              RestroGrowth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs"><JobsAdminPanel /></TabsContent>
          <TabsContent value="courses"><LearnAdminPanel /></TabsContent>
          <TabsContent value="providers"><ProvidersAdminPanel /></TabsContent>
          <TabsContent value="growth"><GrowthAdminPanel /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EcosystemAdminTab;
