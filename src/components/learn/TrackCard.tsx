import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    slug: string | null;
    short_description: string | null;
    target_role: string | null;
    difficulty: string;
    estimated_weeks: number | null;
    courses_count: number;
    enrollments_count: number;
    icon_emoji: string | null;
    is_featured: boolean | null;
  };
}

const difficultyLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="group cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-xl transition-all duration-300"
      onClick={() => navigate(`/learn/track/${track.slug || track.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{track.icon_emoji || '🎓'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={difficultyColors[track.difficulty] || 'bg-muted text-muted-foreground'}>
                {difficultyLabels[track.difficulty] || track.difficulty}
              </Badge>
              {track.is_featured && <Badge className="bg-primary text-primary-foreground">Destacado</Badge>}
            </div>
            <h3 className="font-headline text-lg text-foreground group-hover:text-primary transition-colors truncate">
              {track.title}
            </h3>
            {track.short_description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{track.short_description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{track.courses_count} cursos</span>
              {track.estimated_weeks && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{track.estimated_weeks} semanas</span>}
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{track.enrollments_count.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackCard;
