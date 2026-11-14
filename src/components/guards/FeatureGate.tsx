import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { FEATURES, type FeatureKey } from '@/config/features';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Ruta a la que se redirige si el módulo está apagado. */
  redirectTo?: string;
  /** En lugar de redirigir, muestra este aviso dentro del layout. */
  notice?: { title: string; description: string };
}

/**
 * Protege una ruta con un interruptor de producto (config/features).
 * Con el módulo apagado nadie llega a él, ni por el menú ni por URL directa.
 */
export const FeatureGate = ({ feature, children, redirectTo = '/', notice }: FeatureGateProps) => {
  if (FEATURES[feature]) return <>{children}</>;
  if (notice) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle>{notice.title}</CardTitle>
            <CardDescription>{notice.description}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }
  return <Navigate to={redirectTo} replace />;
};

export default FeatureGate;
