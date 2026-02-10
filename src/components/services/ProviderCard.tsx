import { MapPin, Star, CheckCircle, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const categoryLabels: Record<string, string> = {
  equipment: 'Equipamiento', technology: 'Tecnología', food_supplies: 'Ingredientes',
  consulting: 'Consultoría', design: 'Diseño', catering: 'Catering',
  photography: 'Fotografía', music: 'Música', decoration: 'Decoración',
  lighting: 'Iluminación', entertainment: 'Entretenimiento', flowers: 'Flores', other: 'Otro',
};

interface ProviderCardProps {
  provider: any;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="bg-card hover:shadow-xl transition-all cursor-pointer border border-border group"
      onClick={() => navigate(`/services/provider/${provider.id}`)}
    >
      {provider.cover_image_url && (
        <div className="h-32 w-full overflow-hidden rounded-t-lg">
          <img src={provider.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
              {provider.name}
              {provider.is_verified && (
                <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                  <CheckCircle className="h-3 w-3 mr-0.5" /> Verificado
                </Badge>
              )}
            </CardTitle>
            {provider.headline && (
              <p className="text-sm text-muted-foreground mt-1">{provider.headline}</p>
            )}
            <p className="text-sm text-primary font-medium mt-0.5">
              {provider.specialty || categoryLabels[provider.category] || provider.category}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {provider.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{provider.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{provider.city}</span>
          {(provider.average_rating || provider.rating) && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              {(provider.average_rating || provider.rating)?.toFixed(1)}
            </span>
          )}
          <span className="text-xs">({provider.reviews_count || 0} reseñas)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
          {provider.completed_projects > 0 && (
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{provider.completed_projects} proyectos</span>
          )}
          {provider.response_time_hours && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Responde en {provider.response_time_hours}h</span>
          )}
        </div>

        {provider.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {provider.tags.slice(0, 4).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 text-xs">Ver Perfil</Button>
          <Button size="sm" variant="outline" className="text-xs">Cotizar</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;
