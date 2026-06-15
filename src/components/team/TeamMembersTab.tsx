import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, UserPlus, MoreVertical, Mail, Shield, Ban, UserCheck,
  Trash2, Link2, Copy, Check, RefreshCw, Edit
} from 'lucide-react';
import { useTeamMembers, ROLE_LABELS, STATUS_LABELS, TeamMember } from '@/hooks/useTeamMembers';
import { useCustomRoles } from '@/hooks/useCustomRoles';
import { TeamMemberInviteDialog } from './TeamMemberInviteDialog';
import { TeamPermissionsEditor } from './TeamPermissionsEditor';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'owner': return 'default';
    case 'admin': return 'secondary';
    case 'manager': return 'outline';
    default: return 'outline';
  }
};
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default';
    case 'invited': return 'secondary';
    case 'suspended': return 'destructive';
    default: return 'outline';
  }
};

export const TeamMembersTab: React.FC = () => {
  const { toast } = useToast();
  const {
    teamMembers, isLoading, invitationLink, clearInvitationLink,
    suspendTeamMember, reactivateTeamMember, removeTeamMember,
    regenerateInvitation, getInvitationLink,
    isSuspending, isReactivating, isRemoving, isRegenerating
  } = useTeamMembers();
  const { roles: customRoles } = useCustomRoles();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'reactivate' | 'remove'; member: TeamMember;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedLink(link);
    toast({ title: 'Link copiado', description: 'El link de invitación ha sido copiado' });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'suspend') await suspendTeamMember(confirmAction.member.id);
      else if (confirmAction.type === 'reactivate') await reactivateTeamMember(confirmAction.member.id);
      else if (confirmAction.type === 'remove') await removeTeamMember(confirmAction.member.id);
    } finally { setConfirmAction(null); }
  };

  const getInitials = (m: TeamMember) =>
    m.staff_member?.name ? m.staff_member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : m.invited_email ? m.invited_email[0].toUpperCase() : '??';
  const getMemberName = (m: TeamMember) => m.staff_member?.name || m.invited_email || 'Sin nombre';
  const getMemberEmail = (m: TeamMember) => m.staff_member?.email || m.invited_email || '';
  const getCustomRoleLabel = (id: string | null) =>
    id ? customRoles.find(r => r.id === id)?.label : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Users className="h-5 w-5" /> Miembros del equipo
              </CardTitle>
              <CardDescription>Gestiona los miembros y sus permisos de acceso</CardDescription>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Invitar Miembro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay miembros en el equipo</p>
              <p className="text-sm">Invita a tu primer miembro para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const link = member.status === 'invited' ? getInvitationLink(member.invitation_token) : null;
                const customLabel = getCustomRoleLabel(member.custom_role_id);
                return (
                  <div key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">{getInitials(member)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{getMemberName(member)}</span>
                          <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                            {customLabel || ROLE_LABELS[member.role]}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(member.status)} className="text-xs">
                            {STATUS_LABELS[member.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{getMemberEmail(member)}</span>
                          {member.staff_member?.position && (<><span>•</span><span>{member.staff_member.position}</span></>)}
                        </div>
                        {member.status === 'invited' && member.invitation_sent_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Invitado hace {formatDistanceToNow(new Date(member.invitation_sent_at), { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {link && (
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink(link)}>
                          {copiedLink === link ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                          Copiar link
                        </Button>
                      )}
                      {member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditMember(member)}>
                              <Edit className="h-4 w-4 mr-2" /> Editar permisos
                            </DropdownMenuItem>
                            {member.status === 'invited' && (
                              <DropdownMenuItem onClick={() => regenerateInvitation(member.id)} disabled={isRegenerating}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Regenerar invitación
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {member.status === 'active' && (
                              <DropdownMenuItem onClick={() => setConfirmAction({ type: 'suspend', member })} className="text-amber-600">
                                <Ban className="h-4 w-4 mr-2" /> Suspender acceso
                              </DropdownMenuItem>
                            )}
                            {member.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => setConfirmAction({ type: 'reactivate', member })} className="text-emerald-600">
                                <UserCheck className="h-4 w-4 mr-2" /> Reactivar acceso
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setConfirmAction({ type: 'remove', member })} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar del equipo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TeamMemberInviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />

      {invitationLink && (
        <Dialog open={!!invitationLink} onOpenChange={() => clearInvitationLink()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" /> Link de invitación generado
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Comparte este link con el nuevo miembro. Solo puede usarse una vez.
              </p>
              <div className="flex gap-2">
                <input type="text" value={invitationLink} readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted" />
                <Button onClick={() => handleCopyLink(invitationLink)}>
                  {copiedLink === invitationLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editMember && (
        <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Editar permisos - {getMemberName(editMember)}
              </DialogTitle>
            </DialogHeader>
            <TeamPermissionsEditor member={editMember} onClose={() => setEditMember(null)} />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'suspend' && '¿Suspender acceso?'}
              {confirmAction?.type === 'reactivate' && '¿Reactivar acceso?'}
              {confirmAction?.type === 'remove' && '¿Eliminar del equipo?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'suspend' && (
                <>El miembro <strong>{confirmAction && getMemberName(confirmAction.member)}</strong> no podrá acceder hasta reactivar su cuenta.</>
              )}
              {confirmAction?.type === 'reactivate' && (
                <>El miembro <strong>{confirmAction && getMemberName(confirmAction.member)}</strong> volverá a tener acceso con sus permisos anteriores.</>
              )}
              {confirmAction?.type === 'remove' && (
                <>El miembro <strong>{confirmAction && getMemberName(confirmAction.member)}</strong> será eliminado permanentemente.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}
              className={confirmAction?.type === 'remove' ? 'bg-destructive hover:bg-destructive/90' : ''}
              disabled={isSuspending || isReactivating || isRemoving}>
              {confirmAction?.type === 'suspend' && 'Suspender'}
              {confirmAction?.type === 'reactivate' && 'Reactivar'}
              {confirmAction?.type === 'remove' && 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamMembersTab;
