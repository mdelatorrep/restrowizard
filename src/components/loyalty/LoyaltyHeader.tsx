import { Button } from '@/components/ui/button';
import { Crown, Plus, Gift, Sparkles } from 'lucide-react';

interface Props {
  aiLoading: boolean;
  onAnalyze: () => void;
  onNewCustomer: () => void;
  onNewReward: () => void;
}

export const LoyaltyHeader = ({ aiLoading, onAnalyze, onNewCustomer, onNewReward }: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Crown className="w-6 h-6 text-primary" />
        Programa de Fidelización
      </h1>
      <p className="text-muted-foreground">Aumenta el lifetime value de tus clientes</p>
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={onAnalyze}
        disabled={aiLoading}
        className="gap-2 border-primary/30 hover:bg-primary/10"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        {aiLoading ? 'Analizando...' : 'Análisis IA'}
      </Button>
      <Button variant="outline" onClick={onNewCustomer}>
        <Plus className="w-4 h-4 mr-2" /> Cliente
      </Button>
      <Button onClick={onNewReward}>
        <Gift className="w-4 h-4 mr-2" /> Recompensa
      </Button>
    </div>
  </div>
);
