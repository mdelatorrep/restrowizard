import { useState } from 'react';
import { CartItem, DeliveryZone } from '@/hooks/usePublicCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, Plus, Minus, Trash2, X, MapPin, 
  Phone, User, CreditCard, Banknote, Clock, CheckCircle, Loader2
} from 'lucide-react';
import { z } from 'zod';

// Validation schema
const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "Nombre muy corto").max(100, "Nombre muy largo"),
  customer_phone: z.string().trim().min(7, "Teléfono inválido").max(20, "Teléfono muy largo"),
  customer_email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal('')),
  delivery_address: z.string().trim().min(10, "Dirección muy corta").max(500, "Dirección muy larga"),
  delivery_notes: z.string().trim().max(500).optional(),
  payment_method: z.enum(['cash', 'card', 'transfer']),
});

interface DeliveryCartProps {
  items: CartItem[];
  zones: DeliveryZone[];
  selectedZone: DeliveryZone | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  minOrderMet: boolean;
  minOrderAmount?: number;
  submitting: boolean;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onSelectZone: (zone: DeliveryZone | null) => void;
  onSubmit: (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address: string;
    delivery_notes?: string;
    payment_method: string;
  }) => Promise<{ success: boolean; order_number?: number; error?: string; estimated_time_minutes?: number }>;
  onClose: () => void;
}

export function DeliveryCart({
  items,
  zones,
  selectedZone,
  subtotal,
  deliveryFee,
  total,
  minOrderMet,
  minOrderAmount,
  submitting,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onSelectZone,
  onSubmit,
  onClose,
}: DeliveryCartProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_notes: '',
    payment_method: 'cash' as 'cash' | 'card' | 'transfer',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderResult, setOrderResult] = useState<{ order_number: number; estimated_time: number } | null>(null);

  const validateForm = () => {
    try {
      checkoutSchema.parse(form);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const result = await onSubmit({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email || undefined,
      delivery_address: form.delivery_address,
      delivery_notes: form.delivery_notes || undefined,
      payment_method: form.payment_method,
    });

    if (result.success && result.order_number) {
      setOrderResult({
        order_number: result.order_number,
        estimated_time: result.estimated_time_minutes || 45,
      });
      setStep('success');
    } else {
      setErrors({ submit: result.error || 'Error al procesar pedido' });
    }
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p className="text-muted-foreground mb-6">Agrega productos del menú para hacer tu pedido</p>
            <Button onClick={onClose}>Ver Menú</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success' && orderResult) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Pedido Confirmado!</h2>
            <p className="text-muted-foreground mb-6">Tu pedido está siendo preparado</p>
            
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Número de pedido</p>
              <p className="text-3xl font-mono font-bold text-primary">#{orderResult.order_number}</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
              <Clock className="h-5 w-5" />
              <span>Tiempo estimado: {orderResult.estimated_time} min</span>
            </div>
            
            <Button onClick={onClose} className="w-full">Cerrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <Card className="w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-t-xl sm:rounded-xl">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {step === 'cart' ? 'Tu Pedido' : 'Datos de Entrega'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4">
          {step === 'cart' ? (
            <div className="space-y-4">
              {/* Cart Items */}
              {items.map(item => (
                <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium truncate">{item.name}</h4>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-primary font-medium">
                      ${(item.price * item.quantity).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Notas especiales..."
                      value={item.notes || ''}
                      onChange={e => onUpdateNotes(item.id, e.target.value)}
                      className="mt-2 h-8 text-sm"
                    />
                  </div>
                </div>
              ))}

              {/* Zone Selection */}
              {zones.length > 0 && (
                <div className="space-y-2">
                  <Label>Zona de entrega</Label>
                  <Select
                    value={selectedZone?.id || ''}
                    onValueChange={id => {
                      const zone = zones.find(z => z.id === id);
                      onSelectZone(zone || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.zone_name} - ${zone.delivery_fee.toLocaleString()}
                          {zone.min_order > 0 && ` (min: $${zone.min_order.toLocaleString()})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedZone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Tiempo estimado: {selectedZone.estimated_time_minutes} min
                    </p>
                  )}
                </div>
              )}

              {/* Minimum order warning */}
              {!minOrderMet && minOrderAmount && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  Pedido mínimo: ${minOrderAmount.toLocaleString()}. Te faltan ${(minOrderAmount - subtotal).toLocaleString()}
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domicilio</span>
                    <span>${deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Nombre *
                </Label>
                <Input
                  value={form.customer_name}
                  onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Tu nombre completo"
                />
                {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Teléfono *
                </Label>
                <Input
                  type="tel"
                  value={form.customer_phone}
                  onChange={e => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                />
                {errors.customer_phone && <p className="text-xs text-destructive">{errors.customer_phone}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
                  placeholder="tu@email.com"
                />
                {errors.customer_email && <p className="text-xs text-destructive">{errors.customer_email}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Dirección de entrega *
                </Label>
                <Textarea
                  value={form.delivery_address}
                  onChange={e => setForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                  placeholder="Calle, número, barrio, referencias..."
                  rows={2}
                />
                {errors.delivery_address && <p className="text-xs text-destructive">{errors.delivery_address}</p>}
              </div>

              <div className="space-y-2">
                <Label>Notas de entrega (opcional)</Label>
                <Input
                  value={form.delivery_notes}
                  onChange={e => setForm(prev => ({ ...prev, delivery_notes: e.target.value }))}
                  placeholder="Apartamento, piso, referencias..."
                />
              </div>

              <div className="space-y-3">
                <Label>Método de pago *</Label>
                <RadioGroup
                  value={form.payment_method}
                  onValueChange={v => setForm(prev => ({ ...prev, payment_method: v as 'cash' | 'card' | 'transfer' }))}
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-3">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Banknote className="h-4 w-4" /> Efectivo contra entrega
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-3">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4" /> Tarjeta contra entrega
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-3">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4" /> Transferencia
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {errors.submit && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                  {errors.submit}
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total a pagar</span>
                <span className="text-primary">${total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t p-4">
          {step === 'cart' ? (
            <Button 
              className="w-full" 
              size="lg"
              disabled={!minOrderMet || items.length === 0}
              onClick={() => setStep('checkout')}
            >
              Continuar (${total.toLocaleString()})
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('cart')}
                disabled={submitting}
              >
                Atrás
              </Button>
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar Pedido'
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Mini cart button for floating display
export function CartButton({ 
  itemCount, 
  total, 
  onClick 
}: { 
  itemCount: number; 
  total: number; 
  onClick: () => void;
}) {
  if (itemCount === 0) return null;

  return (
    <Button 
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-lg z-40"
      size="lg"
    >
      <ShoppingCart className="h-5 w-5 mr-2" />
      <span className="font-bold">{itemCount}</span>
      <span className="mx-2">•</span>
      <span>${total.toLocaleString()}</span>
    </Button>
  );
}
