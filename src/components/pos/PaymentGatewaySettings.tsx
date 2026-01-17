import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentGateways, PaymentGatewayCredential } from '@/hooks/usePaymentGateways';
import { 
  CreditCard, 
  Settings, 
  Shield, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface GatewayConfig {
  id: PaymentGatewayCredential['gateway'];
  name: string;
  description: string;
  logo: string;
  docsUrl: string;
  sandboxUrl: string;
  methods: string[];
}

const GATEWAYS: GatewayConfig[] = [
  {
    id: 'wompi',
    name: 'Wompi',
    description: 'Pasarela de pagos líder en Colombia. Acepta tarjetas, PSE, Nequi y más.',
    logo: '💳',
    docsUrl: 'https://docs.wompi.co',
    sandboxUrl: 'https://comercios.wompi.co',
    methods: ['Tarjetas', 'PSE', 'Nequi', 'Bancolombia']
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Solución de pagos con datáfonos y links de pago para comercios.',
    logo: '⚡',
    docsUrl: 'https://developers.bold.co',
    sandboxUrl: 'https://bold.co/empresas',
    methods: ['Tarjetas', 'QR', 'Link de pago']
  },
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'La solución de pagos más usada en Latinoamérica.',
    logo: '🛒',
    docsUrl: 'https://www.mercadopago.com.co/developers',
    sandboxUrl: 'https://www.mercadopago.com.co/developers/panel',
    methods: ['Tarjetas', 'PSE', 'Efecty', 'QR']
  },
  {
    id: 'epayco',
    name: 'ePayco',
    description: 'Pasarela colombiana con múltiples medios de pago incluyendo Daviplata.',
    logo: '💰',
    docsUrl: 'https://docs.epayco.co',
    sandboxUrl: 'https://dashboard.epayco.co',
    methods: ['Tarjetas', 'PSE', 'Daviplata', 'Efecty']
  }
];

const PaymentGatewaySettings: React.FC = () => {
  const { credentials, loading, saveCredentials, toggleGateway, deleteCredentials } = usePaymentGateways();
  const [selectedGateway, setSelectedGateway] = useState<GatewayConfig | null>(null);
  const [formData, setFormData] = useState({ publicKey: '', privateKey: '', isSandbox: true });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getCredentialForGateway = (gatewayId: string) => 
    credentials.find(c => c.gateway === gatewayId);

  const handleSave = async () => {
    if (!selectedGateway) return;
    
    if (!formData.publicKey || !formData.privateKey) {
      toast.error('Completa ambas claves');
      return;
    }

    setSaving(true);
    const result = await saveCredentials(
      selectedGateway.id,
      formData.publicKey,
      formData.privateKey,
      formData.isSandbox
    );
    setSaving(false);

    if (result) {
      setDialogOpen(false);
      setFormData({ publicKey: '', privateKey: '', isSandbox: true });
    }
  };

  const openConfigDialog = (gateway: GatewayConfig) => {
    const existing = getCredentialForGateway(gateway.id);
    setSelectedGateway(gateway);
    setFormData({
      publicKey: existing?.public_key || '',
      privateKey: '', // Never show existing private key
      isSandbox: existing?.is_sandbox ?? true
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Pasarelas de Pago
          </h2>
          <p className="text-muted-foreground">
            Configura tus credenciales para aceptar pagos electrónicos
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GATEWAYS.map(gateway => {
          const credential = getCredentialForGateway(gateway.id);
          const isConfigured = !!credential;
          const isActive = credential?.is_active;

          return (
            <Card key={gateway.id} className={`relative ${isActive ? 'border-green-500' : ''}`}>
              {isActive && (
                <Badge className="absolute top-2 right-2 bg-green-500">Activo</Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{gateway.logo}</span>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {gateway.name}
                      {isConfigured && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{gateway.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {gateway.methods.map(method => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>

                {isConfigured && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {credential.is_sandbox ? 'Modo Sandbox' : 'Producción'}
                      </span>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => toggleGateway(gateway.id, checked)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant={isConfigured ? "outline" : "default"}
                    className="flex-1"
                    onClick={() => openConfigDialog(gateway)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isConfigured ? 'Editar' : 'Configurar'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(gateway.docsUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  {isConfigured && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`¿Eliminar credenciales de ${gateway.name}?`)) {
                          deleteCredentials(gateway.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedGateway?.logo}</span>
              Configurar {selectedGateway?.name}
            </DialogTitle>
            <DialogDescription>
              Ingresa tus credenciales de API. Las encontrarás en el panel de desarrolladores.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="credentials" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">Credenciales</TabsTrigger>
              <TabsTrigger value="help">Ayuda</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Llave Pública (Public Key)</Label>
                <Input
                  placeholder="pub_..."
                  value={formData.publicKey}
                  onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Llave Privada (Private/Secret Key)</Label>
                <div className="relative">
                  <Input
                    type={showPrivateKey ? 'text' : 'password'}
                    placeholder="prv_... o sk_..."
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Modo Sandbox (Pruebas)</Label>
                  <p className="text-xs text-muted-foreground">
                    Activa para probar sin cobros reales
                  </p>
                </div>
                <Switch
                  checked={formData.isSandbox}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSandbox: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guardar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="help" className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <h4 className="font-medium">¿Dónde encuentro mis credenciales?</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Ingresa al panel de {selectedGateway?.name}</li>
                  <li>Ve a la sección de Desarrolladores o API</li>
                  <li>Copia tu llave pública y privada</li>
                  <li>Usa las credenciales de Sandbox para pruebas</li>
                </ol>
                
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => window.open(selectedGateway?.sandboxUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir al Panel de {selectedGateway?.name}
                </Button>
              </div>

              <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-600">Seguridad</h4>
                    <p className="text-sm text-muted-foreground">
                      Tus credenciales se almacenan de forma segura y encriptada. 
                      Nunca las compartimos con terceros.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentGatewaySettings;
