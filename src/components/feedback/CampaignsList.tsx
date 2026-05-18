import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Plus, Eye } from 'lucide-react';
import { FeedbackCampaign } from '@/hooks/useFeedbackData';

interface Props {
  campaigns: FeedbackCampaign[];
  onCreateClick: () => void;
  onSelectQR: (campaign: FeedbackCampaign) => void;
}

export const CampaignsList = ({ campaigns, onCreateClick, onSelectQR }: Props) => {
  if (campaigns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sin campañas</h3>
          <p className="text-muted-foreground text-center mb-4">
            Crea códigos QR para recopilar feedback en mesas
          </p>
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Campaña
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
                <Button size="sm" onClick={() => onSelectQR(campaign)}>
                  <QrCode className="h-4 w-4 mr-1" />
                  QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
