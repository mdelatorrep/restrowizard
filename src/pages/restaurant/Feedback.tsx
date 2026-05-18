import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedbackData, CustomerFeedback, FeedbackCampaign } from '@/hooks/useFeedbackData';
import { FeedbackQRDialog } from '@/components/feedback/FeedbackQRDialog';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { MessageSquare, QrCode, Plus, Loader2, Sparkles, Globe } from 'lucide-react';
import { SocialListeningContent } from './SocialListening';
import { FeedbackKPIs } from '@/components/feedback/FeedbackKPIs';
import { AddFeedbackDialog } from '@/components/feedback/AddFeedbackDialog';
import { CreateCampaignDialog } from '@/components/feedback/CreateCampaignDialog';
import { RespondFeedbackDialog } from '@/components/feedback/RespondFeedbackDialog';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { CampaignsList } from '@/components/feedback/CampaignsList';
import { FeedbackAlerts } from '@/components/feedback/FeedbackAlerts';

const Feedback = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mainTab = searchParams.get('mainTab') || 'feedback';
  const { feedback, campaigns, kpis, loading, addFeedback, createCampaign, respondToFeedback } = useFeedbackData();
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<FeedbackCampaign | null>(null);
  const [responseText, setResponseText] = useState('');
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { analyzeFeedbackTrends, loading: aiLoading } = useAIAgent();

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
      kpis,
      positiveCount: feedback.filter(f => f.sentiment_label === 'positive').length,
      negativeCount: feedback.filter(f => f.sentiment_label === 'negative').length,
      neutralCount: feedback.filter(f => f.sentiment_label === 'neutral').length
    };
    const result = await analyzeFeedbackTrends(feedbackData);
    if (result) setAiInsights(result);
  };

  const openRespond = (item: CustomerFeedback) => {
    setSelectedFeedback(item);
    setResponseText(item.ai_response_suggestion || '');
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

      <Tabs value={mainTab} onValueChange={(v) => setSearchParams({ mainTab: v })}>
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
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleAnalyzeTrends} disabled={aiLoading || feedback.length === 0}>
              <Sparkles className="h-4 w-4 mr-2" />
              {aiLoading ? 'Analizando...' : 'Analizar Tendencias'}
            </Button>
            <Button variant="outline" onClick={() => setShowCampaignDialog(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
            <Button onClick={() => setShowFeedbackDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Feedback
            </Button>
          </div>

          <FeedbackKPIs kpis={kpis} />

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
              <FeedbackList
                feedback={feedback}
                onAddClick={() => setShowFeedbackDialog(true)}
                onRespond={openRespond}
              />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-4">
              <CampaignsList
                campaigns={campaigns}
                onCreateClick={() => setShowCampaignDialog(true)}
                onSelectQR={setSelectedCampaign}
              />
            </TabsContent>

            <TabsContent value="alerts">
              <FeedbackAlerts feedback={feedback} onRespond={openRespond} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reputation" className="mt-6">
          <SocialListeningContent />
        </TabsContent>
      </Tabs>

      <AddFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        onAdd={addFeedback}
      />

      <CreateCampaignDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        onCreate={createCampaign}
      />

      <RespondFeedbackDialog
        feedback={selectedFeedback}
        responseText={responseText}
        setResponseText={setResponseText}
        onClose={() => setSelectedFeedback(null)}
        onSubmit={handleRespond}
      />

      <FeedbackQRDialog
        campaign={selectedCampaign}
        open={!!selectedCampaign}
        onOpenChange={(open) => !open && setSelectedCampaign(null)}
      />
    </div>
  );
};

export default Feedback;
