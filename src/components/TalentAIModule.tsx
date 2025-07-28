import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
    Users, Brain, Target, Calendar, Clock, TrendingUp, 
    UserCheck, GraduationCap, Award, AlertTriangle,
    Search, BookOpen, Zap, Activity, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';

// Mock data para el módulo de talento
const mockTalentData = {
    staffOptimization: {
        totalStaff: 24,
        predictedNeeds: [
            { day: 'Lunes', predicted: 8, current: 10, savings: 2 },
            { day: 'Martes', predicted: 9, current: 10, savings: 1 },
            { day: 'Miércoles', predicted: 11, current: 10, savings: -1 },
            { day: 'Jueves', predicted: 13, current: 12, savings: -1 },
            { day: 'Viernes', predicted: 16, current: 14, savings: -2 },
            { day: 'Sábado', predicted: 18, current: 16, savings: -2 },
            { day: 'Domingo', predicted: 14, current: 16, savings: 2 }
        ],
        costSavings: 320000
    },
    recruitment: {
        openPositions: [
            { position: 'Chef de Línea', urgency: 'high', candidates: 12, aiScore: 89, topCandidate: 'Ana García' },
            { position: 'Mesero/a', urgency: 'medium', candidates: 28, aiScore: 94, topCandidate: 'Carlos Ruiz' },
            { position: 'Barista', urgency: 'low', candidates: 8, aiScore: 76, topCandidate: 'Sofía López' }
        ],
        hiringSuccess: 78,
        averageTime: 12,
        retention: 85
    },
    training: {
        programs: [
            { 
                employee: 'Juan Pérez', 
                position: 'Cocinero', 
                currentLevel: 'Intermedio',
                targetLevel: 'Avanzado',
                progress: 65,
                skills: ['Gestión de Temperaturas', 'Presentación de Platos'],
                completionDate: '2025-03-15'
            },
            { 
                employee: 'María Silva', 
                position: 'Mesera',
                currentLevel: 'Básico',
                targetLevel: 'Intermedio',
                progress: 42,
                skills: ['Servicio al Cliente', 'Conocimiento de Menú'],
                completionDate: '2025-02-28'
            },
            { 
                employee: 'Carlos Torres', 
                position: 'Barista',
                currentLevel: 'Avanzado',
                targetLevel: 'Experto',
                progress: 88,
                skills: ['Arte Latte', 'Cata de Café'],
                completionDate: '2025-02-10'
            }
        ],
        overallCompletion: 65
    },
    performance: {
        topPerformers: [
            { name: 'Ana García', position: 'Chef', score: 95, improvement: '+8%' },
            { name: 'Luis Rodríguez', position: 'Mesero', score: 92, improvement: '+12%' },
            { name: 'Carmen Díaz', position: 'Barista', score: 89, improvement: '+5%' }
        ],
        needsAttention: [
            { name: 'Pedro Martín', position: 'Ayudante de Cocina', score: 65, issues: ['Puntualidad', 'Productividad'] },
            { name: 'Sofía Ruiz', position: 'Mesera', score: 68, issues: ['Conocimiento de menú'] }
        ],
        averageScore: 82
    }
};

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

