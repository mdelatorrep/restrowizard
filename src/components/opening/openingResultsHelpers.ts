import {
  Scale, MapPin, ChefHat, Truck, Users, Megaphone, TrendingUp, Clock, Rocket, ListChecks,
} from 'lucide-react';
import { PhaseId } from '@/hooks/useBusinessOpening';
import type { PhaseAnalysis, BusinessProject, ChecklistItem } from '@/hooks/useBusinessProject';

export const PHASE_ICONS: Record<PhaseId, React.ElementType> = {
  legal_requirements: Scale,
  location_analysis: MapPin,
  equipment_setup: ChefHat,
  supplier_network: Truck,
  staffing_plan: Users,
  marketing_launch: Megaphone,
  financial_projection: TrendingUp,
};

export const PHASE_COLORS: Record<PhaseId, { bg: string; text: string; border: string }> = {
  legal_requirements: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  location_analysis: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  equipment_setup: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  supplier_network: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
  staffing_plan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  marketing_launch: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30' },
  financial_projection: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
};

export const PHASE_DESCRIPTIONS: Record<PhaseId, string> = {
  legal_requirements: 'Permisos, licencias y requisitos legales',
  location_analysis: 'Análisis de la zona y competencia',
  equipment_setup: 'Equipamiento y mobiliario necesario',
  supplier_network: 'Proveedores y cadena de suministro',
  staffing_plan: 'Estructura de personal y contratación',
  marketing_launch: 'Estrategia de marketing y lanzamiento',
  financial_projection: 'Proyecciones financieras y ROI',
};

export const CHECKLIST_PHASE_ORDER = [
  'planning', 'legal', 'location', 'equipment', 'suppliers', 'staffing', 'marketing', 'pre_opening', 'opening',
];

export const CHECKLIST_PHASE_LABELS: Record<string, string> = {
  planning: 'Planeación', legal: 'Legal y Permisos', location: 'Ubicación', equipment: 'Equipamiento',
  suppliers: 'Proveedores', staffing: 'Personal', marketing: 'Marketing', pre_opening: 'Pre-Apertura', opening: 'Apertura',
};

export const CHECKLIST_PHASE_ICONS: Record<string, React.ElementType> = {
  planning: TrendingUp, legal: Scale, location: MapPin, equipment: ChefHat, suppliers: Truck,
  staffing: Users, marketing: Megaphone, pre_opening: Clock, opening: Rocket,
};

export function getAnalysisContent(analysis: PhaseAnalysis): string {
  const data = analysis?.analysis_data;
  if (!data) return 'Sin contenido de análisis disponible.';
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data !== null) {
    if ('text' in data && typeof data.text === 'string' && data.text.length > 0) return data.text;
    if ('analysis' in data && typeof data.analysis === 'string' && data.analysis.length > 0) return data.analysis;
    if ('structured' in data && data.structured && typeof data.structured === 'object') {
      const s = data.structured as Record<string, unknown>;
      if ('text' in s && typeof s.text === 'string') return s.text;
    }
    for (const key of Object.keys(data)) {
      const v = (data as Record<string, unknown>)[key];
      if (typeof v === 'string' && v.length > 100) return v;
    }
    return JSON.stringify(data, null, 2);
  }
  return 'Sin contenido de análisis disponible.';
}

