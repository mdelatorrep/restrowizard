import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: any;
  enrollment?: any;
  compact?: boolean;
}

const levelLabels: Record<string, string> = {
  entry: 'Principiante', junior: 'Junior', mid: 'Intermedio', senior: 'Avanzado', executive: 'Experto',
};

const categoryEmojis: Record<string, string> = {
  kitchen: '🍳', service: '🍷', management: '📊', marketing: '📱', bartender: '🍸',
  cleaning: '🧹', delivery: '🛵', finance: '💰', administration: '📋', other: '📚',
};

const CourseCard: React.FC<CourseCardProps> = ({ course, enrollment, compact }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="group cursor-pointer bg-card hover:shadow-lg transition-all border border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/learn/course/${course.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <span className="text-3xl">{categoryEmojis[course.category] || '📚'}</span>
          <Badge variant="outline" className="text-xs">{levelLabels[course.level] || course.level}</Badge>
        </div>
        <h3 className="font-headline text-base mt-2 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
        {!compact && course.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{course.short_description}</p>
        )}
      </CardHeader>
      <CardContent>
        {course.instructor_name && (
          <p className="text-xs text-muted-foreground mb-2">Por {course.instructor_name}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {course.duration_hours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration_hours}h</span>}
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(course.enrollments_count || 0).toLocaleString()}</span>
          {course.average_rating > 0 && (
            <span className="flex items-center gap-1 text-yellow-500"><Star className="h-3 w-3 fill-current" />{course.average_rating?.toFixed(1)}</span>
          )}
        </div>

        {enrollment ? (
          <div className="space-y-2">
            <Progress value={enrollment.progress_percent || 0} className="h-2" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{enrollment.progress_percent || 0}% completado</span>
              <Button size="sm" variant="default" className="text-xs" onClick={e => { e.stopPropagation(); navigate(`/learn/course/${course.id}`); }}>
                Continuar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-lg font-headline text-primary">{course.is_free ? 'Gratis' : `$${course.price?.toLocaleString()}`}</span>
            <Button size="sm" variant="outline" className="text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Ver Curso
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard;
