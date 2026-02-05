import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReports } from '@/components/pos/SalesReports';
import { SalesGoalsContent } from './SalesGoals';
import { BarChart3, Target } from 'lucide-react';

const POSReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'reports';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Reportes y Metas
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Análisis de ventas y seguimiento de objetivos
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            Metas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="mt-6">
          <SalesReports />
        </TabsContent>
        
        <TabsContent value="goals" className="mt-6">
          <SalesGoalsContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default POSReports;
