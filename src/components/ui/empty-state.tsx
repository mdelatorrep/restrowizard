import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Plus, TrendingUp, Brain } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FileQuestion className="h-16 w-16 text-muted-foreground/50" />,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
        <div className="flex gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction}>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ModuleEmptyStateProps {
  moduleName: string;
  description: string;
  features: string[];
  onGetStarted?: () => void;
}

export const ModuleEmptyState: React.FC<ModuleEmptyStateProps> = ({
  moduleName,
  description,
  features,
  onGetStarted
}) => {
  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Configura {moduleName}
          </h2>
          
          <p className="text-muted-foreground mb-6">{description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-left p-3 bg-background rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          {onGetStarted && (
            <Button size="lg" onClick={onGetStarted}>
              <Plus className="h-5 w-5 mr-2" />
              Comenzar a Registrar Datos
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface BenchmarkComparisonProps {
  label: string;
  userValue: number;
  benchmarkValue: number;
  unit?: string;
  higherIsBetter?: boolean;
}

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  label,
  userValue,
  benchmarkValue,
  unit = '%',
  higherIsBetter = true
}) => {
  const difference = userValue - benchmarkValue;
  const isPositive = higherIsBetter ? difference > 0 : difference < 0;
  const percentDiff = ((difference / benchmarkValue) * 100).toFixed(1);
  
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Promedio industria: {benchmarkValue.toFixed(1)}{unit}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold">{userValue.toFixed(1)}{unit}</p>
        <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {difference > 0 ? '+' : ''}{percentDiff}% vs industria
        </p>
      </div>
    </div>
  );
};
