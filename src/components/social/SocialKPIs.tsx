import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Props {
  kpis: {
    totalMentions?: number;
    avgSentiment?: number;
    positivePercent?: number;
    negativePercent?: number;
  } | null | undefined;
}

export const SocialKPIs: React.FC<Props> = ({ kpis }) => {
  const sentimentScore = kpis?.avgSentiment ? (kpis.avgSentiment * 100).toFixed(0) : '0';
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Menciones</p>
              <p className="text-3xl font-bold">{kpis?.totalMentions || 0}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Score Sentimiento</p>
              <p className="text-3xl font-bold">{sentimentScore}%</p>
            </div>
            {Number(sentimentScore) >= 70 ? (
              <TrendingUp className="h-8 w-8 text-green-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500" />
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Positivas</p>
              <p className="text-3xl font-bold text-green-600">{kpis?.positivePercent || 0}%</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Negativas</p>
              <p className="text-3xl font-bold text-red-600">{kpis?.negativePercent || 0}%</p>
            </div>
            <ThumbsDown className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
