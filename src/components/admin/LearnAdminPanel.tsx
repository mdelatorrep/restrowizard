import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CoursesAdminPanel from './CoursesAdminPanel';
import LessonsManager from './LessonsManager';
import TracksManager from './TracksManager';
import AIContentGenerator from './AIContentGenerator';
import { BookOpen, FileText, GraduationCap, Sparkles } from 'lucide-react';

const LearnAdminPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="courses" className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Cursos</TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2"><FileText className="h-4 w-4" />Lecciones</TabsTrigger>
          <TabsTrigger value="tracks" className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Rutas</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Generador IA</TabsTrigger>
        </TabsList>
        <TabsContent value="courses"><CoursesAdminPanel /></TabsContent>
        <TabsContent value="lessons"><LessonsManager /></TabsContent>
        <TabsContent value="tracks"><TracksManager /></TabsContent>
        <TabsContent value="ai"><AIContentGenerator /></TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnAdminPanel;
