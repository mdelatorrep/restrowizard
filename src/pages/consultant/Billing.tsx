import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Billing: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-headline font-bold">Facturación</h1>
    <Card><CardHeader><CardTitle>Gestión de facturación</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Administra los pagos de tus clientes.</p></CardContent></Card>
  </div>
);
export default Billing;
