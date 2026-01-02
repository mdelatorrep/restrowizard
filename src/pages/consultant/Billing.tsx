import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConsultantBilling } from '@/hooks/useConsultantBilling';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Download,
  Mail,
  Calendar,
  TrendingUp
} from 'lucide-react';

const Billing: React.FC = () => {
  const { 
    invoices, 
    pendingInvoices, 
    overdueInvoices, 
    paidInvoices,
    totalPending, 
    totalOverdue,
    thisMonthPaid,
    loading,
    createInvoice,
    markAsPaid,
    cancelInvoice
  } = useConsultantBilling();
  const { clients } = useConsultantClients();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleCreateInvoice = async () => {
    if (!selectedClient || !amount) return;
    
    const result = await createInvoice({
      client_id: selectedClient,
      amount: parseFloat(amount),
      description: description || undefined,
      due_date: dueDate || undefined
    });

    if (!result.error) {
      setIsCreateDialogOpen(false);
      setSelectedClient('');
      setAmount('');
      setDescription('');
      setDueDate('');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || invoice.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      paid: { variant: 'default', label: 'Pagada' },
      overdue: { variant: 'destructive', label: 'Vencida' },
      cancelled: { variant: 'outline', label: 'Cancelada' }
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Facturación
          </h1>
          <p className="text-muted-foreground">Gestiona las facturas de tus clientes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={clients.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Factura</DialogTitle>
              <DialogDescription>
                Genera una factura para uno de tus clientes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => c.status === 'active').map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.business?.name || 'Cliente'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Monto (MXN)</Label>
                <Input 
                  type="number"
                  placeholder="15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input 
                  placeholder="Consultoría mensual - Enero 2024"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateInvoice} disabled={!selectedClient || !amount}>
                Crear Factura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cobrado este Mes</p>
                <p className="text-3xl font-bold text-green-500">${thisMonthPaid.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className="text-3xl font-bold">${totalPending.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencido</p>
                <p className="text-3xl font-bold text-destructive">${totalOverdue.toLocaleString()}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Facturas</p>
                <p className="text-3xl font-bold">{invoices.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar facturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="overdue">Vencidas</TabsTrigger>
            <TabsTrigger value="paid">Pagadas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {invoices.length === 0 ? 'No hay facturas' : 'No se encontraron facturas'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {invoices.length === 0 
                ? 'Crea tu primera factura para un cliente'
                : 'Intenta con otro término de búsqueda'}
            </p>
            {invoices.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)} disabled={clients.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Factura
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                  <TableCell className="font-medium">{invoice.business_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.description || '-'}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${invoice.amount.toLocaleString()} {invoice.currency}
                  </TableCell>
                  <TableCell>
                    {invoice.due_date 
                      ? new Date(invoice.due_date).toLocaleDateString('es-MX')
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAsPaid(invoice.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pagada
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-1" />
                            Recordatorio
                          </Button>
                        </>
                      ) : null}
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default Billing;
