import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, ExternalLink, Info } from 'lucide-react';

const providers = [
  { name: 'Facturatech', desc: 'Proveedor autorizado DIAN con API REST y panel de gestión.' },
  { name: 'Alegra', desc: 'Software contable colombiano con módulo de facturación electrónica integrado.' },
  { name: 'Siigo', desc: 'ERP cloud colombiano; soporta UBL 2.1 y notas crédito/débito.' },
  { name: 'TusFacturas', desc: 'Gateway de facturación electrónica con API abierta y webhooks.' },
  { name: 'Carvajal Tecnología', desc: 'Solución enterprise; alta disponibilidad y soporte dedicado.' },
];

export default function ElectronicInvoicing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" />
          Facturación Electrónica DIAN
        </h1>
        <p className="text-muted-foreground">
          Emite facturas electrónicas validadas ante la DIAN directamente desde el POS.
        </p>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Próximamente</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mt-2">
              Estamos evaluando proveedores autorizados por la DIAN para integrar la emisión de
              facturas electrónicas de venta, notas crédito y notas débito directamente desde
              RestroWizard.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Fase: Investigación de proveedores
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              ¿Qué incluirá?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Emisión de factura electrónica al cobrar en POS (automática o manual).</p>
            <p>• Numeración autorizada por la DIAN con rangos pre-configurados.</p>
            <p>• Envío automático al cliente por correo y WhatsApp (PDF + XML UBL 2.1).</p>
            <p>• Notas crédito y débito vinculadas a facturas ya emitidas.</p>
            <p>• Reporte 1003 / 1005 para declaración de IVA e Impoconsumo.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ExternalLink className="h-5 w-5 text-primary" />
              Proveedores en evaluación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((p) => (
              <div key={p.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <div className="w-2 h-2 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-medium">¿Tienes un proveedor de facturación electrónica preferido?</p>
            <p className="text-sm text-muted-foreground">
              Escríbenos a soporte@restrowizard.co y lo incluiremos en la evaluación.
            </p>
          </div>
          <Button variant="outline" disabled>
            Solicitar prioridad
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
