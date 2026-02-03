import React, { useState } from 'react';
import { 
  Plus, Eye, Edit3, Share2, QrCode, CheckCircle, Loader2, 
  MoreVertical, Trash2, Copy, Users, FileEdit, Sparkles,
  ArrowRight, Utensils, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import Confetti from '@/components/ui/confetti';

const RestaurantMenus = () => {
  const { menus, loading, publishMenu, loadMenus } = useMenus();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<string | null>(null);
  const [sharingMenu, setSharingMenu] = useState<string | null>(null);
  const [qrMenu, setQrMenu] = useState<string | null>(null);
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handlePublish = async (menuId: string) => {
    await publishMenu(menuId);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
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

      toast({ title: 'Menú duplicado exitosamente' });
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
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Utensils className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  const totalViews = menus.reduce((sum, m) => sum + (m.view_count || 0), 0);
  const publishedMenus = menus.filter(m => m.status === 'published').length;

  return (
    <div className="space-y-8">
      {showConfetti && <Confetti />}
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Gestión Profesional
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Menús Digitales
            </h1>
            <p className="text-primary-foreground/80 max-w-md">
              Crea experiencias gastronómicas memorables con menús interactivos y códigos QR personalizados
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20 group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Crear Menú
            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Stats Cards */}
      {menus.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileEdit className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {menus.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Menús creados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{publishedMenus}</p>
                  <p className="text-sm text-muted-foreground">Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">{totalViews.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Visualizaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {totalViews > 0 && menus.length > 0 ? Math.round(totalViews / menus.length) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Promedio/menú</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {menus.length === 0 ? (
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-card via-card to-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-pulse">
                <Utensils className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ¡Comienza tu aventura gastronómica!
            </h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Crea menús digitales profesionales con códigos QR, alérgenos, 
              precios dinámicos y mucho más
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg group"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              Crear Mi Primer Menú
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Menu Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {menus.map((menu, index) => (
            <Card 
              key={menu.id} 
              className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient top bar */}
              <div className={`h-1.5 ${menu.status === 'published' 
                ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500' 
                : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500'}`} 
              />
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        className={`${menu.status === 'published' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0' 
                          : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 border-0'
                        } shadow-sm`}
                      >
                        {menu.status === 'published' ? '✓ Publicado' : '◯ Borrador'}
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
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

                {/* Cuisine Type Badge */}
                <div className="mb-6">
                  <Badge variant="outline" className="capitalize text-xs bg-muted/50">
                    <Utensils className="w-3 h-3 mr-1" />
                    {menu.cuisine_type?.replace('_', ' ') || 'General'}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingMenu(menu.id)}
                      className="flex-1 group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    >
                      <Edit3 className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                      Editar
                    </Button>
                    {menu.status === 'published' && menu.public_url_slug && (
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
                  
                  {menu.status === 'draft' ? (
                    <Button
                      onClick={() => handlePublish(menu.id)}
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
                        onClick={() => setSharingMenu(menu.id)}
                        className="flex-1 group/share hover:bg-gradient-to-r hover:from-violet-500 hover:to-purple-600 hover:text-white hover:border-transparent"
                      >
                        <Share2 className="w-4 h-4 mr-2 group-hover/share:-rotate-12 transition-transform" />
                        Compartir
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setQrMenu(menu.id)}
                        className="flex-1 group/qr hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white hover:border-transparent"
                      >
                        <QrCode className="w-4 h-4 mr-2 group-hover/qr:rotate-12 transition-transform" />
                        QR Code
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
