import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, RefreshCw, X, Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface AIInsightsPanelProps {
  title: string;
  description?: string;
  insights: string | null;
  loading: boolean;
  onAnalyze: () => void;
  onClose?: () => void;
  variant?: 'default' | 'compact' | 'sidebar';
  icon?: React.ReactNode;
  className?: string;
  /** TK-20: mensaje de error si la última llamada falló. */
  error?: string | null;
  /** TK-20: si false, muestra "No hay datos suficientes para analizar". */
  hasData?: boolean;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  title,
  description,
  insights,
  loading,
  onAnalyze,
  onClose,
  variant = 'default',
  icon,
  className,
  error = null,
  hasData = true,
}) => {
  const disabledByData = !hasData && !loading;
  if (variant === 'compact') {
    return (
      <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-transparent", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {icon || <Sparkles className="w-5 h-5 text-primary" />}
              <span className="font-semibold">{title}</span>
            </div>
            <Button 
              size="sm" 
              onClick={onAnalyze} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Analizar con IA
                </>
              )}
            </Button>
          </div>
          {insights && (
            <ScrollArea className="h-[300px] pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {insights}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          )}
          {!insights && !loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Haz clic en "Analizar con IA" para obtener insights personalizados
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon || <Sparkles className="w-5 h-5 text-primary" />}
            <h3 className="font-semibold">{title}</h3>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Button 
          onClick={onAnalyze} 
          disabled={loading} 
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {insights ? 'Actualizar Análisis' : 'Generar Análisis'}
            </>
          )}
        </Button>

        {insights && (
          <ScrollArea className="h-[400px]">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {insights}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {icon || <Sparkles className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={onAnalyze} 
              disabled={loading}
              size="sm"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {insights ? 'Actualizar' : 'Analizar'}
                </>
              )}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !insights && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p>Analizando datos con IA...</p>
            <p className="text-sm">Esto puede tomar unos segundos</p>
          </div>
        )}
        
        {insights && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold flex items-center gap-2 mt-4 first:mt-0">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold flex items-center gap-2 mt-4">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mt-3">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm">{children}</li>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm my-2">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-primary">{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-3 italic my-3 text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {insights}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        )}
        
        {!insights && !loading && error && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-3 text-destructive opacity-70" />
            <p className="font-medium text-destructive">No se pudo generar el análisis</p>
            <p className="text-sm text-center max-w-sm mt-1 mb-3">{error}</p>
            <Button size="sm" variant="outline" onClick={onAnalyze} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Reintentar
            </Button>
          </div>
        )}

        {!insights && !loading && !error && disabledByData && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Database className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-medium">No hay datos suficientes para analizar</p>
            <p className="text-sm text-center max-w-sm mt-1">
              Captura algunas operaciones (ventas, inventario, turnos) y vuelve a intentarlo.
            </p>
          </div>
        )}

        {!insights && !loading && !error && !disabledByData && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-medium">Sin análisis disponible</p>
            <p className="text-sm text-center max-w-sm mt-1">
              Haz clic en "Analizar" para obtener insights personalizados basados en tus datos actuales
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact button for triggering AI analysis
interface AIAnalyzeButtonProps {
  onClick: () => void;
  loading: boolean;
  label?: string;
  className?: string;
}

export const AIAnalyzeButton: React.FC<AIAnalyzeButtonProps> = ({
  onClick,
  loading,
  label = "Análisis IA",
  className
}) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={loading}
      variant="outline"
      className={cn("gap-2 border-primary/30 hover:bg-primary/10", className)}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Analizando...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-primary" />
          {label}
        </>
      )}
    </Button>
  );
};
