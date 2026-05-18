import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = '' }) => (
  <div className={`bg-card p-6 rounded-xl shadow-md ${className}`}>
    <h3 className="text-lg font-lato-bold text-foreground mb-4">{title}</h3>
    <div className="h-80">{children}</div>
  </div>
);

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all font-lato-medium ${
      active
        ? 'bg-primary text-primary-foreground shadow-lg'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}
  >
    {icon}
    <span className="ml-4 font-lato-bold">{label}</span>
  </li>
);
