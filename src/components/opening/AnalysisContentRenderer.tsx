import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Star, Users, TrendingUp, AlertTriangle, CheckCircle2, 
  Target, Lightbulb, Building2, DollarSign, Clock, Shield,
  Sparkles, Award, Zap, BarChart3, Globe, Heart
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisContentRendererProps {
  content: string;
  phaseId?: string;
}

// Detect section types for proper styling
const getSectionIcon = (title: string): React.ReactNode => {
  const lower = title.toLowerCase();
  
  if (lower.includes('zona') || lower.includes('ubicación') || lower.includes('location')) 
    return <MapPin className="h-4 w-4" />;
  if (lower.includes('competencia') || lower.includes('mercado'))
    return <BarChart3 className="h-4 w-4" />;
  if (lower.includes('público') || lower.includes('cliente') || lower.includes('perfil'))
    return <Users className="h-4 w-4" />;
  if (lower.includes('recomend') || lower.includes('consejo') || lower.includes('sugerencia'))
    return <Lightbulb className="h-4 w-4" />;
  if (lower.includes('costo') || lower.includes('precio') || lower.includes('inversión') || lower.includes('presupuesto'))
    return <DollarSign className="h-4 w-4" />;
  if (lower.includes('tiempo') || lower.includes('plazo') || lower.includes('cronograma'))
    return <Clock className="h-4 w-4" />;
  if (lower.includes('legal') || lower.includes('permiso') || lower.includes('licencia'))
    return <Shield className="h-4 w-4" />;
  if (lower.includes('ventaja') || lower.includes('fortaleza') || lower.includes('oportunidad'))
    return <Star className="h-4 w-4" />;
  if (lower.includes('riesgo') || lower.includes('desventaja') || lower.includes('amenaza'))
    return <AlertTriangle className="h-4 w-4" />;
  if (lower.includes('conclus') || lower.includes('resumen'))
    return <CheckCircle2 className="h-4 w-4" />;
  if (lower.includes('estrateg'))
    return <Target className="h-4 w-4" />;
  if (lower.includes('proveedor') || lower.includes('supplier'))
    return <Building2 className="h-4 w-4" />;
  if (lower.includes('tendencia') || lower.includes('proyección'))
    return <TrendingUp className="h-4 w-4" />;
    
  return <Sparkles className="h-4 w-4" />;
};

const getSectionColor = (index: number): string => {
  const colors = [
    'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    'from-rose-500/20 to-rose-500/5 border-rose-500/30',
    'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30',
  ];
  return colors[index % colors.length];
};

const getIconColor = (index: number): string => {
  const colors = [
    'text-purple-600 bg-purple-500/20',
    'text-blue-600 bg-blue-500/20',
    'text-emerald-600 bg-emerald-500/20',
    'text-amber-600 bg-amber-500/20',
    'text-rose-600 bg-rose-500/20',
    'text-cyan-600 bg-cyan-500/20',
    'text-indigo-600 bg-indigo-500/20',
  ];
  return colors[index % colors.length];
};

// Parse content into structured sections
interface Section {
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
}

