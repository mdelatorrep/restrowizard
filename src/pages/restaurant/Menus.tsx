import React, { useState } from 'react';
import { Loader2, Utensils } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMenus } from '@/hooks/useMenus';
import { useMenuActions } from '@/hooks/useMenuActions';
import { CreateMenuDialog } from '@/components/menus/CreateMenuDialog';
import { MenuEditor } from '@/components/menus/MenuEditor';
import { QRCodeDialog } from '@/components/menus/QRCodeDialog';
import { ShareMenuDialog } from '@/components/menus/ShareMenuDialog';
import { MenusHero } from '@/components/menus/MenusHero';
import { MenusStatsGrid } from '@/components/menus/MenusStatsGrid';
import { MenusEmptyState } from '@/components/menus/MenusEmptyState';
import { MenuCard } from '@/components/menus/MenuCard';
import Confetti from '@/components/ui/confetti';

const RestaurantMenus = () => {
  const { menus, loading, publishMenu, loadMenus } = useMenus();
  const { deleteMenu, duplicateMenu } = useMenuActions(menus, loadMenus);

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

  const handleConfirmDelete = async () => {
    if (!deleteMenuId) return;
    await deleteMenu(deleteMenuId);
    setDeleteMenuId(null);
  };

  if (editingMenu) {
    return <MenuEditor menuId={editingMenu} onBack={() => setEditingMenu(null)} />;
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

      <MenusHero onCreate={() => setShowCreateDialog(true)} />

      {menus.length > 0 && (
        <MenusStatsGrid total={menus.length} published={publishedMenus} totalViews={totalViews} />
      )}

      {menus.length === 0 ? (
        <MenusEmptyState onCreate={() => setShowCreateDialog(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(menus || []).map((menu, index) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              index={index}
              onEdit={setEditingMenu}
              onDuplicate={duplicateMenu}
              onShare={setSharingMenu}
              onQr={setQrMenu}
              onDelete={setDeleteMenuId}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateMenuDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
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
              onClick={handleConfirmDelete}
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
