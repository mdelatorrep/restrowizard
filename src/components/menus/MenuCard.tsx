import React from 'react';
import {
  Eye, Edit3, Share2, QrCode, CheckCircle, MoreVertical,
  Trash2, Copy, Sparkles, Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuLike {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  view_count?: number | null;
  cuisine_type?: string | null;
  public_url_slug?: string | null;
}

interface Props {
  menu: MenuLike;
  index?: number;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (id: string) => void;
  onQr: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}

export const MenuCard: React.FC<Props> = ({
  menu, index = 0, onEdit, onDuplicate, onShare, onQr, onDelete, onPublish,
}) => {
  const isPublished = menu.status === 'published';
  return (
    <Card
      className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-card"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`h-1.5 ${isPublished
        ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
        : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500'}`} />

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${isPublished
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 border-0'
              } shadow-sm`}>
                {isPublished ? '✓ Publicado' : '◯ Borrador'}
              </Badge>
              {menu.view_count && menu.view_count > 0 && (
                <Badge variant="outline" className="text-muted-foreground bg-muted/50">
                  <Eye className="w-3 h-3 mr-1" />
                  {menu.view_count}
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">
              {menu.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {menu.description || 'Menú profesional con RestroWizard'}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(menu.id)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar menú
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(menu.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              {isPublished && (
                <>
                  <DropdownMenuItem onClick={() => onShare(menu.id)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onQr(menu.id)}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Código QR
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(menu.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-6">
          <Badge variant="outline" className="capitalize text-xs bg-muted/50">
            <Utensils className="w-3 h-3 mr-1" />
            {menu.cuisine_type?.replace('_', ' ') || 'General'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit(menu.id)}
              className="flex-1 group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            >
              <Edit3 className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
              Editar
            </Button>
            {isPublished && menu.public_url_slug && (
              <Button
                variant="outline"
                onClick={() => window.open(`/menu/${menu.public_url_slug}`, '_blank')}
                className="flex-1 group/btn hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
              >
                <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Ver
              </Button>
            )}
          </div>

          {!isPublished ? (
            <Button
              onClick={() => onPublish(menu.id)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 group/pub"
            >
              <CheckCircle className="w-4 h-4 mr-2 group-hover/pub:scale-110 transition-transform" />
              Publicar Menú
              <Sparkles className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onShare(menu.id)}
                className="flex-1 group/share hover:bg-gradient-to-r hover:from-violet-500 hover:to-purple-600 hover:text-white hover:border-transparent"
              >
                <Share2 className="w-4 h-4 mr-2 group-hover/share:-rotate-12 transition-transform" />
                Compartir
              </Button>
              <Button
                variant="outline"
                onClick={() => onQr(menu.id)}
                className="flex-1 group/qr hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white hover:border-transparent"
              >
                <QrCode className="w-4 h-4 mr-2 group-hover/qr:rotate-12 transition-transform" />
                QR Code
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
};
