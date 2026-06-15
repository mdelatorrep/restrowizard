import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Shield, Lock } from 'lucide-react';
import { useCustomRoles, CustomRole } from '@/hooks/useCustomRoles';
import { RoleEditor } from './RoleEditor';

export const RolesTab: React.FC = () => {
  const { roles, isLoading, deleteRole } = useCustomRoles();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomRole | null>(null);

  const handleCreate = () => { setEditing(null); setEditorOpen(true); };
  const handleEdit = (r: CustomRole) => { setEditing(r); setEditorOpen(true); };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  const systemRoles = roles.filter(r => r.is_system);
  const customRoles = roles.filter(r => !r.is_system);

  const Row = ({ r }: { r: CustomRole }) => {
    const permCount = Object.values(r.permissions || {}).filter(v => v && v !== 'none').length;
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: r.color || '#3E1064' }}
          >
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.label}</span>
              {r.is_system && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Sistema
                </Badge>
              )}
            </div>
            {r.description && (
              <p className="text-xs text-muted-foreground">{r.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {permCount} módulos accesibles
              {r.default_landing && ` • Inicio: ${r.default_landing}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(r)}>
            <Pencil className="h-3 w-3 mr-1" />
            {r.is_system ? 'Ver/Ajustar' : 'Editar'}
          </Button>
          {!r.is_system && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => setConfirmDelete(r)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Shield className="h-5 w-5" />
                Roles
              </CardTitle>
              <CardDescription>
                Define roles personalizados con permisos a la medida. Los roles del sistema están disponibles para todos los negocios.
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Crear rol
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Roles del sistema</h4>
            <div className="space-y-2">
              {systemRoles.map(r => <Row key={r.id} r={r} />)}
            </div>
          </div>

          {customRoles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Roles personalizados</h4>
              <div className="space-y-2">
                {customRoles.map(r => <Row key={r.id} r={r} />)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleEditor open={editorOpen} onOpenChange={setEditorOpen} role={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              El rol <strong>{confirmDelete?.label}</strong> será eliminado. Los miembros con este rol
              volverán a usar los permisos por defecto de su rol base. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDelete) await deleteRole(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RolesTab;
