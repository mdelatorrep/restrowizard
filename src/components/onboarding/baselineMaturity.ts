import { BusinessProject } from '@/hooks/useBusinessProject';

export type MaturityLevel = 'inicial' | 'basico' | 'intermedio' | 'avanzado' | 'experto';

export interface BaselineMaturity {
  answers: Record<number, number>;
  pillarScores: Record<string, number>;
  overallScore: number;
  level: MaturityLevel;
}

const phaseToMaturityPillar: Record<string, string> = {
  legal_requirements: 'legal_compliance',
  location_analysis: 'operations',
  equipment_setup: 'operations',
  supplier_network: 'supply_chain',
  staffing_plan: 'talent',
  marketing_launch: 'marketing',
  financial_projection: 'finances',
};

export function generateBaselineMaturityFromProject(
  _project: BusinessProject,
  analyses: any[]
): BaselineMaturity {
  const pillarScores: Record<string, number> = {
    finances: 2.0,
    operations: 2.0,
    talent: 2.0,
    marketing: 2.0,
    supply_chain: 2.0,
    technology: 1.5,
    customer_experience: 1.5,
    sustainability: 1.0,
  };

  (analyses || []).forEach((analysis) => {
    const pillar = phaseToMaturityPillar[analysis.phase];
    if (pillar && pillarScores[pillar] !== undefined) {
      pillarScores[pillar] = Math.min(pillarScores[pillar] + 0.5, 3.5);
    }
  });

  const scores = Object.values(pillarScores);
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  let level: MaturityLevel = 'inicial';
  if (overallScore >= 4) level = 'experto';
  else if (overallScore >= 3) level = 'avanzado';
  else if (overallScore >= 2.5) level = 'intermedio';
  else if (overallScore >= 2) level = 'basico';

  const answers: Record<number, number> = {};
  for (let i = 0; i < 8; i++) answers[i] = Math.round(overallScore);

  return { answers, pillarScores, overallScore, level };
}
