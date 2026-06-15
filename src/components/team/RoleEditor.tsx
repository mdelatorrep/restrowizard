import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import {
  TeamMemberRole, ModulePermission, ModulePermissions,
  ROLE_LABELS, MODULE_LABELS, MODULE_GROUPS, DEFAULT_PERMISSIONS
} from '@/hooks/useTeamMembers';
import { useCustomRoles, CustomRole } from '@/hooks/useCustomRoles';
import { RESTAURANT_ROUTE_PERMISSIONS } from '@/config/routePermissions';

interface RoleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: CustomRole | null; // null = create new
}

const PERMISSION_LEVELS: { value: ModulePermission; label: string; color: string }[] = [
  { value: 'none',  label: 'Sin acceso',        color: 'bg-muted text-muted-foreground' },
  { value: 'read',  label: 'Solo lectura',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'write', label: 'Lectura/Escritura', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'admin', label: 'Control total',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
];

const BASE_ROLES: TeamMemberRole[] = ['admin', 'manager', 'cashier', 'kitchen', 'staff'];

const LANDING_OPTIONS = [
  { value: '/r/dashboard', label: 'Dashboard' },
  { value: '/r/pos', label: 'Punto de Venta' },
  { value: '/r/kitchen', label: 'Pantalla de Cocina' },
  { value: '/r/orders', label: 'Pedidos y Cocina' },
  { value: '/r/inventory', label: 'Inventario' },
  { value: '/r/talent', label: 'Talento y Turnos' },
  { value: '/r/my-development', label: 'Mi Desarrollo' },
  { value: '/r/reservations', label: 'Reservaciones' },
  { value: '/r/finances', label: 'Finanzas' }
];

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export const RoleEditor: React.FC<RoleEditorProps> = ({ open, onOpenChange, role }) => {
  const { createRole, updateRole, isMutating } = useCustomRoles();
  const isEditing = !!role;
  const isSystem = role?.is_system === true;

  const [label, setLabel] = useState(role?.label || '');
  const [description, setDescription] = useState(role?.description || '');
  const [baseRole, setBaseRole] = useState<TeamMemberRole>(role?.base_role || 'staff');
  const [defaultLanding, setDefaultLanding] = useState(role?.default_landing || '/r/dashboard');
  const [permissions, setPermissions] = useState<ModulePermissions>(
    role?.permissions || DEFAULT_PERMISSIONS.staff
  );

  React.useEffect(() => {
    if (open) {
      setLabel(role?.label || '');
      setDescription(role?.description || '');
      setBaseRole(role?.base_role || 'staff');
      setDefaultLanding(role?.default_landing || '/r/dashboard');
      setPermissions(role?.permissions || DEFAULT_PERMISSIONS.staff);
    }
  }, [open, role]);

  const handleBaseRoleChange = (next: TeamMemberRole) => {
    setBaseRole(next);
    if (!isEditing) setPermissions(DEFAULT_PERMISSIONS[next]);
  };

  const handlePermChange = (m: keyof ModulePermissions, level: ModulePermission) => {
    setPermissions(prev => ({ ...prev, [m]: level }));
  };

  const handleResetDefaults = () => setPermissions(DEFAULT_PERMISSIONS[baseRole]);

  // Filter landing options to only modules the role can access
  const allowedLandings = useMemo(() => {
    return LANDING_OPTIONS.filter(opt => {
      const path = opt.value.replace(/^\/r\//, '').replace(/^\/pos$/, 'pos');
      const route = RESTAURANT_ROUTE_PERMISSIONS.find(r => r.path === path);
      if (!route) return true;
      const lvl = permissions[route.module] || 'none';
      return lvl !== 'none';
    });
  }, [permissions]);

  const handleSave = async () => {
    if (!label.trim()) return;
    if (isEditing && role) {
      await updateRole(role.id, {
        label, description, permissions,
        default_landing: defaultLanding
      });
    } else {
      const key = slugify(label) || `role_${Date.now()}`;
      await createRole({
        key, label, description, base_role: baseRole,
        permissions, default_landing: defaultLanding
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (isSystem ? `Rol del sistema: ${role?.label}` : `Editar rol: ${role?.label}`) : 'Crear nuevo rol'}
          </DialogTitle>
        </DialogHeader>

        {isSystem && (
          <div className="text-xs bg-muted rounded-lg p-3 text-muted-foreground">
            Este es un rol del sistema. Puedes ajustar sus permisos pero no eliminarlo ni renombrarlo.
          </div>
        )}

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del rol</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isSystem}
                placeholder="Ej: Mesero, Host, Barista..."
              />
            </div>
            <div className="space-y-2">
              <Label>Plantilla base</Label>
              <Select
                value={baseRole}
                onValueChange={(v) => handleBaseRoleChange(v as TeamMemberRole)}
                disabled={isEditing}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BASE_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué responsabilidades tiene este rol?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Pantalla de inicio al ingresar</Label>
            <Select value={defaultLanding} onValueChange={setDefaultLanding}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allowedLandings.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Cuando este miembro inicie sesión, lo enviaremos directo a esta sección.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-base">Permisos por módulo</Label>
            <Button variant="outline" size="sm" onClick={handleResetDefaults}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Restaurar plantilla
            </Button>
          </div>

          <div className="space-y-4">
            {MODULE_GROUPS.map(group => (
              <div key={group.label} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{group.label}</h4>
                <div className="grid gap-2">
                  {group.modules.map(m => (
                    <div key={m} className="flex items-center justify-between p-2 border rounded-lg bg-card">
                      <span className="text-sm font-medium">{MODULE_LABELS[m]}</span>
                      <Select
                        value={permissions[m] || 'none'}
                        onValueChange={(v) => handlePermChange(m, v as ModulePermission)}
                      >
                        <SelectTrigger className="w-[170px] h-8">
                          <SelectValue>
                            <Badge variant="outline"
                              className={PERMISSION_LEVELS.find(p => p.value === (permissions[m] || 'none'))?.color}>
                              {PERMISSION_LEVELS.find(p => p.value === (permissions[m] || 'none'))?.label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PERMISSION_LEVELS.map(lvl => (
                            <SelectItem key={lvl.value} value={lvl.value}>
                              <Badge variant="outline" className={lvl.color}>{lvl.label}</Badge>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMutating}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isMutating || !label.trim()}>
            {isMutating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleEditor;
