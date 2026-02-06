import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import {
  useTeamMembers,
  ROLE_LABELS,
  DEFAULT_PERMISSIONS,
  TeamMemberRole
} from '@/hooks/useTeamMembers';

interface TeamMemberInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TeamMemberInviteDialog: React.FC<TeamMemberInviteDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { inviteTeamMember, isInviting } = useTeamMembers();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMemberRole>('staff');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('El email es requerido');
      return;
    }

    if (!email.includes('@')) {
      setError('Ingresa un email válido');
      return;
    }

    try {
      await inviteTeamMember({
        email,
        role,
        permissions: DEFAULT_PERMISSIONS[role]
      });
      
      // Reset form and close
      setEmail('');
      setRole('staff');
      onOpenChange(false);
    } catch (err) {
      // Error already handled in hook
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('staff');
    setError('');
    onOpenChange(false);
  };

  // Roles available for invitation (excluding owner)
  const availableRoles: TeamMemberRole[] = ['admin', 'manager', 'cashier', 'kitchen', 'staff'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invitar Miembro del Equipo
          </DialogTitle>
          <DialogDescription>
            Envía una invitación por email para unirse a tu equipo. El invitado recibirá
            un link para registrarse o iniciar sesión.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              disabled={isInviting}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as TeamMemberRole)}
              disabled={isInviting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex flex-col items-start">
                      <span>{ROLE_LABELS[r]}</span>
                      <span className="text-xs text-muted-foreground">
                        {r === 'admin' && 'Acceso completo excepto eliminar negocio'}
                        {r === 'manager' && 'Gestión de ventas, inventario y turnos'}
                        {r === 'cashier' && 'POS, pedidos y reservaciones'}
                        {r === 'kitchen' && 'Pedidos, recetas e inventario (lectura)'}
                        {r === 'staff' && 'Ver turnos y dashboard básico'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Permisos del rol {ROLE_LABELS[role]}:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {Object.entries(DEFAULT_PERMISSIONS[role]).map(([module, level]) => (
                level !== 'none' && (
                  <div key={module} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/60" />
                    <span className="capitalize">{module}</span>
                    <span className="text-muted-foreground/60">({level})</span>
                  </div>
                )
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isInviting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Invitando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberInviteDialog;
