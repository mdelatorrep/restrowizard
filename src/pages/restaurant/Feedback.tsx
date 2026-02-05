import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFeedbackData, CustomerFeedback, FeedbackCampaign } from '@/hooks/useFeedbackData';
import { FeedbackQRDialog } from '@/components/feedback/FeedbackQRDialog';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, Star, TrendingUp, TrendingDown, AlertTriangle, 
  QrCode, Plus, Loader2, ThumbsUp, ThumbsDown, Minus, Sparkles,
  Mail, Phone, Eye, Globe
} from 'lucide-react';
import { SocialListeningContent } from './SocialListening';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SentimentBadge = ({ label }: { label: string | null }) => {
  if (!label) return null;
  const config = {
    positive: { icon: ThumbsUp, color: 'bg-green-100 text-green-800' },
    negative: { icon: ThumbsDown, color: 'bg-red-100 text-red-800' },
    neutral: { icon: Minus, color: 'bg-gray-100 text-gray-800' },
  };
  const { icon: Icon, color } = config[label as keyof typeof config] || config.neutral;
  return (
    <Badge className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};

const StarRating = ({ rating }: { rating: number | null }) => {
  if (!rating) return <span className="text-muted-foreground">Sin calificación</span>;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const Feedback = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mainTab = searchParams.get('mainTab') || 'feedback';
  const { feedback, campaigns, kpis, loading, hasData, addFeedback, createCampaign, respondToFeedback } = useFeedbackData();
  const { toast } = useToast();
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<FeedbackCampaign | null>(null);
  const [responseText, setResponseText] = useState('');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  const { analyzeFeedbackTrends, getImprovementPriorities, loading: aiLoading } = useAIAgent();

  const [feedbackForm, setFeedbackForm] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5,
    comment: '',
    source: 'in_store',
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    incentive: '',
  });

  const handleAddFeedback = async () => {
    await addFeedback(feedbackForm);
    setShowFeedbackDialog(false);
    setFeedbackForm({ customer_name: '', customer_email: '', rating: 5, comment: '', source: 'in_store' });
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }
    await createCampaign(campaignForm);
    setShowCampaignDialog(false);
    setCampaignForm({ name: '', incentive: '' });
  };

  const handleRespond = async () => {
    if (!selectedFeedback) return;
    await respondToFeedback(selectedFeedback.id, responseText);
    setSelectedFeedback(null);
    setResponseText('');
  };

  const handleAnalyzeTrends = async () => {
    const feedbackData = {
      feedback: feedback.map(f => ({
        customerName: f.customer_name,
        rating: f.rating,
        comment: f.comment,
        sentiment: f.sentiment_label,
        source: f.source,
        date: f.created_at,
        foodRating: f.food_rating,
        serviceRating: f.service_rating,
        ambianceRating: f.ambiance_rating
      })),
      kpis: kpis,
      positiveCount: feedback.filter(f => f.sentiment_label === 'positive').length,
      negativeCount: feedback.filter(f => f.sentiment_label === 'negative').length,
      neutralCount: feedback.filter(f => f.sentiment_label === 'neutral').length
    };
    
    const result = await analyzeFeedbackTrends(feedbackData);
    if (result) setAiInsights(result);
  };

  const handleMainTabChange = (value: string) => {
    setSearchParams({ mainTab: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback y Reputación</h1>
          <p className="text-muted-foreground">Gestiona opiniones y monitorea tu reputación online</p>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={handleMainTabChange}>
        <TabsList>
          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="reputation" className="gap-2">
            <Globe className="h-4 w-4" />
            Reputación Online
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-6 space-y-6">
          {/* Feedback Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleAnalyzeTrends} disabled={aiLoading || feedback.length === 0}>
              <Sparkles className="h-4 w-4 mr-2" />
              {aiLoading ? 'Analizando...' : 'Analizar Tendencias'}
            </Button>
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Campaña de Feedback</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre de la Campaña</Label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="Ej: QR Mesas Enero"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Incentivo (opcional)</Label>
                  <Input
                    value={campaignForm.incentive}
                    onChange={(e) => setCampaignForm({ ...campaignForm, incentive: e.target.value })}
                    placeholder="Ej: 10% descuento próxima visita"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreateCampaign}>Crear Campaña</Button>
              </div>
            </DialogContent>
          </Dialog>
            <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Feedback</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre del Cliente</Label>
                  <Input
                    value={feedbackForm.customer_name}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, customer_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={feedbackForm.customer_email}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, customer_email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Calificación</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      >
                        <Star
                          className={`h-8 w-8 ${star <= feedbackForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Comentario</Label>
                  <Textarea
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                    placeholder="¿Qué opinó el cliente?"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Cancelar</Button>
                <Button onClick={handleAddFeedback}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-3xl font-bold">{kpis?.totalFeedback || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-3xl font-bold">{kpis?.avgRating?.toFixed(1) || '-'}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positivos</p>
                <p className="text-3xl font-bold text-green-600">{kpis?.positivePercent || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negativos</p>
                <p className="text-3xl font-bold text-red-600">{kpis?.negativePercent || 0}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel
        title="Análisis de Tendencias IA"
        description="Patrones en el feedback, prioridades de mejora y oportunidades"
        insights={aiInsights}
        loading={aiLoading}
        onAnalyze={handleAnalyzeTrends}
      />

          <Tabs defaultValue="recent">
        <TabsList>
              <TabsTrigger value="recent">Feedback Reciente</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas QR</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

            <TabsContent value="recent" className="space-y-4">
          {feedback.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin feedback aún</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Empieza a recopilar opiniones de tus clientes
                </p>
                <Button onClick={() => setShowFeedbackDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Feedback
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {feedback.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{item.customer_name || 'Anónimo'}</p>
                          <StarRating rating={item.rating} />
                          <SentimentBadge label={item.sentiment_label} />
                          {!item.responded && item.sentiment_label === 'negative' && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Requiere atención
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-2">{item.comment}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{format(new Date(item.created_at!), 'PPp', { locale: es })}</span>
                          <Badge variant="outline">{item.source}</Badge>
                          {item.customer_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {item.customer_email}
                            </span>
                          )}
                        </div>
                        {item.responded && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Tu respuesta:</p>
                            <p className="text-sm">{item.response_text}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!item.responded && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(item);
                              setResponseText(item.ai_response_suggestion || '');
                            }}
                          >
                            Responder
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin campañas</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crea códigos QR para recopilar feedback en mesas
                </p>
                <Button onClick={() => setShowCampaignDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Campaña
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.incentive || 'Sin incentivo'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Respuestas:</span>
                      <span className="font-semibold">{campaign.responses_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={campaign.active ? 'default' : 'secondary'}>
                        {campaign.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/feedback/${campaign.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertas de Feedback Negativo
              </CardTitle>
              <CardDescription>
                Feedback que requiere atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.filter(f => f.sentiment_label === 'negative' && !f.responded).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  ¡Excelente! No hay alertas pendientes
                </p>
              ) : (
                <div className="space-y-3">
                  {feedback
                    .filter(f => f.sentiment_label === 'negative' && !f.responded)
                    .map(item => (
                      <div key={item.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{item.customer_name || 'Anónimo'}</p>
                            <p className="text-sm text-muted-foreground mt-1">{item.comment}</p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(item);
                              setResponseText(item.ai_response_suggestion || '');
                            }}
                          >
                            Responder
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reputation" className="mt-6">
          <SocialListeningContent />
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder a {selectedFeedback?.customer_name || 'Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{selectedFeedback?.comment}</p>
            </div>
            {selectedFeedback?.ai_response_suggestion && (
              <div className="p-3 border border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Sugerencia IA</span>
                </div>
                <p className="text-sm">{selectedFeedback.ai_response_suggestion}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setResponseText(selectedFeedback.ai_response_suggestion || '')}
                >
                  Usar sugerencia
                </Button>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Tu Respuesta</Label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedFeedback(null)}>Cancelar</Button>
            <Button onClick={handleRespond}>Enviar Respuesta</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog for Campaigns */}
      <FeedbackQRDialog
        campaign={selectedCampaign}
        open={!!selectedCampaign}
        onOpenChange={(open) => !open && setSelectedCampaign(null)}
      />
    </div>
  );
};

export default Feedback;
