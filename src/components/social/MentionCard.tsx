import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ExternalLink } from 'lucide-react';
import type { SocialMention } from '@/hooks/useSocialMentions';
import { platformConfig } from './socialConfig';
import { SentimentIcon } from './SentimentIcon';

export const MentionCard: React.FC<{ mention: SocialMention }> = ({ mention }) => {
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
            <Button variant="outline" size="sm">Responder</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
