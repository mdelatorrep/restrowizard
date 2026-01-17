import React, { useState } from 'react';
import { Plus, Eye, Edit3, Share2, QrCode, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMenus } from '@/hooks/useMenus';
import { CreateMenuDialog } from '@/components/menus/CreateMenuDialog';
import { MenuEditor } from '@/components/menus/MenuEditor';
import { QRCodeDialog } from '@/components/menus/QRCodeDialog';
import { ShareMenuDialog } from '@/components/menus/ShareMenuDialog';

const RestaurantMenus = () => {
  const { menus, loading, publishMenu } = useMenus();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<string | null>(null);
  const [sharingMenu, setSharingMenu] = useState<string | null>(null);
  const [qrMenu, setQrMenu] = useState<string | null>(null);

  const handlePublish = async (menuId: string) => {
    await publishMenu(menuId);
  };

  if (editingMenu) {
    return (
      <MenuEditor 
        menuId={editingMenu} 
        onBack={() => setEditingMenu(null)} 
      />
    );
  }

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
          <h1 className="text-3xl font-bold">Menús Digitales</h1>
          <p className="text-muted-foreground">
            Gestiona y personaliza los menús de tu restaurante
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Nuevo Menú
        </Button>
      </div>

      {menus.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tienes menús creados</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Comienza creando tu primer menú usando nuestras plantillas profesionales
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Crear Mi Primer Menú
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Card key={menu.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{menu.name}</CardTitle>
                  <Badge 
                    variant={menu.status === 'published' ? 'default' : 'secondary'}
                    className={menu.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {menu.status === 'published' ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
                <CardDescription>
                  {menu.description || 'Menú creado con RestroWizard'}
                </CardDescription>
                <Badge variant="outline" className="w-fit capitalize">
                  {menu.cuisine_type.replace('_', ' ')}
                </Badge>
              </CardHeader>
              
              <CardFooter className="flex flex-col space-y-2">
                <div className="flex space-x-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMenu(menu.id)}
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  {menu.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/menu/${menu.public_url_slug}`, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  )}
                </div>
                
                {menu.status === 'draft' ? (
                  <Button
                    size="sm"
                    onClick={() => handlePublish(menu.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publicar Menú
                  </Button>
                ) : (
                  <div className="flex space-x-2 w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSharingMenu(menu.id)}
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Compartir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setQrMenu(menu.id)}
                      className="flex-1"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR Code
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateMenuDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
        />
      )}

      {sharingMenu && (
        <ShareMenuDialog
          menuId={sharingMenu}
          open={!!sharingMenu}
          onOpenChange={(open) => !open && setSharingMenu(null)}
        />
      )}

      {qrMenu && (
        <QRCodeDialog
          menuId={qrMenu}
          open={!!qrMenu}
          onOpenChange={(open) => !open && setQrMenu(null)}
        />
      )}
    </div>
  );
};

export default RestaurantMenus;
