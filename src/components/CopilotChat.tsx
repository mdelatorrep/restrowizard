import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUserType } from '@/hooks/useUserType';
import { useCopilotAlerts } from '@/hooks/useCopilotAlerts';
import { useFinancesData } from '@/hooks/useFinancesData';
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Bot,
  User,
  Loader2,
  Sun,
  AlertTriangle,
  TrendingUp,
  ChefHat,
  Briefcase,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const CopilotChat = () => {
  const { user } = useAuthContext();
  const { userType, isConsultant } = useUserType();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Real data hooks
  const { alerts: copilotAlerts, unreadAlerts, generateAlerts, isLoading: alertsLoading } = useCopilotAlerts();
  const { kpis, sales, hasData: hasFinanceData } = useFinancesData();

  // Generate dynamic briefing from real data
  const getDynamicBriefing = () => {
    const highlights: string[] = [];
    const alertsForBriefing: { type: string; message: string; priority: string }[] = [];
    const recommendations: string[] = [];

    // Build highlights from finance data
    if (hasFinanceData && kpis) {
      highlights.push(`📈 Ingresos (7 días): $${(kpis.totalRevenue / 1000).toFixed(1)}k`);
      highlights.push(`📊 Food Cost: ${kpis.foodCostPercentage.toFixed(1)}% ${kpis.foodCostPercentage <= 32 ? '✅' : '⚠️'}`);
      highlights.push(`🎫 Ticket Promedio: $${kpis.averageTicket.toFixed(0)}`);
      highlights.push(`👥 Cubiertos (7 días): ${kpis.totalCovers}`);
    } else {
      highlights.push('📊 Registra tus primeras ventas para ver métricas');
    }

    // Build alerts from copilot alerts
    copilotAlerts.slice(0, 3).forEach(alert => {
      alertsForBriefing.push({
        type: alert.alert_type,
        message: alert.message,
        priority: alert.priority || 'medium'
      });
    });

    // Build recommendations based on data
    if (hasFinanceData && kpis) {
      if (kpis.foodCostPercentage > 32) {
        recommendations.push('Revisa tus costos de alimentos - están por encima del benchmark');
      }
      if (kpis.laborCostPercentage > 25) {
        recommendations.push('Considera optimizar turnos de personal para reducir costos laborales');
      }
      recommendations.push('Mantén el registro diario de ventas para mejores predicciones');
    } else {
      recommendations.push('Comienza registrando tus ventas diarias en el módulo de Finanzas');
      recommendations.push('Configura tu inventario para recibir alertas de stock bajo');
    }

    return { highlights, alerts: alertsForBriefing, recommendations };
  };

  const briefing = getDynamicBriefing();
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Add welcome message when opening
    if (isOpen && messages.length === 0) {
      const welcomeContent = isConsultant 
        ? '¡Hola! Soy tu copiloto de RestroWizard 🚀\n\nComo consultor, puedo ayudarte con:\n• Análisis de tu portafolio de clientes\n• Comparativas entre restaurantes\n• Alertas consolidadas\n• Generación de reportes\n• Insights para recomendaciones\n\n¿En qué puedo ayudarte hoy?'
        : '¡Hola! Soy tu copiloto de RestroWizard 🚀\n\nPuedo ayudarte con:\n• Análisis de ventas y finanzas\n• Gestión de inventario\n• Optimización de personal\n• Insights de clientes\n• Reportes y métricas\n\n¿En qué puedo ayudarte hoy?';
      
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, isConsultant]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('copilot-chat', {
        body: {
          message: inputValue,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Copilot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = isConsultant ? [
    { label: '📊 Estado portafolio', action: '¿Cuál es el estado de mi portafolio de clientes?' },
    { label: '⚠️ Alertas críticas', action: '¿Cuáles clientes tienen alertas críticas?' },
    { label: '📈 Comparativa', action: 'Compara el rendimiento de mis clientes' },
    { label: '💡 Recomendaciones', action: 'Dame recomendaciones para mis clientes' }
  ] : [
    { label: '📊 Resumen de hoy', action: '¿Cuál es el resumen de ventas de hoy?' },
    { label: '📦 Inventario bajo', action: '¿Qué productos tienen inventario bajo?' },
    { label: '👥 Personal activo', action: '¿Quién está trabajando hoy?' },
    { label: '💡 Sugerencias', action: 'Dame sugerencias para mejorar las ventas' }
  ];

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
        {/* Notification badge - show real unread count */}
        {unreadAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white">
            {unreadAlerts.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed z-50 shadow-2xl transition-all duration-300 ${
      isMinimized 
        ? 'bottom-6 right-6 w-80' 
        : 'bottom-6 right-6 w-96 md:w-[450px]'
    }`}>
      <Card className="border-primary/20 overflow-hidden">
        {/* Header */}
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
            {/* Daily Briefing */}
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
                        <AlertTriangle className={`h-4 w-4 ${
                          a.priority === 'high' || a.priority === 'critical' ? 'text-destructive' : 
                          a.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
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

            {/* Messages */}
            <ScrollArea className="h-80 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t bg-muted/30">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickActions.map((qa, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap text-xs"
                    onClick={() => {
                      setInputValue(qa.action);
                    }}
                  >
                    {qa.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default CopilotChat;
