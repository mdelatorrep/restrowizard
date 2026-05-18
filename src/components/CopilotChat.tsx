import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUserType } from '@/hooks/useUserType';
import { useCopilotAlerts } from '@/hooks/useCopilotAlerts';
import { useFinancesData } from '@/hooks/useFinancesData';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Bot,
  Sun,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const buildWelcome = (isConsultant: boolean): UIMessage => ({
  id: 'welcome',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: isConsultant
        ? '¡Hola! Soy tu copiloto de RestroWizard 🚀\n\nComo consultor, puedo ayudarte con:\n- Análisis de tu portafolio de clientes\n- Comparativas entre restaurantes\n- Alertas consolidadas\n- Generación de reportes\n- Insights para recomendaciones\n\n¿En qué puedo ayudarte hoy?'
        : '¡Hola! Soy tu copiloto de RestroWizard 🚀\n\nPuedo ayudarte con:\n- Análisis de ventas y finanzas\n- Gestión de inventario\n- Optimización de personal\n- Insights de clientes\n- Reportes y métricas\n\n¿En qué puedo ayudarte hoy?',
    },
  ],
});

const CopilotChat = () => {
  const { user } = useAuthContext();
  const { isConsultant } = useUserType();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const {
    alerts: copilotAlerts,
    unreadAlerts,
    generateAlerts,
    isLoading: alertsLoading,
  } = useCopilotAlerts();
  const { kpis, hasData: hasFinanceData } = useFinancesData();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${SUPABASE_URL}/functions/v1/copilot-chat`,
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token ?? SUPABASE_ANON_KEY;
          const headers = new Headers(init?.headers);
          headers.set('Authorization', `Bearer ${token}`);
          headers.set('apikey', SUPABASE_ANON_KEY);
          return fetch(input, { ...init, headers });
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
    onError: (e) =>
      toast({
        title: 'Error del copiloto',
        description: e.message,
        variant: 'destructive',
      }),
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Inject welcome message when opening for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([buildWelcome(isConsultant)]);
    }
  }, [isOpen, isConsultant, messages.length, setMessages]);

  // Focus textarea on open / after stream completes
  useEffect(() => {
    if (isOpen && !isMinimized && status === 'ready') {
      textareaRef.current?.focus();
    }
  }, [isOpen, isMinimized, status]);

  const briefing = useMemo(() => {
    const highlights: string[] = [];
    const alertsForBriefing: { message: string; priority: string }[] = [];
    const recommendations: string[] = [];

    if (hasFinanceData && kpis) {
      highlights.push(`📈 Ingresos (7 días): $${(kpis.totalRevenue / 1000).toFixed(1)}k`);
      highlights.push(`📊 Food Cost: ${kpis.foodCostPercentage.toFixed(1)}% ${kpis.foodCostPercentage <= 32 ? '✅' : '⚠️'}`);
      highlights.push(`🎫 Ticket Promedio: $${kpis.averageTicket.toFixed(0)}`);
      highlights.push(`👥 Cubiertos (7 días): ${kpis.totalCovers}`);
    } else {
      highlights.push('📊 Registra tus primeras ventas para ver métricas');
    }

    (copilotAlerts || []).slice(0, 3).forEach((alert) => {
      alertsForBriefing.push({
        message: alert.message,
        priority: alert.priority || 'medium',
      });
    });

    if (hasFinanceData && kpis) {
      if (kpis.foodCostPercentage > 32)
        recommendations.push('Revisa tus costos de alimentos - están por encima del benchmark');
      if (kpis.laborCostPercentage > 25)
        recommendations.push('Considera optimizar turnos de personal para reducir costos laborales');
      recommendations.push('Mantén el registro diario de ventas para mejores predicciones');
    } else {
      recommendations.push('Comienza registrando tus ventas diarias en el módulo de Finanzas');
      recommendations.push('Configura tu inventario para recibir alertas de stock bajo');
    }

    return { highlights, alerts: alertsForBriefing, recommendations };
  }, [hasFinanceData, kpis, copilotAlerts]);

  const quickActions = isConsultant
    ? [
        { label: '📊 Estado portafolio', action: '¿Cuál es el estado de mi portafolio de clientes?' },
        { label: '⚠️ Alertas críticas', action: '¿Cuáles clientes tienen alertas críticas?' },
        { label: '📈 Comparativa', action: 'Compara el rendimiento de mis clientes' },
        { label: '💡 Recomendaciones', action: 'Dame recomendaciones para mis clientes' },
      ]
    : [
        { label: '📊 Resumen de hoy', action: '¿Cuál es el resumen de ventas de hoy?' },
        { label: '📦 Inventario bajo', action: '¿Qué productos tienen inventario bajo?' },
        { label: '👥 Personal activo', action: '¿Quién está trabajando hoy?' },
        { label: '💡 Sugerencias', action: 'Dame sugerencias para mejorar las ventas' },
      ];

  const handleReset = () => {
    stop();
    setMessages([buildWelcome(isConsultant)]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        {unreadAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white">
            {unreadAlerts.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 shadow-2xl transition-all duration-300 ${
        isMinimized ? 'bottom-6 right-6 w-80' : 'bottom-6 right-6 w-96 md:w-[450px]'
      }`}
    >
      <Card className="border-primary/20 overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-6 w-6" />
                <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">RestroWizard Copilot</CardTitle>
                <p className="text-xs opacity-80">Tu asistente IA 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                onClick={handleReset}
                title="Nueva conversación"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                onClick={() => setShowBriefing(!showBriefing)}
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            {showBriefing && (
              <div className="p-4 bg-muted/50 border-b space-y-3 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <h4 className="font-semibold">Briefing del Día</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateAlerts()}
                    disabled={alertsLoading}
                    className="h-6 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${alertsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">DESTACADOS</p>
                  {briefing.highlights.map((h, i) => (
                    <p key={i} className="text-sm">{h}</p>
                  ))}
                </div>

                {briefing.alerts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">ALERTAS</p>
                    {briefing.alerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            a.priority === 'high' || a.priority === 'critical'
                              ? 'text-destructive'
                              : a.priority === 'medium'
                                ? 'text-yellow-500'
                                : 'text-blue-500'
                          }`}
                        />
                        {a.message}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">RECOMENDACIONES IA</p>
                  {briefing.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Conversation className="h-80">
              <ConversationContent className="px-3 py-3">
                {messages.map((m) => (
                  <Message key={m.id} from={m.role}>
                    <MessageContent>
                      {m.parts.map((part, i) =>
                        part.type === 'text' ? (
                          <MessageResponse key={i}>{part.text}</MessageResponse>
                        ) : null,
                      )}
                    </MessageContent>
                  </Message>
                ))}
                {status === 'submitted' && (
                  <div className="px-2 py-1">
                    <Shimmer>Pensando…</Shimmer>
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="px-4 py-2 border-t bg-muted/30">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickActions.map((qa, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap text-xs"
                    disabled={status === 'submitted' || status === 'streaming'}
                    onClick={() => sendMessage({ text: qa.action })}
                  >
                    {qa.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-3 border-t bg-background">
              <PromptInput
                onSubmit={(message) => {
                  const text = message.text?.trim();
                  if (!text) return;
                  sendMessage({ text });
                }}
              >
                <PromptInputTextarea
                  ref={textareaRef}
                  placeholder="Escribe tu mensaje..."
                  autoFocus
                />
                <PromptInputFooter className="justify-end">
                  <PromptInputSubmit
                    size="icon-sm"
                    className="rounded-full h-9 w-9"
                    status={status}
                    onStop={stop}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default CopilotChat;
