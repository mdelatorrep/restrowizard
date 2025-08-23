import React, { useState } from 'react';
import { Plus, Eye, Edit3, Share2, QrCode, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMenus } from '@/hooks/useMenus';
import { CreateMenuDialog } from '@/components/menus/CreateMenuDialog';
import { MenuEditor } from '@/components/menus/MenuEditor';
import { QRCodeDialog } from '@/components/menus/QRCodeDialog';
import { ShareMenuDialog } from '@/components/menus/ShareMenuDialog';

const Menus = () => {
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

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-lato-bold text-slate-dark mb-2">
            Mis Menús
          </h1>
          <p className="text-slate-medium">
            Gestiona y personaliza los menús de tu restaurante con nuestras plantillas inteligentes
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-purple-intense hover:bg-purple-medium text-off-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Nuevo Menú
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-purple-medium" />
              </div>
              <h3 className="text-lg font-lato-bold text-slate-dark mb-2">
                No tienes menús creados
              </h3>
              <p className="text-slate-medium mb-4">
                Comienza creando tu primer menú usando nuestras plantillas profesionales
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-purple-intense hover:bg-purple-medium text-off-white"
              >
                Crear Mi Primer Menú
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <Card key={menu.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-lato-bold text-slate-dark">
                      {menu.name}
                    </CardTitle>
                    <Badge 
                      variant={menu.status === 'published' ? 'default' : 'secondary'}
                      className={menu.status === 'published' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                      }
                    >
                      {menu.status === 'published' ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-medium">
                    {menu.description || 'Menú creado con RestroWizard'}
                  </CardDescription>
                  <div className="text-sm text-slate-medium">
                    <Badge variant="outline" className="capitalize">
                      {menu.cuisine_type.replace('_', ' ')}
                    </Badge>
                  </div>
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
    </div>
  );
};

export default Menus;