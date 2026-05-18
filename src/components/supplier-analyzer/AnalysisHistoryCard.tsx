import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupplierAnalysisResult } from '@/hooks/useSupplierAnalysis';
import { SupplierCard } from './SupplierCard';

interface Props {
  analysis: SupplierAnalysisResult;
  onDelete: (id: string) => void;
}

export const AnalysisHistoryCard: React.FC<Props> = ({ analysis, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {analysis.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-500" />
              : analysis.status === 'error' ? <AlertCircle className="h-4 w-4 text-destructive" />
              : <Loader2 className="h-4 w-4 animate-spin" />}
            <div>
              <CardTitle className="text-sm font-medium">{analysis.item_name}</CardTitle>
              <CardDescription className="text-xs">
                {analysis.city} • {format(new Date(analysis.created_at), 'd MMM yyyy, HH:mm', { locale: es })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis.potential_savings && analysis.potential_savings > 0 && (
              <Badge variant="secondary" className="text-green-600">
                Hasta {analysis.potential_savings.toFixed(0)}% ahorro
              </Badge>
            )}
            <Badge variant="outline">{analysis.alternatives?.length || 0} proveedores</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onDelete(analysis.id); }}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-2">
          {analysis.market_insights && (
            <p className="text-sm text-muted-foreground mb-3">{analysis.market_insights}</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.alternatives?.map((supplier, idx) => (
              <SupplierCard key={idx} supplier={supplier} currentCost={analysis.current_cost} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
