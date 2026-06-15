import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  staffId: string;
  staffName: string;
  hasPin: boolean;
  posRole?: string | null;
  onChanged?: () => void;
}

/**
 * Lets the restaurant owner set/reset a 4-6 digit PIN for a staff member
 * and pick their POS role. Used inside the talent module staff profile sheet.
 */
export function StaffPINManager({ staffId, staffName, hasPin, posRole, onChanged }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<string>(posRole || "cashier");
  const [submitting, setSubmitting] = useState(false);

  const save = async () => {
    if (!/^[0-9]{4,6}$/.test(pin)) {
      toast({
        title: "PIN inválido",
        description: "Debe tener entre 4 y 6 dígitos.",
        variant: "destructive",
      });
      return;
    }
    if (pin !== confirm) {
      toast({
        title: "Los PIN no coinciden",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error: pinErr } = await supabase.rpc("set_staff_pin", {
        _staff_id: staffId,
        _pin: pin,
      });
      if (pinErr) throw pinErr;
      // Update POS role (separate update so role changes don't require a PIN reset)
      const { error: roleErr } = await (supabase as any)
        .from("staff_members")
        .update({ pos_role: role })
        .eq("id", staffId);
      if (roleErr) throw roleErr;

      toast({ title: "PIN actualizado", description: `${staffName} ya puede entrar al POS.` });
      setOpen(false);
      setPin("");
      setConfirm("");
      onChanged?.();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e?.message || "No se pudo guardar el PIN.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">Acceso al POS</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              {hasPin ? (
                <Badge variant="secondary" className="text-[10px]">PIN activo</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Sin PIN</Badge>
              )}
              <span>Rol: {posRole || "cashier"}</span>
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <KeyRound className="h-4 w-4 mr-1" />
          {hasPin ? "Cambiar" : "Asignar"}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PIN del POS — {staffName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="pin">Nuevo PIN (4 a 6 dígitos)</Label>
              <Input
                id="pin"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar PIN</Label>
              <Input
                id="confirm"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
              />
            </div>
            <div>
              <Label>Rol en el POS</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cajero</SelectItem>
                  <SelectItem value="waiter">Mesero</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Los supervisores pueden autorizar acciones sensibles (cancelaciones, descuentos,
                cierres con diferencia).
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Para que el PIN inicie sesión en el POS, este empleado debe tener una cuenta de
              usuario vinculada en este restaurante.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
