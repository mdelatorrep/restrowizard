import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useConsultantReports } from '@/hooks/useConsultantReports';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import {
  FileText,
  Plus,
  Download,
  Share2,
  Trash2,
  BarChart3,
  Users,
  TrendingUp,
  Sparkles,
  Loader2,
  Eye,
  Calendar
} from 'lucide-react';

const Reports: React.FC = () => {
  const { reports, loading, generating, generateReport, shareWithClient, deleteReport } = useConsultantReports();
  const { clients } = useConsultantClients();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const reportTypes = [
    { value: 'financial', label: 'Reporte Financiero', icon: BarChart3, description: 'P&L, costos, márgenes' },
    { value: 'operations', label: 'Reporte Operativo', icon: TrendingUp, description: 'Eficiencia, tiempos, flujos' },
    { value: 'maturity', label: 'Reporte de Madurez', icon: Users, description: 'Diagnóstico completo' }
  ];

  const handleCreateReport = async () => {
    if (!selectedClient || !reportType || !reportTitle) return;
    
    const result = await generateReport(selectedClient, reportType, reportTitle);
    if (!result.error) {
      setIsCreateDialogOpen(false);
      setSelectedClient('');
      setReportType('');
      setReportTitle('');
    }
  };

  const filteredReports = reports.filter(report => {
    if (activeTab === 'all') return true;
    return report.report_type === activeTab;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
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
            <FileText className="h-8 w-8 text-primary" />
            Generador de Reportes
          </h1>
          <p className="text-muted-foreground">Crea reportes profesionales con análisis IA</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={clients.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generar Reporte con IA
              </DialogTitle>
              <DialogDescription>
                Selecciona un cliente y tipo de reporte. La IA analizará los datos y generará recomendaciones.
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
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.business?.name || 'Cliente'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Reporte</Label>
                <div className="grid grid-cols-1 gap-2">
                  {reportTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        onClick={() => setReportType(type.value)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          reportType === type.value 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${reportType === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título del Reporte</Label>
                <Input 
                  placeholder="Ej: Análisis Q1 2024" 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateReport} 
                disabled={!selectedClient || !reportType || !reportTitle || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map(type => {
          const Icon = type.icon;
          const count = reports.filter(r => r.report_type === type.value).length;
          return (
            <Card 
              key={type.value} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setActiveTab(type.value)}
            >
              <CardContent className="pt-6 text-center">
                <Icon className="h-12 w-12 mx-auto text-primary mb-2" />
                <h4 className="font-semibold">{type.label}</h4>
                <p className="text-sm text-muted-foreground">{type.description}</p>
                <Badge variant="secondary" className="mt-2">{count} reportes</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs and Reports List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="financial">Financieros</TabsTrigger>
          <TabsTrigger value="operations">Operativos</TabsTrigger>
          <TabsTrigger value="maturity">Madurez</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredReports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay reportes</h3>
                <p className="text-muted-foreground mb-4">
                  Genera tu primer reporte con análisis IA
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} disabled={clients.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Reporte
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map(report => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{report.report_title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{report.business_name || 'Cliente'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.created_at).toLocaleDateString('es-MX')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {report.report_type === 'financial' ? 'Financiero' :
                           report.report_type === 'operations' ? 'Operativo' : 'Madurez'}
                        </Badge>
                        {report.is_shared_with_client && (
                          <Badge variant="secondary">Compartido</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => shareWithClient(report.id, !report.is_shared_with_client)}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          {report.is_shared_with_client ? 'Ocultar' : 'Compartir'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
