import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Alerts: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-headline font-bold">Centro de Alertas</h1>
    <Card><CardHeader><CardTitle>Alertas consolidadas</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Aquí verás todas las alertas de tus clientes.</p></CardContent></Card>
  </div>
);
export default Alerts;
