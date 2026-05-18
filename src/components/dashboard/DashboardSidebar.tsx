import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, BarChart2, MessageSquare, UtensilsCrossed, Sparkles,
  BookOpen, Warehouse, Users, DollarSign, Star, Briefcase, Bell, LogOut,
} from 'lucide-react';
import { NavItem } from './DashboardPrimitives';

interface Props {
  activeSection: string;
  onSelect: (section: string) => void;
  onSignOut: () => void;
}

const NAV = [
  { key: 'inicio', label: 'Inicio', icon: <LayoutDashboard /> },
  { key: 'menu-engineering', label: 'Menu Engineering', icon: <BarChart2 /> },
  { key: 'redes-sociales', label: 'Redes Sociales', icon: <MessageSquare /> },
  { key: 'analisis-sentimiento', label: 'Análisis de Sentimiento', icon: <Star /> },
  { key: 'inventario', label: 'Inventario', icon: <Warehouse /> },
  { key: 'personal', label: 'Personal', icon: <Users /> },
  { key: 'formacion', label: 'Formación', icon: <BookOpen /> },
  { key: 'empleos', label: 'Gestión de Empleos', icon: <Briefcase /> },
  { key: 'finanzas', label: 'Finanzas IA', icon: <DollarSign /> },
  { key: 'talento', label: 'Talento IA', icon: <Sparkles /> },
  { key: 'operaciones', label: 'Operaciones IA', icon: <UtensilsCrossed /> },
  { key: 'menu-inventario', label: 'Menú/Inventario IA', icon: <Warehouse /> },
  { key: 'notificaciones', label: 'Notificaciones', icon: <Bell /> },
];

export const DashboardSidebar = ({ activeSection, onSelect, onSignOut }: Props) => (
  <aside className="w-64 bg-card shadow-lg border-r">
    <div className="p-6">
      <img
        src="/lovable-uploads/4c50cd38-4342-44bc-9a98-cc6a1eba63f4.png"
        alt="RestroWizard"
        className="h-10 w-auto mb-8"
      />
      <nav>
        <ul className="space-y-1">
          {NAV.map(item => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.key}
              onClick={() => onSelect(item.key)}
            />
          ))}
        </ul>
      </nav>
    </div>
    <div className="absolute bottom-4 left-4 right-4">
      <Button variant="outline" onClick={onSignOut} className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar Sesión
      </Button>
    </div>
  </aside>
);
