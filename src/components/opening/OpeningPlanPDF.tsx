import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { BusinessProject, PhaseAnalysis, ChecklistItem } from '@/hooks/useBusinessProject';
import { formatCurrencyByCountry, getCurrencyCode } from '@/data/constants';
import { PHASES } from '@/hooks/useBusinessOpening';

// Register fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf',
      fontWeight: 700,
    },
  ],
});

// Brand colors
const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  secondary: '#059669',
  secondaryLight: '#D1FAE5',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  orange: '#F97316',
  orangeLight: '#FFEDD5',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  cyan: '#06B6D4',
  cyanLight: '#CFFAFE',
  text: '#1F2937',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  background: '#F9FAFB',
  white: '#FFFFFF',
};

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Open Sans',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.primary,
  },
  logoSubtext: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerDate: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  // Title section
  titleSection: {
    marginBottom: 25,
    padding: 18,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  // Business Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  infoItem: {
    width: '48%',
    padding: 10,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.text,
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.text,
  },
  // Summary card
  summaryCard: {
    padding: 14,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: COLORS.text,
  },
  // Phase Summary Cards (Overview)
  phaseSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  phaseSummaryCard: {
    width: '31%',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    backgroundColor: COLORS.background,
  },
  phaseSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  phaseSummaryIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseSummaryTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.text,
    flex: 1,
  },
  phaseSummaryHighlight: {
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  phaseSummaryHighlightLabel: {
    fontSize: 6,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  phaseSummaryHighlightValue: {
    fontSize: 8,
    fontWeight: 600,
    marginTop: 2,
  },
  phaseSummaryBadges: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  phaseBadge: {
    fontSize: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    color: COLORS.textMuted,
  },
  phaseSummaryPoints: {
    marginTop: 4,
  },
  phasePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  phasePointDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    marginRight: 5,
  },
  phasePointText: {
    fontSize: 7,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 1.4,
  },
  // Urgent Actions
  urgentActionsCard: {
    padding: 14,
    backgroundColor: COLORS.orangeLight,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
    marginBottom: 20,
  },
  urgentActionsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.orange,
    marginBottom: 10,
  },
  urgentActionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.orange + '30',
  },
  urgentActionNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.orange,
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 8,
  },
  urgentActionContent: {
    flex: 1,
  },
  urgentActionTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: 2,
  },
  urgentActionDesc: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  // Detailed Analysis
  analysisCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  analysisIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.text,
    flex: 1,
  },
  analysisBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  analysisBadge: {
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    fontWeight: 600,
  },
  analysisSection: {
    marginBottom: 8,
  },
  analysisSectionTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  analysisContent: {
    fontSize: 8,
    lineHeight: 1.5,
    color: COLORS.textMuted,
  },
  analysisBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 3,
    marginRight: 6,
  },
  bulletText: {
    fontSize: 8,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 1.4,
  },
  // Checklist
  checklistPhase: {
    marginBottom: 14,
  },
  checklistPhaseTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.primary,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  checkMark: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 700,
  },
  checklistText: {
    flex: 1,
    fontSize: 8,
    color: COLORS.text,
  },
  checklistTextCompleted: {
    color: COLORS.textMuted,
    textDecoration: 'line-through',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.textMuted,
  },
  pageNumber: {
    fontSize: 7,
    color: COLORS.textMuted,
  },
});

// Phase color mapping
const PHASE_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  legal_requirements: { border: '#8B5CF6', bg: '#EDE9FE', text: '#7C3AED' },
  location_analysis: { border: '#3B82F6', bg: '#DBEAFE', text: '#2563EB' },
  equipment_setup: { border: '#F97316', bg: '#FFEDD5', text: '#EA580C' },
  supplier_network: { border: '#10B981', bg: '#D1FAE5', text: '#059669' },
  staffing_plan: { border: '#06B6D4', bg: '#CFFAFE', text: '#0891B2' },
  marketing_launch: { border: '#EC4899', bg: '#FCE7F3', text: '#DB2777' },
  financial_projection: { border: '#F59E0B', bg: '#FEF3C7', text: '#D97706' },
};

