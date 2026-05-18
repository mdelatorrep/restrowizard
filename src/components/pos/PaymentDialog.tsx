import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Banknote, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import { usePOSPayment, type PaymentSplit } from '@/hooks/usePOSPayment';
import { buildCashPaymentSchema } from '@/lib/schemas/payment';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onComplete: (payments: PaymentSplit[], tip: number) => void;
}

const getMethodIcon = (type: string) => {
  switch (type) {
    case 'cash':
      return <Banknote className="h-5 w-5" />;
    case 'card':
      return <CreditCard className="h-5 w-5" />;
    case 'digital_wallet':
      return <Smartphone className="h-5 w-5" />;
    default:
      return <DollarSign className="h-5 w-5" />;
  }
};

export const PaymentDialog = ({ open, onOpenChange, total, onComplete }: Props) => {
  const { paymentMethods } = usePOSPayment();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');

  const tipAmount = tipPercent ? total * (tipPercent / 100) : parseFloat(customTip) || 0;
  const finalTotal = total + tipAmount;
  const change = Math.max(0, (parseFloat(cashReceived) || 0) - finalTotal);

  const handlePayment = () => {
    const method = paymentMethods.find((m) => m.id === selectedMethod);
    const isCash = method?.method_type === 'cash';
    const parsed = buildCashPaymentSchema(finalTotal).safeParse({
      selectedMethodId: selectedMethod ?? '',
      tipAmount,
      cashReceived: isCash ? parseFloat(cashReceived) || 0 : finalTotal,
    });
    if (!parsed.success || !method) {
      toast.error(parsed.success ? 'Método inválido' : parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    onComplete(
      [{ method_id: method.id, method_name: method.method_name, amount: finalTotal }],
      tipAmount,
    );
    onOpenChange(false);
    setSelectedMethod(null);
    setCashReceived('');
    setTipPercent(null);
    setCustomTip('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Procesar Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total a cobrar</p>
            <p className="text-4xl font-bold text-primary">${finalTotal.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <Label>Propina (opcional)</Label>
            <div className="flex gap-2">
              {[10, 15, 20].map((pct) => (
                <Button
                  key={pct}
                  variant={tipPercent === pct ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTipPercent(tipPercent === pct ? null : pct);
                    setCustomTip('');
                  }}
                >
                  {pct}%
                </Button>
              ))}
              <Input
                type="number"
                placeholder="Otro"
                className="w-24"
                value={customTip}
                onChange={(e) => {
                  setCustomTip(e.target.value);
                  setTipPercent(null);
                }}
              />
            </div>
            {tipAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                Propina: ${tipAmount.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedMethod === method.id ? 'default' : 'outline'}
                  className="h-16 flex flex-col gap-1"
                  onClick={() => setSelectedMethod(method.id)}
                >
                  {getMethodIcon(method.method_type)}
                  <span className="text-xs">{method.method_name}</span>
                </Button>
              ))}
            </div>
          </div>

          {selectedMethod &&
            paymentMethods.find((m) => m.id === selectedMethod)?.method_type === 'cash' && (
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <Label>Efectivo Recibido</Label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="text-xl"
                  />
                </div>
                {parseFloat(cashReceived) >= finalTotal && (
                  <div className="flex justify-between text-lg font-bold text-green-600">
                    <span>Cambio:</span>
                    <span>${change.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePayment} disabled={!selectedMethod} className="min-w-32">
            Cobrar ${finalTotal.toLocaleString()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
