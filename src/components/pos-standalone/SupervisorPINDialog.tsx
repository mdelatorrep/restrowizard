import { useEffect, useRef, useState } from "react";
import { ShieldAlert, Delete } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupervisorAuth {
  authorization_id: string;
  supervisor_staff_id: string;
  supervisor_name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  restaurantUserId: string;
  reasonCode: string;
  reasonText?: string;
  amount?: number;
  entity?: string;
  entityId?: string;
  requesterStaffId?: string;
  requesterName?: string;
  terminalId?: string;
  onAuthorized: (auth: SupervisorAuth) => void;
}

export function SupervisorPINDialog({
  open,
  onOpenChange,
  restaurantUserId,
  reasonCode,
  reasonText,
  amount,
  entity,
  entityId,
  requesterStaffId,
  requesterName,
  terminalId,
  onAuthorized,
}: Props) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setPin("");
      submittedRef.current = false;
    }
  }, [open]);

  const submit = async (value: string) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("pos_verify_supervisor_pin", {
        p_user_id: restaurantUserId,
        p_pin: value,
        p_reason_code: reasonCode,
        p_reason_text: reasonText ?? null,
        p_amount: amount ?? null,
        p_entity: entity ?? null,
        p_entity_id: entityId ?? null,
        p_terminal_id: terminalId ?? null,
        p_requester_staff_id: requesterStaffId ?? null,
        p_requester_name: requesterName ?? null,
      });
      if (error) throw error;
      if (!data?.ok) {
        toast.error(data?.error ?? "PIN inválido");
        setPin("");
        submittedRef.current = false;
        return;
      }
      onAuthorized({
        authorization_id: data.authorization_id,
        supervisor_staff_id: data.supervisor_staff_id,
        supervisor_name: data.supervisor_name,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Error verificando PIN");
      submittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const press = (d: string) => {
    if (pin.length >= 6 || loading) return;
    const next = pin + d;
    setPin(next);
    if (next.length >= 4) {
      // Auto-submit at 6, or wait for user to add more digits up to 6
      if (next.length === 6) submit(next);
    }
  };

  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            Autorización de supervisor
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {reasonText ?? "Esta acción requiere PIN de un supervisor."}
            {typeof amount === "number" && amount > 0 && (
              <div className="mt-1 text-amber-300">Monto: ${Math.round(amount).toLocaleString("es-CO")}</div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-[var(--pos-accent,#D4A5DB)]" : "bg-zinc-700"}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <Button
              key={d}
              onClick={() => press(d)}
              variant="outline"
              className="h-14 text-xl bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
              disabled={loading}
            >
              {d}
            </Button>
          ))}
          <Button
            onClick={() => pin.length >= 4 && submit(pin)}
            variant="outline"
            className="h-14 text-xs bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            disabled={loading || pin.length < 4}
          >
            OK
          </Button>
          <Button
            onClick={() => press("0")}
            variant="outline"
            className="h-14 text-xl bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            disabled={loading}
          >
            0
          </Button>
          <Button
            onClick={back}
            variant="outline"
            className="h-14 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            disabled={loading}
          >
            <Delete className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