export function getRecommendations(analysis: PhaseAnalysis): string[] {
  if (Array.isArray(analysis.recommendations)) return analysis.recommendations;
  if (analysis.analysis_data?.structured?.recommendations) return analysis.analysis_data.structured.recommendations;
  const textContent = getAnalysisContent(analysis);
  if (textContent && textContent.length > 100) {
    const lines = textContent.split('\n').filter((line) => {
      const t = line.trim();
      if (t.length < 15) return false;
      if (t.match(/^#+\s*(Resumen|Puntos|Próximo|Inversión|Costos|Métricas|---)/i)) return false;
      if (t.startsWith('-') || t.startsWith('•') || t.startsWith('→')) return t.length > 20 && t.length < 200;
      return false;
    });
    return lines.slice(0, 4).map((l) =>
      l.replace(/^[-•→]+\s*/, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
    );
  }
  return [];
}

export function getPhaseHighlight(
  analysis: PhaseAnalysis,
  phaseId: PhaseId
): { label: string; value: string } | null {
  const textContent = getAnalysisContent(analysis);
  const patterns: Record<PhaseId, RegExp[]> = {
    legal_requirements: [/(\d+)\s*(permisos?|licencias?|días?)/i, /(RUT|NIT|Sayco)/i],
    location_analysis: [/(\d+)\s*(m²|metros)/i, /arriendos?\s*[:\s]*\$?\s*([\d,.]+)/i],
    equipment_setup: [/\$([\d,.]+)\s*[–-]\s*\$([\d,.]+)/i, /(\d+[-–]\d+)\s*(indispensables|equipos)/i],
    supplier_network: [/(\d+)\s*(proveedores?|días?)/i, /margen\s*[:\s]*(\d+%)/i],
    staffing_plan: [/(\d+)\s*(FTE|empleados?|personas?)/i, /nómina\s*[:\s]*\$?([\d,.]+)/i],
    marketing_launch: [/(\d+)\s*(días?|semanas?)/i, /WhatsApp|Instagram|redes/i],
    financial_projection: [/≥?(\d+)\s*tickets?\/día/i, /ROI\s*[:\s]*(\d+%)/i, /break.?even\s*[:\s]*(\d+)/i],
  };
  for (const pattern of patterns[phaseId] || []) {
    const match = textContent.match(pattern);
    if (match) {
      switch (phaseId) {
        case 'legal_requirements':
          return { label: 'Trámites', value: match[0].includes('días') ? match[0] : `${match[1]} requeridos` };
        case 'location_analysis':
          return { label: 'Referencia', value: match[0].substring(0, 30) };
        case 'equipment_setup':
          return { label: 'Inversión', value: match[0].substring(0, 25) };
        case 'supplier_network':
          return { label: 'Red', value: match[0].substring(0, 25) };
        case 'staffing_plan':
          return { label: 'Equipo', value: match[1] + ' ' + (match[2] || 'personas') };
        case 'marketing_launch':
          return { label: 'Estrategia', value: match[0].substring(0, 25) };
        case 'financial_projection':
          return { label: 'Meta', value: match[0].substring(0, 25) };
      }
    }
  }
  return null;
}

export interface ProjectMetrics {
  totalInvestment: number;
  monthlyOperatingCost: number;
  estimatedRevenue: number;
  breakEvenMonths: number;
  roi: number;
}

export function calculateMetrics(project: BusinessProject, analyses: PhaseAnalysis[]): ProjectMetrics {
  let totalInvestment = project.estimated_budget || 0;
  let monthlyOperatingCost = 0;
  let estimatedRevenue = 0;

  analyses.forEach((analysis) => {
    if (analysis.estimated_cost && !project.estimated_budget) {
      if (analysis.phase === 'financial_projection') {
        totalInvestment += analysis.estimated_cost * 0.4;
        monthlyOperatingCost += analysis.estimated_cost * 0.1;
        estimatedRevenue += analysis.estimated_cost * 0.15;
      } else {
        totalInvestment += analysis.estimated_cost;
      }
    }
  });

  if (monthlyOperatingCost === 0 && totalInvestment > 0) monthlyOperatingCost = totalInvestment * 0.10;
  if (estimatedRevenue === 0 && totalInvestment > 0) estimatedRevenue = totalInvestment * 0.15;

  const monthlyProfit = estimatedRevenue - monthlyOperatingCost;
  let breakEvenMonths = 12;
  if (monthlyProfit > 0 && totalInvestment > 0) breakEvenMonths = Math.ceil(totalInvestment / monthlyProfit);

  const annualProfit = monthlyProfit * 12;
  const roi = totalInvestment > 0 ? (annualProfit / totalInvestment) * 100 : 0;

  return {
    totalInvestment,
    monthlyOperatingCost,
    estimatedRevenue,
    breakEvenMonths: Math.min(Math.max(breakEvenMonths, 6), 36),
    roi: Math.max(roi, 0),
  };
}

export function groupChecklistByPhase(checklist: ChecklistItem[]) {
  const groups: Record<string, ChecklistItem[]> = {};
  checklist.forEach((item) => {
    const phase = item.phase || 'planning';
    if (!groups[phase]) groups[phase] = [];
    groups[phase].push(item);
  });
  Object.keys(groups).forEach((p) => groups[p].sort((a, b) => a.sort_order - b.sort_order));
  return groups;
}
