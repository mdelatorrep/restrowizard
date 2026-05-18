import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Star, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  kpis: {
    totalFeedback?: number;
    avgRating?: number;
    positivePercent?: number;
    negativePercent?: number;
  } | null;
}

export const FeedbackKPIs = ({ kpis }: Props) => (
  <div className="grid md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Feedback</p>
            <p className="text-3xl font-bold">{kpis?.totalFeedback || 0}</p>
          </div>
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="text-3xl font-bold">{kpis?.avgRating?.toFixed(1) || '-'}</p>
          </div>
          <Star className="h-8 w-8 text-yellow-500" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Positivos</p>
            <p className="text-3xl font-bold text-green-600">{kpis?.positivePercent || 0}%</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Negativos</p>
            <p className="text-3xl font-bold text-red-600">{kpis?.negativePercent || 0}%</p>
          </div>
          <TrendingDown className="h-8 w-8 text-red-500" />
        </div>
      </CardContent>
    </Card>
  </div>
);
