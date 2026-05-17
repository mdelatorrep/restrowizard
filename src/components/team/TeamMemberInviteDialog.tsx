import React from 'react';
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
import { z } from 'zod';
import { useZodForm } from '@/lib/forms';
import { Controller } from 'react-hook-form';
import {
  useTeamMembers,
  ROLE_LABELS,
  DEFAULT_PERMISSIONS,
  TeamMemberRole,
} from '@/hooks/useTeamMembers';

interface TeamMemberInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLES: TeamMemberRole[] = ['admin', 'manager', 'cashier', 'kitchen', 'staff'];

const InviteSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  role: z.enum(['admin', 'manager', 'cashier', 'kitchen', 'staff'] as const),
});

type InviteValues = z.infer<typeof InviteSchema>;

export const TeamMemberInviteDialog: React.FC<TeamMemberInviteDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { inviteTeamMember, isInviting } = useTeamMembers();

  const form = useZodForm<InviteValues>(InviteSchema, {
    defaultValues: { email: '', role: 'staff' },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = form;

  const role = watch('role');

  const onSubmit = async (values: InviteValues) => {
    try {
      await inviteTeamMember({
        email: values.email,
        role: values.role,
        permissions: DEFAULT_PERMISSIONS[values.role],
      });
      reset({ email: '', role: 'staff' });
      onOpenChange(false);
    } catch {
      /* handled in hook */
    }
  };

  const handleClose = () => {
    reset({ email: '', role: 'staff' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-email-error' : undefined}
              disabled={isInviting}
              {...register('email')}
            />
            {errors.email && (
              <p id="invite-email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Rol</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as TeamMemberRole)}
                  disabled={isInviting}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
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
              )}
            />
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Permisos del rol {ROLE_LABELS[role]}:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {Object.entries(DEFAULT_PERMISSIONS[role]).map(
                ([module, level]) =>
                  level !== 'none' && (
                    <div key={module} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/60" />
                      <span className="capitalize">{module}</span>
                      <span className="text-muted-foreground/60">({level})</span>
                    </div>
                  )
              )}
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
