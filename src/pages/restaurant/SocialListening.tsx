import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSocialMentions } from '@/hooks/useSocialMentions';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MentionCard } from '@/components/social/MentionCard';
import { SocialKPIs } from '@/components/social/SocialKPIs';
import { ConnectAccountDialog } from '@/components/social/ConnectAccountDialog';
import { AddMentionDialog } from '@/components/social/AddMentionDialog';
import { SocialAccountsTab } from '@/components/social/SocialAccountsTab';
import { SocialReportsTab } from '@/components/social/SocialReportsTab';

const SocialListening = () => <SocialListeningContent />;

export const SocialListeningContent = () => {
  const { mentions, accounts, reports, kpis, loading, hasData, addMention, addAccount } = useSocialMentions();
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');

  const filteredMentions = (mentions || []).filter(m => {
    const matchesPlatform = filterPlatform === 'all' || m.platform === filterPlatform;
    const matchesSentiment = filterSentiment === 'all' || m.sentiment_label === filterSentiment;
    return matchesPlatform && matchesSentiment;
  });

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
          <h1 className="text-3xl font-bold">Análisis de Sentimientos</h1>
          <p className="text-muted-foreground">Monitorea tu reputación en redes y sitios de reseñas</p>
        </div>
        <div className="flex gap-2">
          <ConnectAccountDialog onConnect={addAccount} />
          <AddMentionDialog onAdd={addMention} />
        </div>
      </div>

      <SocialKPIs kpis={kpis} />

      <Tabs defaultValue="mentions">
        <TabsList>
          <TabsTrigger value="mentions">Menciones</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas Conectadas</TabsTrigger>
          <TabsTrigger value="reports">Reportes IA</TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="space-y-4">
          <div className="flex gap-4">
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Plataforma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSentiment} onValueChange={setFilterSentiment}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Sentimiento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">Positivos</SelectItem>
                <SelectItem value="neutral">Neutrales</SelectItem>
                <SelectItem value="negative">Negativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!hasData ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Globe className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin menciones</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Conecta tus cuentas de redes sociales o agrega menciones manualmente
                </p>
                <Button variant="outline" disabled>
                  Usa los botones superiores para empezar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentions.map(mention => (
                <MentionCard key={mention.id} mention={mention} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <SocialAccountsTab accounts={accounts || []} onConnect={() => { /* abrir dialog */ }} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <SocialReportsTab reports={reports || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialListening;
