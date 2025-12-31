import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Clients: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-headline font-bold">Mis Clientes</h1>
    <Card><CardHeader><CardTitle>Gestión de clientes próximamente</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Aquí podrás ver y gestionar todos tus clientes.</p></CardContent></Card>
  </div>
);
export default Clients;
