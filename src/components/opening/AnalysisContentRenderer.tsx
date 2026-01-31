import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Users, TrendingUp, AlertTriangle, CheckCircle2, 
  Target, Lightbulb, DollarSign, ArrowRight, Star
} from 'lucide-react';

interface AnalysisContentRendererProps {
  content: string;
  phaseId?: string;
}

// Parse numbered sections (1. Title, 2. Title, etc.)
const parseNumberedSections = (content: string) => {
  const sections: { number: string; title: string; content: string }[] = [];
  
  // Match patterns like "1. Title" or "1) Title" at the start of lines
  const sectionRegex = /^(\d+)[\.\)]\s*(.+?)(?:\n|$)/gm;
  const matches = [...content.matchAll(sectionRegex)];
  
  if (matches.length === 0) return null;
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    const startIndex = match.index! + match[0].length;
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    const sectionContent = content.slice(startIndex, endIndex).trim();
    
    sections.push({
      number: match[1],
      title: match[2].replace(/\*\*/g, '').trim(),
      content: sectionContent
    });
  }
  
  return sections;
};

// Extract key-value pairs like "Por qué es buena:", "Perfil del público:", etc.
const parseKeyValuePairs = (content: string) => {
  const pairs: { key: string; value: string; icon: React.ReactNode }[] = [];
  
  const patterns = [
    { regex: /(?:Por qué es buena|Why it's good)[:\s]+([^\n]+(?:\n(?![A-Z])[^\n]+)*)/gi, icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> },
    { regex: /(?:Perfil del público|Target audience|Público objetivo)[:\s]+([^\n]+(?:\n(?![A-Z])[^\n]+)*)/gi, icon: <Users className="h-4 w-4 text-blue-600" /> },
    { regex: /(?:Nivel de competencia|Competition level)[:\s]+([^\n]+)/gi, icon: <TrendingUp className="h-4 w-4 text-amber-600" /> },
    { regex: /(?:Relevancia para tu concepto|Relevance)[:\s]+([^\n]+)/gi, icon: <Target className="h-4 w-4 text-purple-600" /> },
    { regex: /(?:Riesgo|Risk|Desventaja)[:\s]+([^\n]+)/gi, icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
    { regex: /(?:Recomendación|Recommendation)[:\s]+([^\n]+(?:\n(?![A-Z])[^\n]+)*)/gi, icon: <Lightbulb className="h-4 w-4 text-yellow-600" /> },
    { regex: /(?:Costo|Cost|Inversión|Investment)[:\s]+([^\n]+)/gi, icon: <DollarSign className="h-4 w-4 text-green-600" /> },
  ];
  
  for (const { regex, icon } of patterns) {
    const matches = [...content.matchAll(regex)];
    for (const match of matches) {
      const key = match[0].split(':')[0].trim();
      const value = match[1].trim();
      if (value.length > 10) {
        pairs.push({ key, value, icon });
      }
    }
  }
  
  return pairs;
};

// Get relevance badge color
const getRelevanceBadge = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('alta') || lower.includes('high')) {
    return { label: 'Alta', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
  if (lower.includes('media') || lower.includes('medium')) {
    return { label: 'Media', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  if (lower.includes('baja') || lower.includes('low')) {
    return { label: 'Baja', className: 'bg-red-100 text-red-700 border-red-200' };
  }
  return null;
};

// Render a single location/option card
const LocationCard = ({ number, title, content }: { number: string; title: string; content: string }) => {
  const keyValues = parseKeyValuePairs(content);
  const relevanceText = content.match(/relevancia[^:]*:\s*([^\n,\.]+)/i)?.[1] || '';
  const relevanceBadge = getRelevanceBadge(relevanceText);
  
  return (
    <div className="border rounded-lg bg-card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b bg-muted/30">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground leading-tight">{title}</h4>
          {relevanceBadge && (
            <Badge variant="outline" className={`mt-1.5 text-xs ${relevanceBadge.className}`}>
              <Star className="h-3 w-3 mr-1" />
              Relevancia {relevanceBadge.label}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Key points */}
      {keyValues.length > 0 ? (
        <div className="p-4 space-y-3">
          {keyValues.map((kv, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="mt-0.5 flex-shrink-0">{kv.icon}</div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {kv.key}
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">
                  {kv.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {content.substring(0, 500)}
            {content.length > 500 && '...'}
          </p>
        </div>
      )}
    </div>
  );
};

// Extract and display executive summary
const ExecutiveSummary = ({ content }: { content: string }) => {
  // Get first paragraph or intro text
  const firstParagraph = content.split('\n\n')[0]?.replace(/^#+\s*/gm, '').trim();
  
  if (!firstParagraph || firstParagraph.length < 50) return null;
  
  // Check if it starts with a numbered item - if so, skip summary
  if (/^\d+[\.\)]/.test(firstParagraph)) return null;
  
  return (
    <div className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary p-4 rounded-r-lg mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Resumen Ejecutivo
        </span>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">
        {firstParagraph.substring(0, 300)}
        {firstParagraph.length > 300 && '...'}
      </p>
    </div>
  );
};

export function AnalysisContentRenderer({ content, phaseId }: AnalysisContentRendererProps) {
  const numberedSections = parseNumberedSections(content);
  
  // If we have numbered sections, render as executive cards
  if (numberedSections && numberedSections.length > 0) {
    // Find intro text (before first numbered section)
    const firstSectionIndex = content.search(/^\d+[\.\)]/m);
    const introText = firstSectionIndex > 0 ? content.substring(0, firstSectionIndex).trim() : '';
    
    return (
      <div className="space-y-4">
        {/* Executive summary from intro */}
        {introText && <ExecutiveSummary content={introText} />}
        
        {/* Section count indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {numberedSections.length} opciones analizadas
          </span>
          <span className="flex items-center gap-1">
            <ArrowRight className="h-3.5 w-3.5" />
            Ordenadas por relevancia
          </span>
        </div>
        
        {/* Location/Option cards */}
        <div className="space-y-3">
          {numberedSections.map((section, idx) => (
            <LocationCard 
              key={idx}
              number={section.number}
              title={section.title}
              content={section.content}
            />
          ))}
        </div>
        
        {/* Footer insight */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t text-xs text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span>
            Análisis basado en datos de mercado y características del concepto
          </span>
        </div>
      </div>
    );
  }
  
  // Fallback: Clean paragraph rendering with highlights
  return (
    <div className="space-y-4">
      <ExecutiveSummary content={content} />
      
      {/* Clean paragraph rendering */}
      <div className="prose prose-sm max-w-none">
        {content.split('\n\n').map((paragraph, idx) => {
          const trimmed = paragraph.trim();
          if (!trimmed) return null;
          
          // Check if it's a header
          if (trimmed.startsWith('#')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            return (
              <h3 key={idx} className="text-base font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                {headerText}
              </h3>
            );
          }
          
          // Check if it's a list
          if (trimmed.match(/^[-•]\s/m)) {
            const items = trimmed.split(/\n/).filter(line => line.match(/^[-•]\s/));
            return (
              <ul key={idx} className="space-y-2 my-3">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item.replace(/^[-•]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            );
          }
          
          // Regular paragraph
          return (
            <p key={idx} className="text-sm text-foreground/80 leading-relaxed mb-3">
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
}
