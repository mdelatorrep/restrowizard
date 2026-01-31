import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { BusinessProject, PhaseAnalysis, ChecklistItem } from '@/hooks/useBusinessProject';
import { formatCurrencyByCountry, getCurrencyCode } from '@/data/constants';
import { PHASES, PhaseId } from '@/hooks/useBusinessOpening';

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
  primary: '#7C3AED', // Violet
  primaryLight: '#EDE9FE',
  secondary: '#059669', // Emerald
  secondaryLight: '#D1FAE5',
  accent: '#F59E0B', // Amber
  accentLight: '#FEF3C7',
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
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoText: {
    fontSize: 20,
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
    marginBottom: 30,
    padding: 20,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  // Business Info
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
    gap: 10,
  },
  infoItem: {
    width: '48%',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.text,
  },
  // Metrics
  metricsSection: {
    marginBottom: 25,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricPrimary: {
    backgroundColor: COLORS.primaryLight,
  },
  metricSecondary: {
    backgroundColor: COLORS.secondaryLight,
  },
  metricAccent: {
    backgroundColor: COLORS.accentLight,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.text,
  },
  // Summary section
  summaryCard: {
    padding: 15,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.text,
  },
  // Analysis sections
  phaseCard: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  phaseTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: 8,
  },
  phaseContent: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.textMuted,
  },
  // Checklist
  checklistPhase: {
    marginBottom: 15,
  },
  checklistPhaseTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingLeft: 10,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  checkMark: {
    color: COLORS.white,
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 12,
  },
  checklistText: {
    flex: 1,
    fontSize: 9,
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
    fontSize: 8,
    color: COLORS.textMuted,
  },
  pageNumber: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
});

// Phase color mapping
const PHASE_BORDER_COLORS: Record<string, string> = {
  legal_requirements: '#8B5CF6',
  location_analysis: '#3B82F6',
  equipment_setup: '#F97316',
  supplier_network: '#10B981',
  staffing_plan: '#06B6D4',
  marketing_launch: '#EC4899',
  financial_projection: '#F59E0B',
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
    .replace(/#{1,6}\s*/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1') // Code
    .replace(/^\s*[-•→]\s*/gm, '• ') // Bullets
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim();
}

// Helper to extract analysis content
function getAnalysisText(analysis: PhaseAnalysis): string {
  const data = analysis?.analysis_data;
  if (!data) return 'Análisis pendiente.';
  if (typeof data === 'string') return cleanMarkdown(data);
  if (typeof data === 'object' && data !== null) {
    if ('text' in data && typeof data.text === 'string') {
      return cleanMarkdown(data.text);
    }
    if ('analysis' in data && typeof data.analysis === 'string') {
      return cleanMarkdown(data.analysis);
    }
  }
  return 'Análisis pendiente.';
}

// Helper to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
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

  // Order phases for checklist
  const checklistPhaseOrder = ['planning', 'legal', 'location', 'equipment', 'suppliers', 'staffing', 'marketing', 'pre_opening', 'opening'];

  return (
    <Document>
      {/* Page 1: Business Info & Metrics */}
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
            <Text style={styles.infoValue}>{project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}, {project.country}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Presupuesto Estimado</Text>
            <Text style={styles.infoValue}>{project.estimated_budget ? formatCurrency(project.estimated_budget) : 'Por definir'}</Text>
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

        {project.description && (
          <View style={styles.summaryCard}>
            <Text style={styles.infoLabel}>Descripción del Concepto</Text>
            <Text style={[styles.summaryText, { marginTop: 5 }]}>{project.description}</Text>
          </View>
        )}

        {/* Section 2: Key Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>2</Text>
          <Text style={styles.sectionTitle}>Métricas Clave</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricPrimary]}>
            <Text style={[styles.metricValue, { color: COLORS.primary }]}>
              {metrics.totalInvestment > 0 ? formatCurrency(metrics.totalInvestment) : '—'}
            </Text>
            <Text style={styles.metricLabel}>Inversión Total ({currencyCode})</Text>
          </View>
          <View style={[styles.metricCard, styles.metricSecondary]}>
            <Text style={[styles.metricValue, { color: COLORS.secondary }]}>
              {metrics.roi > 0 ? `${metrics.roi.toFixed(0)}%` : '—'}
            </Text>
            <Text style={styles.metricLabel}>ROI Anual Proyectado</Text>
          </View>
          <View style={[styles.metricCard, styles.metricAccent]}>
            <Text style={[styles.metricValue, { color: COLORS.accent }]}>
              {metrics.breakEvenMonths} meses
            </Text>
            <Text style={styles.metricLabel}>Punto de Equilibrio</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>RestroWizard • Plan de Apertura</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Summary & Analysis Overview */}
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

        {/* Section 3: Executive Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>3</Text>
          <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Este plan de apertura ha sido generado específicamente para {project.project_name}, 
            un {project.business_type.toLowerCase()} de {project.cuisine_type?.toLowerCase() || 'gastronomía'} ubicado en {project.city}, {project.country}. 
            El análisis cubre todos los aspectos críticos para una apertura exitosa: requisitos legales, 
            ubicación y competencia, equipamiento, proveedores, personal, estrategia de marketing y proyecciones financieras.
            {metrics.totalInvestment > 0 && ` Con una inversión estimada de ${formatCurrency(metrics.totalInvestment)}, 
            se proyecta un retorno anual del ${metrics.roi.toFixed(0)}% y un punto de equilibrio en aproximadamente ${metrics.breakEvenMonths} meses.`}
          </Text>
        </View>

        {/* Section 4: Analysis Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>4</Text>
          <Text style={styles.sectionTitle}>Análisis Detallado</Text>
        </View>

        {analyses.filter(a => a.status === 'completed').map((analysis) => {
          const phaseId = analysis.phase as string;
          const borderColor = PHASE_BORDER_COLORS[phaseId] || COLORS.primary;
          const content = getAnalysisText(analysis);
          
          return (
            <View 
              key={analysis.id} 
              style={[styles.phaseCard, { borderLeftColor: borderColor }]}
              wrap={false}
            >
              <Text style={styles.phaseTitle}>
                {PHASE_LABELS[phaseId] || phaseId}
              </Text>
              <Text style={styles.phaseContent}>
                {truncateText(content, 800)}
              </Text>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>RestroWizard • Plan de Apertura</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Page 3+: Checklist */}
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

          {/* Section 5: Checklist */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>5</Text>
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
            <Text style={styles.footerText}>RestroWizard • Plan de Apertura</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </Page>
      )}
    </Document>
  );
}
