import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSocialMentions, SocialMention } from '@/hooks/useSocialMentions';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, Plus, Loader2, TrendingUp, TrendingDown, Star,
  ThumbsUp, ThumbsDown, Minus, MessageCircle, ExternalLink, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const platformConfig: Record<string, { label: string; color: string }> = {
  google: { label: 'Google', color: 'bg-blue-100 text-blue-800' },
  tripadvisor: { label: 'TripAdvisor', color: 'bg-green-100 text-green-800' },
  yelp: { label: 'Yelp', color: 'bg-red-100 text-red-800' },
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-800' },
  facebook: { label: 'Facebook', color: 'bg-indigo-100 text-indigo-800' },
  twitter: { label: 'Twitter/X', color: 'bg-sky-100 text-sky-800' },
};

const SentimentIcon = ({ label }: { label: string | null }) => {
  if (label === 'positive') return <ThumbsUp className="h-4 w-4 text-green-500" />;
  if (label === 'negative') return <ThumbsDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
};

const MentionCard = ({ mention }: { mention: SocialMention }) => {
  const platform = platformConfig[mention.platform] || platformConfig.google;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={platform.color}>{platform.label}</Badge>
            {mention.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{mention.rating}</span>
              </div>
            )}
          </div>
          <SentimentIcon label={mention.sentiment_label} />
        </div>
        <p className="text-sm mb-3">{mention.content}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{mention.author_name || 'Anónimo'}</span>
          <span>{mention.published_at ? format(new Date(mention.published_at), 'PP', { locale: es }) : '-'}</span>
        </div>
        {(mention.engagement_likes || mention.engagement_comments) && (
          <div className="flex gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
            {mention.engagement_likes && <span>❤️ {mention.engagement_likes}</span>}
            {mention.engagement_comments && <span>💬 {mention.engagement_comments}</span>}
            {mention.engagement_shares && <span>🔄 {mention.engagement_shares}</span>}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {mention.author_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={mention.author_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver
              </a>
            </Button>
          )}
          {!mention.responded && (
            <Button variant="outline" size="sm">
              Responder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SocialListening = () => {
  const { mentions, accounts, reports, kpis, loading, hasData, addMention, addAccount } = useSocialMentions();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');

  const [mentionForm, setMentionForm] = useState({
    platform: 'google',
    content: '',
    author_name: '',
    rating: 5,
  });

  const [accountForm, setAccountForm] = useState({
    platform: 'google',
    account_name: '',
    account_url: '',
  });

  const handleAddMention = async () => {
    if (!mentionForm.content.trim()) {
      toast({ title: 'Error', description: 'El contenido es requerido', variant: 'destructive' });
      return;
    }
    await addMention({
      ...mentionForm,
      published_at: new Date().toISOString(),
    });
    setShowAddDialog(false);
    setMentionForm({ platform: 'google', content: '', author_name: '', rating: 5 });
  };

  const handleConnectAccount = async () => {
    if (!accountForm.account_name.trim()) {
      toast({ title: 'Error', description: 'El nombre de cuenta es requerido', variant: 'destructive' });
      return;
    }
    await addAccount(accountForm);
    setShowConnectDialog(false);
    setAccountForm({ platform: 'google', account_name: '', account_url: '' });
  };

  const filteredMentions = mentions.filter(m => {
    const matchesPlatform = filterPlatform === 'all' || m.platform === filterPlatform;
    const matchesSentiment = filterSentiment === 'all' || m.sentiment_label === filterSentiment;
    return matchesPlatform && matchesSentiment;
  });

  const sentimentScore = kpis?.avgSentiment ? (kpis.avgSentiment * 100).toFixed(0) : '0';

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
          <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                Conectar Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conectar Cuenta de Redes</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Plataforma</Label>
                  <Select
                    value={accountForm.platform}
                    onValueChange={(value) => setAccountForm({ ...accountForm, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                      <SelectItem value="yelp">Yelp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Nombre de la Cuenta</Label>
                  <Input
                    value={accountForm.account_name}
                    onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                    placeholder="@turestaurante"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>URL del Perfil</Label>
                  <Input
                    value={accountForm.account_url}
                    onChange={(e) => setAccountForm({ ...accountForm, account_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancelar</Button>
                <Button onClick={handleConnectAccount}>Conectar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Mención
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Mención Manual</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Plataforma</Label>
                    <Select
                      value={mentionForm.platform}
                      onValueChange={(value) => setMentionForm({ ...mentionForm, platform: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                        <SelectItem value="yelp">Yelp</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Calificación</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMentionForm({ ...mentionForm, rating: star })}
                        >
                          <Star
                            className={`h-6 w-6 ${star <= mentionForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Autor</Label>
                  <Input
                    value={mentionForm.author_name}
                    onChange={(e) => setMentionForm({ ...mentionForm, author_name: e.target.value })}
                    placeholder="Nombre del usuario"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Contenido</Label>
                  <Input
                    value={mentionForm.content}
                    onChange={(e) => setMentionForm({ ...mentionForm, content: e.target.value })}
                    placeholder="Texto de la reseña o mención"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                <Button onClick={handleAddMention}>Agregar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Menciones</p>
                <p className="text-3xl font-bold">{kpis?.totalMentions || 0}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Sentimiento</p>
                <p className="text-3xl font-bold">{sentimentScore}%</p>
              </div>
              {Number(sentimentScore) >= 70 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positivas</p>
                <p className="text-3xl font-bold text-green-600">{kpis?.positivePercent || 0}%</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negativas</p>
                <p className="text-3xl font-bold text-red-600">{kpis?.negativePercent || 0}%</p>
              </div>
              <ThumbsDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mentions">
        <TabsList>
          <TabsTrigger value="mentions">Menciones</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas Conectadas</TabsTrigger>
          <TabsTrigger value="reports">Reportes IA</TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="space-y-4">
          <div className="flex gap-4">
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSentiment} onValueChange={setFilterSentiment}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sentimiento" />
              </SelectTrigger>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowConnectDialog(true)}>
                    <Globe className="h-4 w-4 mr-2" />
                    Conectar Cuenta
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Mención
                  </Button>
                </div>
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
          {accounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Globe className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin cuentas conectadas</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Conecta tus perfiles de redes para monitorear menciones automáticamente
                </p>
                <Button onClick={() => setShowConnectDialog(true)}>
                  <Globe className="h-4 w-4 mr-2" />
                  Conectar Primera Cuenta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(account => (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={platformConfig[account.platform]?.color}>
                        {platformConfig[account.platform]?.label}
                      </Badge>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{account.account_name}</p>
                    {account.last_sync_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Último sync: {format(new Date(account.last_sync_at), 'PPp', { locale: es })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin reportes</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Genera reportes de sentimiento con análisis de IA
                </p>
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Reporte {format(new Date(report.report_date), 'PP', { locale: es })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Menciones</p>
                        <p className="text-xl font-bold">{report.total_mentions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Positivas</p>
                        <p className="text-xl font-bold text-green-600">{report.positive_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Negativas</p>
                        <p className="text-xl font-bold text-red-600">{report.negative_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-xl font-bold">{((report.avg_sentiment || 0) * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    {report.ai_summary && (
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-medium">Resumen IA</span>
                        </div>
                        <p className="text-sm">{report.ai_summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialListening;
