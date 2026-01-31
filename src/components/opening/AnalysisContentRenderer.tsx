import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Users, TrendingUp, AlertTriangle, CheckCircle2, 
  Target, Lightbulb, DollarSign, Clock, Star, Building2,
  FileText, BarChart3, Utensils, Megaphone, Shield, Truck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisContentRendererProps {
  content: string;
  phaseId?: string;
}

// Get icon for section based on content
const getSectionIcon = (title: string): React.ReactNode => {
  const lower = title.toLowerCase();
  
  if (lower.includes('organigrama') || lower.includes('personal') || lower.includes('staff')) 
    return <Users className="h-4 w-4" />;
  if (lower.includes('zona') || lower.includes('ubicación') || lower.includes('location')) 
    return <MapPin className="h-4 w-4" />;
  if (lower.includes('competencia') || lower.includes('mercado'))
    return <BarChart3 className="h-4 w-4" />;
  if (lower.includes('proyección') || lower.includes('financier') || lower.includes('inversión'))
    return <TrendingUp className="h-4 w-4" />;
  if (lower.includes('costo') || lower.includes('precio') || lower.includes('presupuesto'))
    return <DollarSign className="h-4 w-4" />;
  if (lower.includes('tiempo') || lower.includes('plazo') || lower.includes('cronograma'))
    return <Clock className="h-4 w-4" />;
  if (lower.includes('legal') || lower.includes('permiso') || lower.includes('licencia') || lower.includes('requisito'))
    return <Shield className="h-4 w-4" />;
  if (lower.includes('proveedor') || lower.includes('supplier') || lower.includes('insumo'))
    return <Truck className="h-4 w-4" />;
  if (lower.includes('marketing') || lower.includes('lanzamiento') || lower.includes('promoción'))
    return <Megaphone className="h-4 w-4" />;
  if (lower.includes('equipo') || lower.includes('cocina') || lower.includes('waffle'))
    return <Utensils className="h-4 w-4" />;
  if (lower.includes('recomend') || lower.includes('estrateg'))
    return <Lightbulb className="h-4 w-4" />;
    
  return <FileText className="h-4 w-4" />;
};

// Section colors for visual variety
const SECTION_STYLES = [
  { border: 'border-l-violet-500', bg: 'bg-violet-500/5', icon: 'text-violet-600 bg-violet-100' },
  { border: 'border-l-blue-500', bg: 'bg-blue-500/5', icon: 'text-blue-600 bg-blue-100' },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', icon: 'text-emerald-600 bg-emerald-100' },
  { border: 'border-l-amber-500', bg: 'bg-amber-500/5', icon: 'text-amber-600 bg-amber-100' },
  { border: 'border-l-rose-500', bg: 'bg-rose-500/5', icon: 'text-rose-600 bg-rose-100' },
  { border: 'border-l-cyan-500', bg: 'bg-cyan-500/5', icon: 'text-cyan-600 bg-cyan-100' },
];

// Parse markdown into sections based on ## headers
interface Section {
  title: string;
  content: string;
}

const parseMarkdownSections = (content: string): Section[] => {
  const sections: Section[] = [];
  const lines = content.split('\n');
  
  let currentSection: Section | null = null;
  let introContent = '';
  
  for (const line of lines) {
    // Match ## headers (main sections)
    const headerMatch = line.match(/^##\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headerMatch[1].trim(),
        content: ''
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    } else {
      // Content before first section (intro)
      introContent += line + '\n';
    }
  }
  
  // Don't forget last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // If there's intro content, add it as first section
  if (introContent.trim()) {
    sections.unshift({
      title: 'Resumen',
      content: introContent
    });
  }
  
  return sections;
};

// Custom markdown components for clean rendering
const createMarkdownComponents = (isInsideSection: boolean) => ({
  h1: () => null,
  h2: () => null,
  h3: ({ children }: any) => (
    <h4 className="text-sm font-semibold text-foreground mt-4 mb-2 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
      {children}
    </h4>
  ),
  h4: ({ children }: any) => (
    <h5 className="text-sm font-medium text-foreground/90 mt-3 mb-1.5">
      {children}
    </h5>
  ),
  p: ({ children }: any) => (
    <p className="text-sm text-foreground/80 leading-relaxed mb-2">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="space-y-1.5 my-2 ml-1">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="space-y-1.5 my-2 ml-1 list-none">
      {children}
    </ol>
  ),
  li: ({ children, ordered, index }: any) => (
    <li className="text-sm text-foreground/80 flex items-start gap-2">
      <span className="mt-1.5 flex-shrink-0">
        {ordered ? (
          <span className="text-xs font-semibold text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center">
            {(index || 0) + 1}
          </span>
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="text-foreground/70 not-italic">{children}</em>
  ),
  a: ({ href, children }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 rounded-lg border bg-card">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-muted/50 border-b">
      {children}
    </thead>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left font-medium text-foreground text-xs uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 border-b border-border/30 text-foreground/80">
      {children}
    </td>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 py-1 my-2 text-foreground/70 italic text-sm">
      {children}
    </blockquote>
  ),
  code: ({ children }: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  ),
});

// Section card component
const SectionCard = ({ section, index }: { section: Section; index: number }) => {
  const style = SECTION_STYLES[index % SECTION_STYLES.length];
  const hasContent = section.content.trim().length > 0;
  
  return (
    <div className={`rounded-lg border-l-4 ${style.border} ${style.bg} overflow-hidden`}>
      {/* Section header */}
      <div className="px-4 py-3 border-b border-border/20 flex items-center gap-3">
        <div className={`p-1.5 rounded-md ${style.icon}`}>
          {getSectionIcon(section.title)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight">
            {section.title}
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-normal bg-background/50">
          {index + 1}
        </Badge>
      </div>
      
      {/* Section content */}
      {hasContent && (
        <div className="px-4 py-3 bg-background/30">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={createMarkdownComponents(true)}
          >
            {section.content.trim()}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export function AnalysisContentRenderer({ content, phaseId }: AnalysisContentRendererProps) {
  const sections = parseMarkdownSections(content);
  
  // If we found sections, render as cards
  if (sections.length > 1) {
    return (
      <div className="space-y-3">
        {/* Header with section count */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Análisis estructurado</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {sections.length} secciones
          </Badge>
        </div>
        
        {/* Section cards */}
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <SectionCard key={idx} section={section} index={idx} />
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border/30 text-[11px] text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span>Análisis generado con datos locales del mercado</span>
        </div>
      </div>
    );
  }
  
  // Fallback: Simple clean markdown rendering
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card/50 p-4">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={createMarkdownComponents(false)}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
