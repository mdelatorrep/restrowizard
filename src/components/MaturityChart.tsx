import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { maturityModel } from '@/data/maturityModel';

interface Props {
  pillarScores: Record<string, number>;
}

const MaturityChart: React.FC<Props> = ({ pillarScores }) => {
  const data = maturityModel.pillars.map(pillar => ({
    pillar: pillar.name,
    score: pillarScores[pillar.id] || 0
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--muted))" />
        <PolarAngleAxis 
          dataKey="pillar" 
          tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
          className="font-lato-medium"
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 5]} 
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Radar
          name="Nivel de Madurez"
          dataKey="score"
          stroke="hsl(var(--secondary))"
          fill="hsl(var(--secondary) / 0.2)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default MaturityChart;