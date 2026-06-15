import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import {
  useTeamMembers, TeamMember, TeamMemberRole, ModulePermission, ModulePermissions,
  ROLE_LABELS, MODULE_LABELS, MODULE_GROUPS, DEFAULT_PERMISSIONS
} from '@/hooks/useTeamMembers';
import { useCustomRoles } from '@/hooks/useCustomRoles';

interface TeamPermissionsEditorProps {
  member: TeamMember;
  onClose: () => void;
}

const PERMISSION_LEVELS: { value: ModulePermission; label: string; color: string }[] = [
  { value: 'none',  label: 'Sin acceso',        color: 'bg-muted text-muted-foreground' },
  { value: 'read',  label: 'Solo lectura',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'write', label: 'Lectura/Escritura', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'admin', label: 'Control total',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
];

const AVAILABLE_BASE_ROLES: TeamMemberRole[] = ['admin', 'manager', 'cashier', 'kitchen', 'staff'];

export const TeamPermissionsEditor: React.FC<TeamPermissionsEditorProps> = ({ member, onClose }) => {
  const { updateTeamMember, isUpdating } = useTeamMembers();
  const { roles: customRoles } = useCustomRoles();
  const [role, setRole] = useState<TeamMemberRole>(member.role);
  const [customRoleId, setCustomRoleId] = useState<string | null>(member.custom_role_id);
  const [permissions, setPermissions] = useState<ModulePermissions>(member.permissions);
  const [hasChanges, setHasChanges] = useState(false);

  const handleCustomRoleChange = (value: string) => {
    const id = value === 'none' ? null : value;
    setCustomRoleId(id);
    if (id) {
      const cr = customRoles.find(r => r.id === id);
      if (cr) {
        setRole(cr.base_role);
        setPermissions(cr.permissions);
      }
    }
    setHasChanges(true);
  };

  const handleRoleChange = (newRole: TeamMemberRole) => {
    setRole(newRole);
    setCustomRoleId(null);
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
    await updateTeamMember(member.id, { role, custom_role_id: customRoleId, permissions });
    onClose();
  };

  const businessRoles = customRoles.filter(r => !r.is_system);

  return (
    <div className="space-y-6">
      {businessRoles.length > 0 && (
        <div className="space-y-2">
          <Label>Rol personalizado</Label>
          <Select value={customRoleId || 'none'} onValueChange={handleCustomRoleChange}>
            <SelectTrigger><SelectValue placeholder="Sin rol personalizado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Usar rol base (sin personalizado)</SelectItem>
              {businessRoles.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Crea o gestiona roles personalizados en la pestaña "Roles".
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Rol base</Label>
        <Select value={role} onValueChange={(v) => handleRoleChange(v as TeamMemberRole)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {AVAILABLE_BASE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Al cambiar el rol base se aplican sus permisos por defecto.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Permisos por módulo</Label>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar plantilla
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
          {MODULE_GROUPS.map((group) => (
            <div key={group.label} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{group.label}</h4>
              <div className="grid gap-2">
                {group.modules.map((module) => (
                  <div key={module} className="flex items-center justify-between p-2 border rounded-lg bg-card">
                    <span className="text-sm font-medium">{MODULE_LABELS[module]}</span>
                    <Select
                      value={permissions[module] || 'none'}
                      onValueChange={(v) => handlePermissionChange(module, v as ModulePermission)}
                    >
                      <SelectTrigger className="w-[170px] h-8">
                        <SelectValue>
                          <Badge variant="outline"
                            className={PERMISSION_LEVELS.find(p => p.value === (permissions[module] || 'none'))?.color}>
                            {PERMISSION_LEVELS.find(p => p.value === (permissions[module] || 'none'))?.label}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <Badge variant="outline" className={level.color}>{level.label}</Badge>
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

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isUpdating}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Guardar Cambios</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TeamPermissionsEditor;
