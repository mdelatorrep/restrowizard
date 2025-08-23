import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, Share2, Facebook, Twitter, Mail } from 'lucide-react';
import { useMenus } from '@/hooks/useMenus';
import { useToast } from '@/hooks/use-toast';

interface ShareMenuDialogProps {
  menuId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareMenuDialog: React.FC<ShareMenuDialogProps> = ({ menuId, open, onOpenChange }) => {
  const { menus } = useMenus();
  const { toast } = useToast();

  const menu = menus.find(m => m.id === menuId);
  const publicUrl = menu ? `${window.location.origin}/menu/${menu.public_url_slug}` : '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: 'Copiado',
      description: 'URL copiada al portapapeles',
    });
  };

  const handleOpenMenu = () => {
    window.open(publicUrl, '_blank');
  };

  const shareOnFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const text = `Revisa el menú de ${menu?.name || 'nuestro restaurante'}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(publicUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = `Menú de ${menu?.name || 'nuestro restaurante'}`;
    const body = `Te invito a revisar nuestro menú:\n\n${publicUrl}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const shareViaNativeAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: menu?.name || 'Menú del Restaurante',
          text: `Revisa el menú de ${menu?.name || 'nuestro restaurante'}`,
          url: publicUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  if (!menu) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir Menú</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Menu Info */}
          <div className="text-center">
            <h3 className="font-lato-bold text-lg text-slate-dark">{menu.name}</h3>
            {menu.description && (
              <p className="text-sm text-slate-medium">{menu.description}</p>
            )}
          </div>

          {/* URL Section */}
          <div>
            <Label htmlFor="menu-url">URL del Menú</Label>
            <div className="flex mt-1">
              <Input
                id="menu-url"
                value={publicUrl}
                readOnly
                className="rounded-r-none"
              />
              <Button 
                onClick={handleCopyUrl}
                variant="outline"
                className="rounded-l-none border-l-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleOpenMenu}
              variant="outline" 
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Menú Público
            </Button>

            {navigator.share && (
              <Button 
                onClick={shareViaNativeAPI}
                className="w-full bg-purple-intense hover:bg-purple-medium text-off-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            )}
          </div>

          {/* Social Media Sharing */}
          <div>
            <Label className="text-sm font-medium text-slate-dark">
              Compartir en Redes Sociales
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button 
                onClick={shareOnFacebook}
                variant="outline" 
                size="sm"
                className="flex flex-col h-auto py-3"
              >
                <Facebook className="w-5 h-5 mb-1 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button 
                onClick={shareOnTwitter}
                variant="outline" 
                size="sm"
                className="flex flex-col h-auto py-3"
              >
                <Twitter className="w-5 h-5 mb-1 text-blue-400" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button 
                onClick={shareViaEmail}
                variant="outline" 
                size="sm"
                className="flex flex-col h-auto py-3"
              >
                <Mail className="w-5 h-5 mb-1 text-gray-600" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-purple-light/10 border border-purple-light rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-dark mb-2">
              💡 Consejos para compartir:
            </h4>
            <ul className="text-xs text-slate-medium space-y-1">
              <li>• Coloca el código QR en tu mesa o mostrador</li>
              <li>• Comparte la URL en tus redes sociales</li>
              <li>• Incluye el enlace en tu firma de email</li>
              <li>• Agrega el enlace a tu sitio web</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};