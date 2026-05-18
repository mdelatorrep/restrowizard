import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import JobsManagement from '@/components/JobsManagement';
import FinancesAIModule from '@/components/FinancesAIModule';
import TalentAIModule from '@/components/TalentAIModule';
import OperationsAIModule from '@/components/OperationsAIModule';
import MenuInventoryAIModule from '@/components/MenuInventoryAIModule';
import NotificationSettings from '@/components/NotificationSettings';
import { useAIAlerts } from '@/hooks/useAIAlerts';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MenuEngineeringModule } from '@/components/dashboard/MenuEngineeringModule';
import { SocialMediaModule } from '@/components/dashboard/SocialMediaModule';
import { SentimentAnalysisModule } from '@/components/dashboard/SentimentAnalysisModule';
import { InventoryModule, ShiftsModule, TrainingModule } from '@/components/dashboard/SimpleModules';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('inicio');
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { sendAIAlert } = useAIAlerts();
  const { stats, recentActivity, userProfile, loading: dashboardLoading, hasDiagnosis } = useDashboard();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      sendAIAlert({
        type: 'inventory_low',
        title: 'Alerta de Inventario',
        message: 'El stock de ingredientes principales está bajo. Se recomienda realizar pedido.',
        severity: 'medium',
        data: { inventory_level: 15, threshold: 20 },
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [sendAIAlert]);

  if (authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!hasDiagnosis && activeSection === 'inicio') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="max-w-md mx-auto p-8 bg-card rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">¡Bienvenido a RestroWizard!</h2>
          <p className="text-muted-foreground mb-6">
            Para comenzar, necesitamos conocer mejor tu restaurante.
            Completa nuestro diagnóstico para obtener recomendaciones personalizadas.
          </p>
          <Button onClick={() => navigate('/diagnosis')} className="w-full" size="lg">
            Realizar Diagnóstico
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar activeSection={activeSection} onSelect={setActiveSection} onSignOut={signOut} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8 overflow-y-auto">
          {activeSection === 'inicio' && <DashboardHome stats={stats} recentActivity={recentActivity} userProfile={userProfile} loading={dashboardLoading} />}
          {activeSection === 'menu-engineering' && <MenuEngineeringModule />}
          {activeSection === 'redes-sociales' && <SocialMediaModule />}
          {activeSection === 'analisis-sentimiento' && <SentimentAnalysisModule />}
          {activeSection === 'inventario' && <InventoryModule />}
          {activeSection === 'personal' && <ShiftsModule />}
          {activeSection === 'formacion' && <TrainingModule />}
          {activeSection === 'empleos' && <JobsManagement />}
          {activeSection === 'finanzas' && <FinancesAIModule />}
          {activeSection === 'talento' && <TalentAIModule />}
          {activeSection === 'operaciones' && <OperationsAIModule />}
          {activeSection === 'menu-inventario' && <MenuInventoryAIModule />}
          {activeSection === 'notificaciones' && <NotificationSettings />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
