import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, CreditCard, Smartphone, ArrowRightLeft, QrCode, X, Plus } from "lucide-react";
import { usePOSPayment, type PaymentSplit } from "@/hooks/usePOSPayment";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onComplete: (payments: PaymentSplit[], tipAmount: number, tipBreakdown: { method_id: string; amount: number }[]) => Promise<void> | void;
}

function iconFor(type: string) {
  switch (type) {
    case "cash": return Banknote;
    case "card": return CreditCard;
    case "digital_wallet": return Smartphone;
    case "transfer": return ArrowRightLeft;
    case "qr": return QrCode;
    default: return CreditCard;
  }
}

export function PaymentDialogV2({ open, onOpenChange, total, onComplete }: Props) {
  const { paymentMethods } = usePOSPayment();
  const [tipPercent, setTipPercent] = useState<number | null>(0);
  const [customTip, setCustomTip] = useState("");
  const [splits, setSplits] = useState<(PaymentSplit & { temp_id: string })[]>([]);
  const [cashReceived, setCashReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tipAmount = tipPercent != null ? total * (tipPercent / 100) : parseFloat(customTip) || 0;
  const grandTotal = total + tipAmount;
  const paidSoFar = splits.reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = Math.max(0, grandTotal - paidSoFar);
  const overpaid = paidSoFar > grandTotal;
  const allCash = splits.length > 0 && splits.every((s) => {
    const m = paymentMethods.find((p) => p.id === s.method_id);
    return m?.method_type === "cash";
  });
  const change = allCash && cashReceived ? Math.max(0, parseFloat(cashReceived) - grandTotal) : 0;

  useEffect(() => {
    if (!open) {
      setSplits([]);
      setCashReceived("");
      setTipPercent(0);
      setCustomTip("");
    }
  }, [open]);

  const addMethod = (methodId: string) => {
    const m = paymentMethods.find((p) => p.id === methodId);
    if (!m) return;
    setSplits((prev) => [
      ...prev,
      { temp_id: crypto.randomUUID(), method_id: m.id, method_name: m.method_name, amount: remaining },
    ]);
  };

  const updateAmount = (tempId: string, amount: number) => {
    setSplits((prev) => prev.map((s) => (s.temp_id === tempId ? { ...s, amount } : s)));
  };

  const removeSplit = (tempId: string) => {
    setSplits((prev) => prev.filter((s) => s.temp_id !== tempId));
  };

  const tipBreakdown = useMemo(() => {
    if (splits.length === 0 || tipAmount === 0) return [];
    return splits.map((s) => ({
      method_id: s.method_id,
      amount: (s.amount / paidSoFar) * tipAmount,
    }));
  }, [splits, tipAmount, paidSoFar]);

  const submit = async () => {
    if (splits.length === 0) {
      toast.error("Agrega al menos un medio de pago");
      return;
    }
    if (Math.abs(paidSoFar - grandTotal) > 1) {
      toast.error("El total pagado no cuadra con el total a cobrar");
      return;
    }
    if (allCash && parseFloat(cashReceived || "0") < grandTotal) {
      toast.error("Efectivo recibido insuficiente");
      return;
    }
    setSubmitting(true);
    try {
      await onComplete(
        splits.map(({ temp_id, ...rest }) => rest),
        tipAmount,
        tipBreakdown,
      );
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-zinc-950 text-zinc-100 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Cobrar</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="text-center py-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="text-xs text-zinc-500">Total a cobrar</div>
            <div className="text-4xl font-bold text-[var(--pos-accent)]">
              ${Math.round(grandTotal).toLocaleString("es-CO")}
            </div>
            {tipAmount > 0 && (
              <div className="text-xs text-zinc-500 mt-1">
                Incluye propina ${Math.round(tipAmount).toLocaleString("es-CO")}
              </div>
            )}
          </div>

          <div>
            <Label className="text-zinc-300 text-xs">Propina (Ley 1935/2018 — voluntaria)</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {[0, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  onClick={() => { setTipPercent(p); setCustomTip(""); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    tipPercent === p && !customTip
                      ? "bg-[var(--pos-accent)] text-zinc-900 border-transparent"
                      : "bg-zinc-900 text-zinc-300 border-zinc-800"
                  }`}
                >
                  {p === 0 ? "Sin propina" : `${p}%`}
                </button>
              ))}
              <Input
                type="number"
                placeholder="Otro $"
                className="w-28 h-8 bg-zinc-900 border-zinc-800 text-zinc-100"
                value={customTip}
                onChange={(e) => { setCustomTip(e.target.value); setTipPercent(null); }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-zinc-300 text-xs">Medios de pago</Label>
              <div className="text-xs text-zinc-500">
                Restante: <span className={remaining > 0 ? "text-amber-300" : overpaid ? "text-red-300" : "text-emerald-300"}>
                  ${Math.round(remaining).toLocaleString("es-CO")}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((m) => {
                const Icon = iconFor(m.method_type);
                return (
                  <button
                    key={m.id}
                    onClick={() => addMethod(m.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[var(--pos-accent)] text-xs text-zinc-200"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate w-full text-center">{m.method_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {splits.length > 0 && (
            <div className="space-y-2">
              {splits.map((s) => (
                <div key={s.temp_id} className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 p-2">
                  <span className="text-sm flex-1 truncate">{s.method_name}</span>
                  <Input
                    type="number"
                    value={s.amount}
                    onChange={(e) => updateAmount(s.temp_id, parseFloat(e.target.value) || 0)}
                    className="w-32 h-8 bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                  <button onClick={() => removeSplit(s.temp_id)} className="text-zinc-500 hover:text-red-400 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {remaining > 0 && (
                <button
                  onClick={() => splits[0] && addMethod(splits[0].method_id)}
                  className="text-xs text-[var(--pos-accent)] flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Pagar resto con el mismo medio
                </button>
              )}
            </div>
          )}

          {allCash && (
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <Label className="text-zinc-300 text-xs">Efectivo recibido</Label>
              <Input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="mt-1 h-10 text-lg bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="0"
              />
              {change > 0 && (
                <div className="flex justify-between mt-2 text-emerald-300 font-semibold">
                  <span>Cambio</span>
                  <span>${Math.round(change).toLocaleString("es-CO")}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-300">
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || splits.length === 0 || Math.abs(paidSoFar - grandTotal) > 1}
            className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90 min-w-32"
          >
            {submitting ? "Cobrando..." : `Cobrar ${Math.round(grandTotal).toLocaleString("es-CO")}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