const parseContentToSections = (content: string): Section[] => {
  const sections: Section[] = [];
  
  // Split by main headers (lines starting with # or numbered like "1.")
  const lines = content.split('\n');
  let currentSection: Section | null = null;
  let currentSubsection: { title: string; content: string } | null = null;
  
  for (const line of lines) {
    // Main section headers: "# Title", "## Title", or "1. Title", "1) Title"
    const mainMatch = line.match(/^(?:#{1,2}\s*|(?:\d+[\.\)])\s*)(.+)$/);
    const subMatch = line.match(/^(?:#{3,4}\s*|\*\*(.+?)\*\*:?|[-•]\s*\*\*(.+?)\*\*:?)$/);
    
    if (mainMatch && !line.startsWith('###')) {
      // Save previous section
      if (currentSection) {
        if (currentSubsection) {
          currentSection.subsections = currentSection.subsections || [];
          currentSection.subsections.push(currentSubsection);
          currentSubsection = null;
        }
        sections.push(currentSection);
      }
      currentSection = {
        title: mainMatch[1].replace(/\*\*/g, '').trim(),
        content: '',
        subsections: []
      };
    } else if (subMatch && currentSection) {
      // Subsection
      if (currentSubsection) {
        currentSection.subsections = currentSection.subsections || [];
        currentSection.subsections.push(currentSubsection);
      }
      const subTitle = (subMatch[1] || subMatch[2] || line.replace(/^#+\s*/, '')).replace(/\*\*/g, '').replace(/:$/, '').trim();
      currentSubsection = { title: subTitle, content: '' };
    } else if (currentSubsection) {
      currentSubsection.content += line + '\n';
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }
  
  // Don't forget the last section
  if (currentSection) {
    if (currentSubsection) {
      currentSection.subsections = currentSection.subsections || [];
      currentSection.subsections.push(currentSubsection);
    }
    sections.push(currentSection);
  }
  
  return sections.filter(s => s.title || s.content.trim());
};

// Extract key insights/highlights from content
const extractHighlights = (content: string): string[] => {
  const highlights: string[] = [];
  
  // Look for patterns like "Relevancia: alta", percentages, key metrics
  const relevanceMatch = content.match(/relevancia[^:]*:\s*([^\n,]+)/gi);
  if (relevanceMatch) {
    relevanceMatch.forEach(m => {
      const value = m.split(':')[1]?.trim();
      if (value) highlights.push(`Relevancia: ${value}`);
    });
  }
  
  // Look for competition levels
  const competitionMatch = content.match(/competencia[^:]*:\s*([^\n,]+)/gi);
  if (competitionMatch) {
    competitionMatch.forEach(m => {
      const value = m.split(':')[1]?.trim();
      if (value) highlights.push(`Competencia: ${value.substring(0, 50)}`);
    });
  }
  
  return highlights.slice(0, 3);
};

// Custom components for ReactMarkdown
const MarkdownComponents = {
  h1: ({ children }: any) => null, // We handle H1 separately
  h2: ({ children }: any) => null, // We handle H2 separately  
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold text-foreground mt-4 mb-2 flex items-center gap-2">
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-sm font-medium text-foreground/90 mt-3 mb-1">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="space-y-2 my-3">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="space-y-2 my-3 list-decimal list-inside">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm text-muted-foreground flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  a: ({ href, children }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-primary hover:underline inline-flex items-center gap-1"
    >
      {children}
      <Globe className="h-3 w-3" />
    </a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-muted/50">
      {children}
    </thead>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-2 text-left font-medium text-foreground border-b">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-2 border-b border-border/50">
      {children}
    </td>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-3 bg-primary/5 rounded-r-lg italic">
      {children}
    </blockquote>
  ),
};

export function AnalysisContentRenderer({ content, phaseId }: AnalysisContentRendererProps) {
  const sections = parseContentToSections(content);
  
  // If no clear sections were found, render as enhanced markdown
  if (sections.length <= 1) {
    return (
      <div className="space-y-4">
        {/* Intro card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Análisis Estratégico</h3>
              <p className="text-sm text-muted-foreground">
                Información detallada basada en análisis de mercado y datos locales.
              </p>
            </div>
          </div>
        </Card>
        
        {/* Main content with enhanced styling */}
        <Card className="p-5 border-border/50">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={MarkdownComponents}
          >
            {content}
          </ReactMarkdown>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <Card 
          key={index} 
          className={`overflow-hidden border bg-gradient-to-br ${getSectionColor(index)}`}
        >
          {/* Section header */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getIconColor(index)}`}>
                {getSectionIcon(section.title)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-base">
                  {section.title}
                </h3>
                {extractHighlights(section.content).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extractHighlights(section.content).map((highlight, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="text-xs bg-background/80"
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Sección {index + 1}
              </Badge>
            </div>
          </div>
          
          {/* Section content */}
          <div className="p-4 bg-background/50">
            {section.content.trim() && (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={MarkdownComponents}
              >
                {section.content}
              </ReactMarkdown>
            )}
            
            {/* Subsections as mini-cards */}
            {section.subsections && section.subsections.length > 0 && (
              <div className="space-y-3 mt-4">
                {section.subsections.map((sub, subIdx) => (
                  <div 
                    key={subIdx}
                    className="bg-muted/30 rounded-lg p-4 border border-border/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-primary/60" />
                      <h4 className="font-medium text-sm text-foreground">
                        {sub.title}
                      </h4>
                    </div>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={MarkdownComponents}
                    >
                      {sub.content}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}
      
      {/* Final insights card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/20 text-primary">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Análisis completo con {sections.length} secciones estratégicas
            </p>
            <p className="text-xs text-muted-foreground">
              Información procesada para una toma de decisiones informada
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
