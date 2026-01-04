import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
    Users, Brain, Target, Calendar, TrendingUp, 
    UserCheck, GraduationCap, Award, AlertTriangle,
    Activity, RefreshCw, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useTalentData } from '@/hooks/useTalentData';
import { ModuleEmptyState, BenchmarkComparison } from '@/components/ui/empty-state';

interface StaffMetricProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    description: string;
    colorClass: string;
}

const StaffMetric: React.FC<StaffMetricProps> = ({ icon, title, value, trend, description, colorClass }) => (
    <Card className="relative overflow-hidden">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className={`rounded-full p-3 ${colorClass}`}>
                    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                </div>
                {trend && (
                    <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {trend === 'up' ? <TrendingUp size={20} /> : trend === 'down' ? <AlertTriangle size={20} /> : <Activity size={20} />}
                    </div>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-2xl font-lato-bold text-foreground">{value}</h3>
                <p className="text-sm font-lato-medium text-muted-foreground">{title}</p>
                <p className="text-xs font-lato-light text-muted-foreground mt-1">{description}</p>
            </div>
        </CardContent>
    </Card>
);

interface StaffFormData {
    name: string;
    position: string;
    hourly_rate: string;
    performance_score: string;
    training_progress: string;
}

const TalentAIModule = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [aiInsights, setAiInsights] = useState<string>('');
    const [formData, setFormData] = useState<StaffFormData>({
        name: '',
        position: '',
        hourly_rate: '',
        performance_score: '70',
        training_progress: '0'
    });
    
    const { staff, kpis, benchmarks, loading: dataLoading, hasData, addStaffMember, isViewingClient } = useTalentData();
    const { loading: aiLoading, optimizeStaff } = useAIAgent();
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!formData.name || !formData.position) {
            toast({
                title: "Campos requeridos",
                description: "Nombre y posición son obligatorios",
                variant: "destructive"
            });
            return;
        }

        await addStaffMember({
            name: formData.name,
            position: formData.position,
            hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
            hire_date: new Date().toISOString().split('T')[0],
            performance_score: parseFloat(formData.performance_score),
            training_progress: parseInt(formData.training_progress),
            is_active: true
        });

        setFormData({
            name: '',
            position: '',
            hourly_rate: '',
            performance_score: '70',
            training_progress: '0'
        });
        setShowAddForm(false);
    };

    const runStaffAnalysis = async () => {
        if (!kpis) return;
        
        const analysis = await optimizeStaff({
            totalStaff: kpis.totalStaff,
            avgPerformance: kpis.avgPerformance,
            avgTrainingProgress: kpis.avgTrainingProgress,
            positionBreakdown: kpis.positionBreakdown
        });
        
        if (analysis) {
            setAiInsights(analysis);
            toast({
                title: "Análisis de talento completado",
                description: "Se han generado recomendaciones de optimización",
            });
        }
    };

    // Show empty state if no data
    if (!hasData && !dataLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-lato-bold text-foreground">Gestión y Optimización del Talento</h2>
                </div>
                
                <ModuleEmptyState
                    moduleName="Talento IA"
                    description="Registra tu equipo para obtener análisis de rendimiento, planificación predictiva de horarios y recomendaciones de capacitación."
                    features={[
                        "Planificación predictiva de horarios",
                        "Análisis de rendimiento con IA",
                        "Capacitación adaptativa personalizada",
                        "Identificación de top performers"
                    ]}
                    onGetStarted={() => setShowAddForm(true)}
                />

                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Agregar Empleado</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Nombre *</Label>
                                <Input
                                    placeholder="Nombre completo"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Posición *</Label>
                                <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar posición" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="chef">Chef</SelectItem>
                                        <SelectItem value="cocinero">Cocinero/a</SelectItem>
                                        <SelectItem value="ayudante_cocina">Ayudante de Cocina</SelectItem>
                                        <SelectItem value="mesero">Mesero/a</SelectItem>
                                        <SelectItem value="barista">Barista</SelectItem>
                                        <SelectItem value="cajero">Cajero/a</SelectItem>
                                        <SelectItem value="gerente">Gerente</SelectItem>
                                        <SelectItem value="otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Tarifa por Hora</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.hourly_rate}
                                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Rendimiento (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.performance_score}
                                        onChange={(e) => setFormData({ ...formData, performance_score: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleSubmit} className="w-full">
                                Agregar Empleado
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Position breakdown chart
    const positionChart = {
        labels: Object.keys(kpis?.positionBreakdown || {}),
        datasets: [{
            label: 'Empleados por Posición',
            data: Object.values(kpis?.positionBreakdown || {}),
            backgroundColor: 'hsl(var(--primary))'
        }]
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-lato-bold text-foreground">Gestión y Optimización del Talento</h2>
                    {isViewingClient && (
                        <Badge variant="outline" className="mt-1">Datos del cliente</Badge>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Empleado
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Agregar Empleado</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Nombre *</Label>
                                    <Input
                                        placeholder="Nombre completo"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Posición *</Label>
                                    <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar posición" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="chef">Chef</SelectItem>
                                            <SelectItem value="cocinero">Cocinero/a</SelectItem>
                                            <SelectItem value="ayudante_cocina">Ayudante de Cocina</SelectItem>
                                            <SelectItem value="mesero">Mesero/a</SelectItem>
                                            <SelectItem value="barista">Barista</SelectItem>
                                            <SelectItem value="cajero">Cajero/a</SelectItem>
                                            <SelectItem value="gerente">Gerente</SelectItem>
                                            <SelectItem value="otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tarifa por Hora</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={formData.hourly_rate}
                                            onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Rendimiento (%)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.performance_score}
                                            onChange={(e) => setFormData({ ...formData, performance_score: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSubmit} className="w-full">
                                    Agregar Empleado
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button 
                        onClick={runStaffAnalysis} 
                        disabled={aiLoading || !kpis}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
                        Análisis IA
                    </Button>
                </div>
            </div>

            {/* AI Insights */}
            {aiInsights && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center text-primary">
                            <Brain className="mr-2" size={20} />
                            Insights IA - Talento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                            {aiInsights}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StaffMetric
                    icon={<Users />}
                    title="Personal Activo"
                    value={kpis?.activeStaff.toString() || '0'}
                    trend="neutral"
                    description={`${kpis?.totalStaff || 0} total registrados`}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StaffMetric
                    icon={<Award />}
                    title="Rendimiento Promedio"
                    value={`${kpis?.avgPerformance.toFixed(0) || 0}%`}
                    trend={kpis && kpis.avgPerformance > 70 ? 'up' : 'down'}
                    description="Score general del equipo"
                    colorClass="bg-green-100 text-green-600"
                />
                <StaffMetric
                    icon={<GraduationCap />}
                    title="Progreso Capacitación"
                    value={`${kpis?.avgTrainingProgress.toFixed(0) || 0}%`}
                    trend="up"
                    description="Completación promedio"
                    colorClass="bg-purple-100 text-purple-600"
                />
                <StaffMetric
                    icon={<Target />}
                    title="Tarifa Promedio"
                    value={`$${kpis?.avgHourlyRate.toFixed(0) || 0}/hr`}
                    trend="neutral"
                    description="Costo por hora"
                    colorClass="bg-orange-100 text-orange-600"
                />
            </div>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Position Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="mr-2 text-primary" />
                            Distribución por Posición
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <Bar 
                                data={positionChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Award className="mr-2 text-primary" />
                            Top Performers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {kpis?.topPerformers.slice(0, 3).map((performer, i) => (
                                <div key={performer.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                                            <Award className="text-green-600" size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm">{performer.name}</h4>
                                            <p className="text-xs text-muted-foreground capitalize">{performer.position.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">{performer.performance_score}/100</p>
                                    </div>
                                </div>
                            ))}
                            {(!kpis?.topPerformers || kpis.topPerformers.length === 0) && (
                                <p className="text-center text-muted-foreground py-4">
                                    No hay suficientes datos para mostrar top performers
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Needs Attention */}
            {kpis?.needsAttention && kpis.needsAttention.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <AlertTriangle className="mr-2 text-orange-500" />
                            Requieren Atención
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kpis.needsAttention.map((member) => (
                                <div key={member.id} className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-sm">{member.name}</h4>
                                        <Badge variant="outline" className="text-orange-600">
                                            {member.performance_score}%
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground capitalize mb-2">
                                        {member.position.replace('_', ' ')}
                                    </p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Capacitación</span>
                                            <span>{member.training_progress}%</span>
                                        </div>
                                        <Progress value={member.training_progress || 0} className="h-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Benchmarks */}
            {benchmarks && (
                <Card>
                    <CardHeader>
                        <CardTitle>Comparación con Industria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <BenchmarkComparison
                                label="Tasa de Rotación"
                                userValue={100 - (kpis?.activeStaff || 0) / (kpis?.totalStaff || 1) * 100}
                                benchmarkValue={benchmarks.turnoverRate}
                                higherIsBetter={false}
                            />
                            <BenchmarkComparison
                                label="Completación de Capacitación"
                                userValue={kpis?.avgTrainingProgress || 0}
                                benchmarkValue={benchmarks.trainingCompletion}
                                higherIsBetter={true}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TalentAIModule;
