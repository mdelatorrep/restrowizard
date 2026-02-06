import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import {
  useTeamMembers,
  TeamMember,
  TeamMemberRole,
  ModulePermission,
  ModulePermissions,
  ROLE_LABELS,
  MODULE_LABELS,
  DEFAULT_PERMISSIONS
} from '@/hooks/useTeamMembers';

interface TeamPermissionsEditorProps {
  member: TeamMember;
  onClose: () => void;
}

const PERMISSION_LEVELS: { value: ModulePermission; label: string; color: string }[] = [
  { value: 'none', label: 'Sin acceso', color: 'bg-muted text-muted-foreground' },
  { value: 'read', label: 'Solo lectura', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'write', label: 'Lectura/Escritura', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'admin', label: 'Control total', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
];

// Available roles for changing (excluding owner)
const AVAILABLE_ROLES: TeamMemberRole[] = ['admin', 'manager', 'cashier', 'kitchen', 'staff'];

// Modules grouped by category
const MODULE_GROUPS: { label: string; modules: (keyof ModulePermissions)[] }[] = [
  {
    label: 'Principal',
    modules: ['dashboard', 'settings', 'team']
  },
  {
    label: 'Mi Restaurante',
    modules: ['brand', 'recipes', 'menus', 'inventory']
  },
  {
    label: 'Ventas',
    modules: ['pos', 'orders', 'delivery', 'reservations']
  },
  {
    label: 'Personas',
    modules: ['talent', 'feedback', 'loyalty']
  },
  {
    label: 'Digital y Finanzas',
    modules: ['website', 'finances']
  }
];

export const TeamPermissionsEditor: React.FC<TeamPermissionsEditorProps> = ({
  member,
  onClose
}) => {
  const { updateTeamMember, isUpdating } = useTeamMembers();
  const [role, setRole] = useState<TeamMemberRole>(member.role);
  const [permissions, setPermissions] = useState<ModulePermissions>(member.permissions);
  const [hasChanges, setHasChanges] = useState(false);

  const handleRoleChange = (newRole: TeamMemberRole) => {
    setRole(newRole);
    // Apply default permissions for the new role
    setPermissions(DEFAULT_PERMISSIONS[newRole]);
    setHasChanges(true);
  };

  const handlePermissionChange = (module: keyof ModulePermissions, level: ModulePermission) => {
    setPermissions(prev => ({ ...prev, [module]: level }));
    setHasChanges(true);
  };

  const handleResetToDefaults = () => {
    setPermissions(DEFAULT_PERMISSIONS[role]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateTeamMember(member.id, {
      role,
      permissions
    });
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <div className="space-y-2">
        <Label>Rol del miembro</Label>
        <Select value={role} onValueChange={(v) => handleRoleChange(v as TeamMemberRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Al cambiar el rol se aplicarán los permisos por defecto de ese rol.
        </p>
      </div>

      <Separator />

      {/* Permissions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Permisos personalizados</Label>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar por defecto
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
          {MODULE_GROUPS.map((group) => (
            <div key={group.label} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{group.label}</h4>
              <div className="grid gap-2">
                {group.modules.map((module) => (
                  <div
                    key={module}
                    className="flex items-center justify-between p-2 border rounded-lg bg-card"
                  >
                    <span className="text-sm font-medium">{MODULE_LABELS[module]}</span>
                    <Select
                      value={permissions[module] || 'none'}
                      onValueChange={(v) => handlePermissionChange(module, v as ModulePermission)}
                    >
                      <SelectTrigger className="w-[160px] h-8">
                        <SelectValue>
                          {permissions[module] && (
                            <Badge
                              variant="outline"
                              className={`${PERMISSION_LEVELS.find(p => p.value === permissions[module])?.color}`}
                            >
                              {PERMISSION_LEVELS.find(p => p.value === permissions[module])?.label}
                            </Badge>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <Badge variant="outline" className={level.color}>
                              {level.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isUpdating}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TeamPermissionsEditor;
