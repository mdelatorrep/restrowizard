import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export const AIInsightsCard: React.FC<{ insights: string; title?: string }> = ({
  insights,
  title = 'Análisis Financiero IA',
}) => {
  if (!insights) return null;
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-primary text-lg">
          <Brain className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
          {insights}
        </div>
      </CardContent>
    </Card>
  );
};
