import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Target, Zap } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export const LoyaltyCampaignsTab = ({ campaigns }: { campaigns: Campaign[] }) => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Campañas de Puntos
        </CardTitle>
        <CardDescription>Crea campañas para impulsar comportamientos específicos</CardDescription>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No hay campañas activas</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Crear Campaña
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                </div>
                <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                  {campaign.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
