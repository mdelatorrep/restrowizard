import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Reports: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-headline font-bold">Generador de Reportes</h1>
    <Card><CardHeader><CardTitle>Reportes profesionales</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Crea reportes con tu branding para tus clientes.</p></CardContent></Card>
  </div>
);
export default Reports;