// Phase labels
const PHASE_LABELS: Record<string, string> = {
  legal_requirements: 'Requisitos Legales',
  location_analysis: 'Análisis de Ubicación',
  equipment_setup: 'Equipamiento',
  supplier_network: 'Proveedores',
  staffing_plan: 'Personal',
  marketing_launch: 'Marketing y Lanzamiento',
  financial_projection: 'Proyección Financiera',
};

// Phase descriptions
const PHASE_DESCRIPTIONS: Record<string, string> = {
  legal_requirements: 'Permisos, licencias y requisitos legales',
  location_analysis: 'Análisis de la zona y competencia',
  equipment_setup: 'Equipamiento y mobiliario necesario',
  supplier_network: 'Proveedores y cadena de suministro',
  staffing_plan: 'Estructura de personal y contratación',
  marketing_launch: 'Estrategia de marketing y lanzamiento',
  financial_projection: 'Proyecciones financieras y ROI',
};

// Checklist phase labels
const CHECKLIST_PHASE_LABELS: Record<string, string> = {
  planning: 'Planeación',
  legal: 'Legal y Permisos',
  location: 'Ubicación',
  equipment: 'Equipamiento',
  suppliers: 'Proveedores',
  staffing: 'Personal',
  marketing: 'Marketing',
  pre_opening: 'Pre-Apertura',
  opening: 'Apertura',
};

interface OpeningPlanPDFProps {
  project: BusinessProject;
  analyses: PhaseAnalysis[];
  checklist: ChecklistItem[];
  metrics: {
    totalInvestment: number;
    roi: number;
    breakEvenMonths: number;
  };
}

// Helper to clean markdown from text
function cleanMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-•→]\s*/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Helper to extract analysis content
function getAnalysisText(analysis: PhaseAnalysis): string {
  const data = analysis?.analysis_data;
  if (!data) return '';
  if (typeof data === 'string') return cleanMarkdown(data);
  if (typeof data === 'object' && data !== null) {
    if ('text' in data && typeof data.text === 'string') {
      return cleanMarkdown(data.text);
    }
    if ('analysis' in data && typeof data.analysis === 'string') {
      return cleanMarkdown(data.analysis);
    }
  }
  return '';
}

// Parse content into sections
function parseSections(content: string): Array<{ title: string; bullets: string[] }> {
  const sections: Array<{ title: string; bullets: string[] }> = [];
  const lines = content.split('\n');
  
  let currentSection: { title: string; bullets: string[] } | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for section headers (## or bold text at start)
    if (trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
      if (currentSection && currentSection.bullets.length > 0) {
        sections.push(currentSection);
      }
      const title = trimmed.replace(/^##\s*/, '').replace(/\*\*/g, '').trim();
      currentSection = { title, bullets: [] };
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('→')) {
      const bullet = trimmed.replace(/^[•\-→]\s*/, '').trim();
      if (bullet.length > 10 && bullet.length < 200) {
        if (currentSection) {
          currentSection.bullets.push(bullet);
        } else {
          if (sections.length === 0) {
            sections.push({ title: 'Resumen', bullets: [bullet] });
          } else {
            sections[sections.length - 1].bullets.push(bullet);
          }
        }
      }
    }
  }
  
  if (currentSection && currentSection.bullets.length > 0) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Get key recommendations from analysis
function getRecommendations(analysis: PhaseAnalysis): string[] {
  if (Array.isArray(analysis.recommendations)) {
    return analysis.recommendations.slice(0, 3);
  }
  const content = getAnalysisText(analysis);
  if (!content) return [];
  
  const bullets = content.split('\n')
    .filter(line => {
      const t = line.trim();
      return (t.startsWith('•') || t.startsWith('-') || t.startsWith('→')) && t.length > 20 && t.length < 150;
    })
    .map(l => l.replace(/^[•\-→]\s*/, '').replace(/\*\*/g, '').trim())
    .slice(0, 3);
  
  return bullets;
}

// Get phase highlight
function getPhaseHighlight(analysis: PhaseAnalysis, phaseId: string): { label: string; value: string } | null {
  const content = getAnalysisText(analysis);
  if (!content) return null;
  
  const patterns: Record<string, RegExp[]> = {
    legal_requirements: [/(\d+)\s*(permisos?|licencias?|días?)/i],
    location_analysis: [/(\d+)\s*(m²|metros)/i, /arriendos?\s*[:\s]*\$?\s*([\d,.]+)/i],
    equipment_setup: [/\$([\d,.]+)\s*[–-]\s*\$([\d,.]+)/i, /(\d+)\s*(equipos?)/i],
    supplier_network: [/(\d+)\s*(proveedores?)/i, /margen\s*[:\s]*(\d+%)/i],
    staffing_plan: [/(\d+)\s*(FTE|empleados?|personas?)/i],
    marketing_launch: [/(\d+)\s*(días?|semanas?)/i],
    financial_projection: [/≥?(\d+)\s*tickets?\/día/i, /ROI\s*[:\s]*(\d+%)/i],
  };

  const phasePatterns = patterns[phaseId] || [];
  for (const pattern of phasePatterns) {
    const match = content.match(pattern);
    if (match) {
      return {
        label: PHASE_DESCRIPTIONS[phaseId]?.split(' ')[0] || 'Referencia',
        value: match[0].substring(0, 30),
      };
    }
  }
  return null;
}

// Truncate text
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max - 3) + '...';
}

