import React, { useState } from 'react';
import { 
  Plus, Eye, Edit3, Share2, QrCode, CheckCircle, Loader2, 
  MoreVertical, Trash2, Copy, BarChart2, Users, FileEdit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMenus } from '@/hooks/useMenus';
import { CreateMenuDialog } from '@/components/menus/CreateMenuDialog';
import { MenuEditor } from '@/components/menus/MenuEditor';
import { QRCodeDialog } from '@/components/menus/QRCodeDialog';
import { ShareMenuDialog } from '@/components/menus/ShareMenuDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RestaurantMenus = () => {
  const { menus, loading, publishMenu, loadMenus } = useMenus();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<string | null>(null);
  const [sharingMenu, setSharingMenu] = useState<string | null>(null);
  const [qrMenu, setQrMenu] = useState<string | null>(null);
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);

  const handlePublish = async (menuId: string) => {
    await publishMenu(menuId);
  };

  const handleDeleteMenu = async () => {
    if (!deleteMenuId) return;
    
    try {
      const { error } = await supabase
        .from('restaurant_menus')
        .delete()
        .eq('id', deleteMenuId);

      if (error) throw error;
      
      toast({ title: 'Menú eliminado' });
      loadMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar el menú',
        variant: 'destructive' 
      });
    } finally {
      setDeleteMenuId(null);
    }
  };

  const handleDuplicateMenu = async (menuId: string) => {
    try {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate new slug
      const { data: slugData } = await supabase.rpc('generate_menu_slug', {
        menu_name: `${menu.name} (Copia)`
      });

      const { data: newMenu, error } = await supabase
        .from('restaurant_menus')
        .insert({
          name: `${menu.name} (Copia)`,
          description: menu.description,
          cuisine_type: menu.cuisine_type,
          config: menu.config,
          user_id: user.id,
          public_url_slug: slugData,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      // Copy menu items
      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuId);

      if (items && items.length > 0 && newMenu) {
        const newItems = items.map(item => ({
          ...item,
          id: undefined,
          menu_id: newMenu.id,
          created_at: undefined,
          updated_at: undefined,
        }));

        await supabase.from('menu_items').insert(newItems);
      }

      toast({ title: 'Menú duplicado' });
      loadMenus();
    } catch (error) {
      console.error('Error duplicating menu:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo duplicar el menú',
        variant: 'destructive' 
      });
    }
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

      {/* Stats Overview */}
      {menus.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileEdit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{menus.length}</p>
                <p className="text-xs text-muted-foreground">Menús</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{menus.filter(m => m.status === 'published').length}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {menus.reduce((sum, m) => sum + (m.view_count || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Visualizaciones</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{menus.filter(m => m.public_url_slug).length}</p>
                <p className="text-xs text-muted-foreground">Con QR activo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <Card key={menu.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{menu.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {menu.description || 'Menú creado con RestroWizard'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingMenu(menu.id)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar menú
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateMenu(menu.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      {menu.status === 'published' && (
                        <>
                          <DropdownMenuItem onClick={() => setSharingMenu(menu.id)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQrMenu(menu.id)}>
                            <QrCode className="w-4 h-4 mr-2" />
                            Código QR
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteMenuId(menu.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={menu.status === 'published' ? 'default' : 'secondary'}
                    className={menu.status === 'published' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                    }
                  >
                    {menu.status === 'published' ? 'Publicado' : 'Borrador'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {menu.cuisine_type?.replace('_', ' ') || 'General'}
                  </Badge>
                  {menu.view_count && menu.view_count > 0 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Eye className="w-3 h-3 mr-1" />
                      {menu.view_count}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardFooter className="flex flex-col gap-2 pt-0">
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMenu(menu.id)}
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  {menu.status === 'published' && menu.public_url_slug && (
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
                  <div className="flex gap-2 w-full">
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
                      QR
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

      <AlertDialog open={!!deleteMenuId} onOpenChange={() => setDeleteMenuId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este menú?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Todos los platillos y configuraciones 
              de este menú serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMenu}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RestaurantMenus;
