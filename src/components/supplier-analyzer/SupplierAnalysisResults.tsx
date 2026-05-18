import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package } from 'lucide-react';
import type { SupplierAnalysisResult } from '@/hooks/useSupplierAnalysis';
import { SupplierCard } from './SupplierCard';

export const SupplierAnalysisResults: React.FC<{ analysis: SupplierAnalysisResult }> = ({ analysis }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        Resultados: {analysis.item_name}
      </CardTitle>
      <CardDescription>
        {analysis.city}, {analysis.country} • {analysis.alternatives?.length || 0} proveedores encontrados
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {analysis.market_insights && (
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">Análisis del Mercado</h4>
          <p className="text-sm text-muted-foreground">{analysis.market_insights}</p>
        </div>
      )}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Recomendaciones</h4>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>{rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {analysis.alternatives?.map((supplier, idx) => (
          <SupplierCard key={idx} supplier={supplier} currentCost={analysis.current_cost} />
        ))}
      </div>
      {analysis.alternatives?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No se encontraron proveedores específicos para este producto.</p>
          <p className="text-sm">Intenta con términos más generales o verifica la ciudad.</p>
        </div>
      )}
    </CardContent>
  </Card>
);
