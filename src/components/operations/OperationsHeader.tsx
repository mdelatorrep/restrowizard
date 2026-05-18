import React from 'react';
import { Brain, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  loading: boolean;
  onRunAnalysis: () => void;
}

export const OperationsHeader: React.FC<Props> = ({ loading, onRunAnalysis }) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-foreground flex items-center">
        <Brain className="mr-3 text-primary" size={32} />
        Operaciones Inteligentes y Experiencia del Cliente IA
      </h1>
      <p className="text-muted-foreground mt-2">
        Usando tecnología para operar con máxima eficiencia y entregar valor excepcional
      </p>
    </div>
    <div className="flex items-center gap-3">
      <Button onClick={onRunAnalysis} disabled={loading} className="bg-primary hover:bg-primary/90">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
        Análisis IA
      </Button>
      <Badge variant="secondary" className="bg-primary/10 text-primary">IA Activa</Badge>
    </div>
  </div>
);