const TalentAIModule = () => {
    const [realTimeData, setRealTimeData] = useState(mockTalentData);
    const [aiInsights, setAiInsights] = useState<string>('');
    const { loading, optimizeStaff, analyzeCandidates } = useAIAgent();
    const { toast } = useToast();

    useEffect(() => {
        // Simulate real-time updates
        const interval = setInterval(() => {
            setRealTimeData(prev => ({
                ...prev,
                training: {
                    ...prev.training,
                    overallCompletion: Math.min(100, prev.training.overallCompletion + Math.random() * 2)
                },
                performance: {
                    ...prev.performance,
                    averageScore: Math.max(70, Math.min(95, prev.performance.averageScore + (Math.random() - 0.5) * 2))
                }
            }));
        }, 45000); // Update every 45 seconds

        return () => clearInterval(interval);
    }, []);

    const runStaffAnalysis = async () => {
        const analysis = await optimizeStaff({
            currentStaff: realTimeData.staffOptimization,
            performance: realTimeData.performance,
            training: realTimeData.training
        });
        
        if (analysis) {
            setAiInsights(analysis);
            toast({
                title: "Análisis de talento completado",
                description: "Se han generado recomendaciones de optimización",
            });
        }
    };

    const staffOptimizationChart = {
        labels: realTimeData.staffOptimization.predictedNeeds.map(d => d.day),
        datasets: [
            {
                label: 'Personal Actual',
                data: realTimeData.staffOptimization.predictedNeeds.map(d => d.current),
                backgroundColor: 'hsl(var(--muted))',
            },
            {
                label: 'Predicción IA',
                data: realTimeData.staffOptimization.predictedNeeds.map(d => d.predicted),
                backgroundColor: 'hsl(var(--primary))',
            }
        ]
    };

    return (
        <div className="space-y-6">
            {/* Header del módulo */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-lato-bold text-foreground">Gestión y Optimización del Talento</h2>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={runStaffAnalysis} 
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Análisis IA
                    </Button>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Activity className="w-4 h-4 mr-1" />
                        Activo
                    </Badge>
                </div>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StaffMetric
                    icon={<Users />}
                    title="Personal Total"
                    value={realTimeData.staffOptimization.totalStaff.toString()}
                    trend="neutral"
                    description="Empleados activos"
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StaffMetric
                    icon={<Target />}
                    title="Optimización Semanal"
                    value={`$${new Intl.NumberFormat().format(realTimeData.staffOptimization.costSavings)}`}
                    trend="up"
                    description="Ahorro estimado en costos"
                    colorClass="bg-green-100 text-green-600"
                />
                <StaffMetric
                    icon={<GraduationCap />}
                    title="Progreso Capacitación"
                    value={`${realTimeData.training.overallCompletion.toFixed(1)}%`}
                    trend="up"
                    description="Completación promedio"
                    colorClass="bg-purple-100 text-purple-600"
                />
                <StaffMetric
                    icon={<Award />}
                    title="Rendimiento Promedio"
                    value={`${realTimeData.performance.averageScore.toFixed(1)}`}
                    trend="up"
                    description="Score general del equipo"
                    colorClass="bg-orange-100 text-orange-600"
                />
            </div>

            {/* Planificación de Horarios Predictiva */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="mr-2 text-primary" />
                            Planificación de Horarios Predictiva
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Bar 
                                data={staffOptimizationChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' as const }
                                    },
                                    scales: {
                                        y: {
                                            title: { display: true, text: 'Número de Empleados' }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Reclutamiento Inteligente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {realTimeData.recruitment.openPositions.map((position, i) => (
                                <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                    position.urgency === 'high' ? 'bg-red-50 border-red-500' :
                                    position.urgency === 'medium' ? 'bg-orange-50 border-orange-500' :
                                    'bg-green-50 border-green-500'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-lato-bold text-sm">{position.position}</h4>
                                        <Badge variant="outline" className={
                                            position.urgency === 'high' ? 'text-red-600' :
                                            position.urgency === 'medium' ? 'text-orange-600' :
                                            'text-green-600'
                                        }>
                                            {position.urgency === 'high' ? 'Urgente' : 
                                             position.urgency === 'medium' ? 'Medio' : 'Bajo'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-lato-light">
                                        {position.candidates} candidatos • Score IA: {position.aiScore}%
                                    </p>
                                    <p className="text-xs font-lato-bold text-primary mt-1">
                                        Top candidato: {position.topCandidate}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Capacitación Adaptativa */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BookOpen className="mr-2 text-primary" />
                        Capacitación Adaptativa
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {realTimeData.training.programs.map((program, i) => (
                            <div key={i} className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-lato-bold text-sm">{program.employee}</h4>
                                        <p className="text-xs text-muted-foreground">{program.position}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {program.currentLevel} → {program.targetLevel}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Progreso</span>
                                        <span>{program.progress}%</span>
                                    </div>
                                    <Progress value={program.progress} className="h-2" />
                                </div>
                                
                                <div className="mt-3">
                                    <p className="text-xs text-muted-foreground font-lato-light mb-1">Habilidades en desarrollo:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {program.skills.map((skill, j) => (
                                            <Badge key={j} variant="outline" className="text-xs px-2 py-1">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground font-lato-light mt-2">
                                    Completación: {program.completionDate}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Análisis de Rendimiento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Award className="mr-2 text-primary" />
                            Top Performers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {realTimeData.performance.topPerformers.map((performer, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                            <Award className="text-green-600" size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-lato-bold text-sm">{performer.name}</h4>
                                            <p className="text-xs text-muted-foreground">{performer.position}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-lato-bold text-green-600">{performer.score}/100</p>
                                        <p className="text-xs text-green-600">{performer.improvement}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <AlertTriangle className="mr-2 text-primary" />
                            Necesita Atención
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {realTimeData.performance.needsAttention.map((employee, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                            <AlertTriangle className="text-orange-600" size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-lato-bold text-sm">{employee.name}</h4>
                                            <p className="text-xs text-muted-foreground">{employee.position}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {employee.issues.map((issue, j) => (
                                                    <Badge key={j} variant="outline" className="text-xs px-1 py-0 text-orange-600">
                                                        {issue}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-lato-bold text-orange-600">{employee.score}/100</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen del Impacto de la IA */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Brain className="mr-2 text-primary" />
                        Impacto de la IA en Gestión de Talento
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">
                                ${new Intl.NumberFormat().format(realTimeData.staffOptimization.costSavings)}
                            </div>
                            <p className="text-sm text-muted-foreground">Ahorro mensual en costos laborales</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">
                                {realTimeData.recruitment.retention}%
                            </div>
                            <p className="text-sm text-muted-foreground">Tasa de retención mejorada</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">
                                {realTimeData.recruitment.averageTime} días
                            </div>
                            <p className="text-sm text-muted-foreground">Tiempo promedio de contratación</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Insights Panel */}
            {aiInsights && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Brain className="mr-2 text-primary" />
                            Insights del Agente IA - Talento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-primary/5 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{aiInsights}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TalentAIModule;