export function OpeningPlanPDF({ project, analyses, checklist, metrics }: OpeningPlanPDFProps) {
  const formatCurrency = (value: number) => formatCurrencyByCountry(value, project.country);
  const currencyCode = getCurrencyCode(project.country);
  const generatedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Group checklist by phase
  const groupedChecklist: Record<string, ChecklistItem[]> = {};
  checklist.forEach(item => {
    const phase = item.phase || 'planning';
    if (!groupedChecklist[phase]) groupedChecklist[phase] = [];
    groupedChecklist[phase].push(item);
  });

  const checklistPhaseOrder = ['planning', 'legal', 'location', 'equipment', 'suppliers', 'staffing', 'marketing', 'pre_opening', 'opening'];

  // Get urgent items
  const urgentItems = checklist.filter(item => !item.is_completed).slice(0, 5);

  // Get completed analyses
  const completedAnalyses = analyses.filter(a => a.status === 'completed');

  // Calculate days until opening
  const daysUntilOpening = project.target_opening_date
    ? Math.ceil((new Date(project.target_opening_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Document>
      {/* Page 1: Business Info, Metrics & Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>RestroWizard</Text>
            <Text style={styles.logoSubtext}>Plan de Apertura Inteligente</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>Generado: {generatedDate}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{project.project_name}</Text>
          <Text style={styles.subtitle}>
            {project.business_type} • {project.cuisine_type || 'Gastronomía general'} • {project.city}, {project.country}
          </Text>
        </View>

        {/* Section 1: Business Info */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>1</Text>
          <Text style={styles.sectionTitle}>Información del Negocio</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nombre del Proyecto</Text>
            <Text style={styles.infoValue}>{project.project_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipo de Negocio</Text>
            <Text style={styles.infoValue}>{project.business_type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipo de Cocina</Text>
            <Text style={styles.infoValue}>{project.cuisine_type || 'Por definir'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Ubicación</Text>
            <Text style={styles.infoValue}>
              {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}, {project.country}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Presupuesto Estimado</Text>
            <Text style={styles.infoValue}>
              {project.estimated_budget ? formatCurrency(project.estimated_budget) : 'Por definir'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha Objetivo de Apertura</Text>
            <Text style={styles.infoValue}>
              {project.target_opening_date 
                ? new Date(project.target_opening_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Por definir'}
            </Text>
          </View>
        </View>

        {/* Section 2: Key Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>2</Text>
          <Text style={styles.sectionTitle}>Cifras Clave</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: COLORS.primaryLight }]}>
            <Text style={[styles.metricValue, { color: COLORS.primary }]}>
              {metrics.totalInvestment > 0 ? formatCurrency(metrics.totalInvestment) : '—'}
            </Text>
            <Text style={styles.metricLabel}>Inversión Total ({currencyCode})</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: COLORS.secondaryLight }]}>
            <Text style={[styles.metricValue, { color: COLORS.secondary }]}>
              {metrics.roi > 0 ? `${metrics.roi.toFixed(0)}%` : '—'}
            </Text>
            <Text style={styles.metricLabel}>ROI Anual Proyectado</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: COLORS.blueLight }]}>
            <Text style={[styles.metricValue, { color: COLORS.blue }]}>
              {metrics.breakEvenMonths} meses
            </Text>
            <Text style={styles.metricLabel}>Punto de Equilibrio</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: COLORS.orangeLight }]}>
            <Text style={[styles.metricValue, { color: COLORS.orange }]}>
              {daysUntilOpening !== null ? `${daysUntilOpening}` : '—'}
            </Text>
            <Text style={styles.metricLabel}>{daysUntilOpening !== null ? 'Días hasta Apertura' : 'Fecha por Definir'}</Text>
          </View>
        </View>

        {/* Section 3: Executive Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>3</Text>
          <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Este plan de apertura ha sido generado para {project.project_name}, 
            un {project.business_type.toLowerCase()} de {project.cuisine_type?.toLowerCase() || 'gastronomía'} ubicado en {project.city}, {project.country}. 
            El análisis cubre requisitos legales, ubicación, equipamiento, proveedores, personal, marketing y proyecciones financieras.
            {metrics.totalInvestment > 0 && ` Con una inversión estimada de ${formatCurrency(metrics.totalInvestment)}, 
            se proyecta un retorno anual del ${metrics.roi.toFixed(0)}% y punto de equilibrio en ${metrics.breakEvenMonths} meses.`}
          </Text>
        </View>

        {/* Urgent Actions */}
        {urgentItems.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>4</Text>
              <Text style={styles.sectionTitle}>Acciones Inmediatas</Text>
            </View>

            <View style={styles.urgentActionsCard}>
              <Text style={styles.urgentActionsTitle}>⚡ Las primeras tareas que debes completar</Text>
              {urgentItems.map((item, index) => (
                <View key={item.id} style={styles.urgentActionItem}>
                  <Text style={styles.urgentActionNumber}>{index + 1}</Text>
                  <View style={styles.urgentActionContent}>
                    <Text style={styles.urgentActionTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.urgentActionDesc}>{truncate(item.description, 100)}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>RestroWizard • Plan de Apertura Inteligente</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Phase Summary Cards */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>RestroWizard</Text>
            <Text style={styles.logoSubtext}>{project.project_name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>{generatedDate}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>5</Text>
          <Text style={styles.sectionTitle}>Resumen por Fase</Text>
        </View>

        <View style={styles.phaseSummaryGrid}>
          {completedAnalyses.map((analysis) => {
            const phaseId = analysis.phase as string;
            const phaseStyle = PHASE_STYLES[phaseId] || PHASE_STYLES.legal_requirements;
            const highlight = getPhaseHighlight(analysis, phaseId);
            const recommendations = getRecommendations(analysis);

            return (
              <View 
                key={analysis.id} 
                style={[styles.phaseSummaryCard, { borderLeftColor: phaseStyle.border }]}
              >
                <View style={styles.phaseSummaryHeader}>
                  <View style={[styles.phaseSummaryIcon, { backgroundColor: phaseStyle.bg }]}>
                    <Text style={{ fontSize: 8, color: phaseStyle.text }}>✓</Text>
                  </View>
                  <Text style={styles.phaseSummaryTitle}>
                    {PHASE_LABELS[phaseId] || phaseId}
                  </Text>
                </View>

                {highlight && (
                  <View style={[styles.phaseSummaryHighlight, { backgroundColor: phaseStyle.bg }]}>
                    <Text style={styles.phaseSummaryHighlightLabel}>{highlight.label}</Text>
                    <Text style={[styles.phaseSummaryHighlightValue, { color: phaseStyle.text }]}>
                      {highlight.value}
                    </Text>
                  </View>
                )}

                <View style={styles.phaseSummaryBadges}>
                  {analysis.estimated_cost && (
                    <Text style={styles.phaseBadge}>
                      💰 {formatCurrency(analysis.estimated_cost)}
                    </Text>
                  )}
                  {analysis.estimated_time_days && (
                    <Text style={styles.phaseBadge}>
                      ⏱️ {analysis.estimated_time_days} días
                    </Text>
                  )}
                </View>

                {recommendations.length > 0 && (
                  <View style={styles.phaseSummaryPoints}>
                    {recommendations.slice(0, 2).map((rec, i) => (
                      <View key={i} style={styles.phasePoint}>
                        <View style={[styles.phasePointDot, { backgroundColor: phaseStyle.border }]} />
                        <Text style={styles.phasePointText}>{truncate(rec, 60)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>RestroWizard • Plan de Apertura Inteligente</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Page 3+: Detailed Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>RestroWizard</Text>
            <Text style={styles.logoSubtext}>{project.project_name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>{generatedDate}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>6</Text>
          <Text style={styles.sectionTitle}>Análisis Detallado</Text>
        </View>

        {completedAnalyses.map((analysis) => {
          const phaseId = analysis.phase as string;
          const phaseStyle = PHASE_STYLES[phaseId] || PHASE_STYLES.legal_requirements;
          const content = getAnalysisText(analysis);
          const sections = parseSections(content);

          return (
            <View 
              key={analysis.id} 
              style={[styles.analysisCard, { borderLeftColor: phaseStyle.border }]}
              wrap={false}
            >
              <View style={styles.analysisHeader}>
                <View style={[styles.analysisIcon, { backgroundColor: phaseStyle.bg }]}>
                  <Text style={{ fontSize: 10, color: phaseStyle.text }}>✓</Text>
                </View>
                <Text style={styles.analysisTitle}>
                  {PHASE_LABELS[phaseId] || phaseId}
                </Text>
              </View>

              <View style={styles.analysisBadgesRow}>
                {analysis.estimated_cost && (
                  <Text style={styles.analysisBadge}>
                    💰 Costo: {formatCurrency(analysis.estimated_cost)}
                  </Text>
                )}
                {analysis.estimated_time_days && (
                  <Text style={styles.analysisBadge}>
                    ⏱️ Tiempo: {analysis.estimated_time_days} días
                  </Text>
                )}
              </View>

              {sections.slice(0, 3).map((section, idx) => (
                <View key={idx} style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>{section.title}</Text>
                  {section.bullets.slice(0, 4).map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.analysisBullet}>
                      <View style={[styles.bulletDot, { backgroundColor: phaseStyle.border }]} />
                      <Text style={styles.bulletText}>{truncate(bullet, 120)}</Text>
                    </View>
                  ))}
                </View>
              ))}

              {sections.length === 0 && content && (
                <Text style={styles.analysisContent}>
                  {truncate(content, 500)}
                </Text>
              )}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>RestroWizard • Plan de Apertura Inteligente</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Page: Checklist */}
      {checklist.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View>
              <Text style={styles.logoText}>RestroWizard</Text>
              <Text style={styles.logoSubtext}>{project.project_name}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerDate}>{generatedDate}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>7</Text>
            <Text style={styles.sectionTitle}>
              Checklist de Apertura ({checklist.filter(c => c.is_completed).length}/{checklist.length} completados)
            </Text>
          </View>

          {checklistPhaseOrder.map(phase => {
            const items = groupedChecklist[phase];
            if (!items || items.length === 0) return null;

            return (
              <View key={phase} style={styles.checklistPhase} wrap={false}>
                <Text style={styles.checklistPhaseTitle}>
                  {CHECKLIST_PHASE_LABELS[phase] || phase}
                </Text>
                {items.sort((a, b) => a.sort_order - b.sort_order).map(item => (
                  <View key={item.id} style={styles.checklistItem}>
                    <View style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}>
                      {item.is_completed && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={[styles.checklistText, item.is_completed && styles.checklistTextCompleted]}>
                      {item.title}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>RestroWizard • Plan de Apertura Inteligente</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </Page>
      )}
    </Document>
  );
}
