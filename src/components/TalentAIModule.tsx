import React, { useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
    Users, Brain, Target, Calendar, Clock, TrendingUp, 
    UserCheck, GraduationCap, Award, AlertTriangle,
    Search, BookOpen, Zap, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
                progress: 82,
                skills: ['Manejo de Quejas', 'Técnicas de Venta'],
                completionDate: '2025-02-28'
            },
            { 
                employee: 'Diego Torres', 
                position: 'Barista', 
                currentLevel: 'Avanzado',
                targetLevel: 'Experto',
                progress: 34,
                skills: ['Latte Art Avanzado', 'Métodos de Extracción'],
                completionDate: '2025-04-20'
            }
        ]
    },
    performance: {
        topPerformers: [
            { name: 'Ana García', position: 'Chef', score: 96, improvement: 12 },
            { name: 'Carlos Mendoza', position: 'Mesero', score: 94, improvement: 8 },
            { name: 'Lucía Vargas', position: 'Supervisora', score: 92, improvement: 15 }
        ],
        needsAttention: [
            { name: 'Pedro Gómez', position: 'Ayudante de Cocina', score: 68, issues: ['Velocidad', 'Precisión'] },
            { name: 'Sandra López', position: 'Mesera', score: 72, issues: ['Puntualidad', 'Actitud'] }
        ]
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
                        {trend === 'up' ? <TrendingUp size={20} /> : <Activity size={20} />}
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

const TalentAIModule: React.FC = () => {
    const [selectedWeek, setSelectedWeek] = useState('actual');

    const staffOptimizationChart = {
        labels: mockTalentData.staffOptimization.predictedNeeds.map(d => d.day),
        datasets: [
            {
                label: 'Personal Actual',
                data: mockTalentData.staffOptimization.predictedNeeds.map(d => d.current),
                backgroundColor: 'hsl(var(--muted))'
            },
            {
                label: 'Predicción IA Óptima',
                data: mockTalentData.staffOptimization.predictedNeeds.map(d => d.predicted),
                backgroundColor: 'hsl(var(--primary))'
            }
        ]
    };

    const trainingProgressChart = {
        labels: mockTalentData.training.programs.map(p => p.employee),
        datasets: [{
            label: 'Progreso de Capacitación (%)',
            data: mockTalentData.training.programs.map(p => p.progress),
            backgroundColor: [
                'hsl(var(--primary))',
                'hsl(var(--secondary))',
                'hsl(var(--accent))'
            ]
        }]
    };

    return (
        <div className="space-y-6">
            {/* Header del módulo */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-lato-bold text-foreground flex items-center">
                        <Brain className="mr-3 text-primary" size={32} />
                        Gestión y Optimización del Talento Humano IA
                    </h1>
                    <p className="text-muted-foreground font-lato-light mt-2">
                        Combatiendo la escasez de personal con eficiencia y retención inteligente
                    </p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                    IA Activa
                </Badge>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StaffMetric
                    icon={<Users />}
                    title="Ahorro en Costos Laborales"
                    value={`$${new Intl.NumberFormat().format(mockTalentData.staffOptimization.costSavings)}`}
                    trend="up"
                    description="Por optimización semanal"
                    colorClass="bg-green-100 text-green-600"
                />
                <StaffMetric
                    icon={<Search />}
                    title="Eficiencia de Reclutamiento"
                    value={`${mockTalentData.recruitment.hiringSuccess}%`}
                    trend="up"
                    description="Acierto en contrataciones IA"
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StaffMetric
                    icon={<GraduationCap />}
                    title="Capacitación Activa"
                    value={mockTalentData.training.programs.length.toString()}
                    trend="up"
                    description="Empleados en desarrollo"
                    colorClass="bg-purple-100 text-purple-600"
                />
                <StaffMetric
                    icon={<UserCheck />}
                    title="Retención de Personal"
                    value={`${mockTalentData.recruitment.retention}%`}
                    trend="up"
                    description="Últimos 12 meses"
                    colorClass="bg-orange-100 text-orange-600"
                />
            </div>

            {/* Planificación de Horarios Predictiva */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="mr-2 text-primary" />
                            Planificación de Horarios Predictiva IA
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
                            {mockTalentData.recruitment.openPositions.map((position, i) => (
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
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            {position.candidates} candidatos • IA Score: {position.aiScore}%
                                        </p>
                                        <p className="text-xs font-lato-bold text-primary">
                                            Top candidato: {position.topCandidate}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Capacitación Adaptativa */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BookOpen className="mr-2 text-primary" />
                            Capacitación Adaptativa IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockTalentData.training.programs.map((program, i) => (
                                <div key={i} className="p-4 bg-muted rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-lato-bold">{program.employee}</h4>
                                            <p className="text-sm text-muted-foreground">{program.position}</p>
                                        </div>
                                        <Badge variant="secondary">
                                            {program.currentLevel} → {program.targetLevel}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-lato-medium">Progreso</span>
                                            <span className="text-sm font-lato-bold">{program.progress}%</span>
                                        </div>
                                        <Progress value={program.progress} className="h-2" />
                                        
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground font-lato-medium mb-1">
                                                Habilidades en desarrollo:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {program.skills.map((skill, j) => (
                                                    <Badge key={j} variant="outline" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <p className="text-xs text-muted-foreground">
                                            Finalización estimada: {program.completionDate}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Target className="mr-2 text-primary" />
                            Análisis de Rendimiento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Top Performers */}
                            <div>
                                <h4 className="font-lato-bold text-green-600 mb-3 flex items-center">
                                    <Award className="mr-2" size={16} />
                                    Mejores Desempeños
                                </h4>
                                <div className="space-y-2">
                                    {mockTalentData.performance.topPerformers.map((performer, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                            <div>
                                                <p className="font-lato-bold text-sm">{performer.name}</p>
                                                <p className="text-xs text-muted-foreground">{performer.position}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-lato-bold text-green-600">{performer.score}%</p>
                                                <p className="text-xs text-green-600">+{performer.improvement}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Needs Attention */}
                            <div>
                                <h4 className="font-lato-bold text-orange-600 mb-3 flex items-center">
                                    <AlertTriangle className="mr-2" size={16} />
                                    Requieren Atención
                                </h4>
                                <div className="space-y-2">
                                    {mockTalentData.performance.needsAttention.map((employee, i) => (
                                        <div key={i} className="p-2 bg-orange-50 rounded">
                                            <div className="flex items-center justify-between mb-1">
                                                <div>
                                                    <p className="font-lato-bold text-sm">{employee.name}</p>
                                                    <p className="text-xs text-muted-foreground">{employee.position}</p>
                                                </div>
                                                <p className="font-lato-bold text-orange-600">{employee.score}%</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {employee.issues.map((issue, j) => (
                                                    <Badge key={j} variant="outline" className="text-xs text-orange-600">
                                                        {issue}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen de Métricas de Talento */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Zap className="mr-2 text-primary" />
                        Impacto de la IA en Gestión de Talento
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">98%</div>
                            <p className="text-sm font-lato-medium text-muted-foreground">Reducción en costos laborales</p>
                            <p className="text-xs font-lato-light text-muted-foreground mt-1">vs. horarios manuales</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">{mockTalentData.recruitment.averageTime}</div>
                            <p className="text-sm font-lato-medium text-muted-foreground">días promedio de contratación</p>
                            <p className="text-xs font-lato-light text-muted-foreground mt-1">45% más rápido que antes</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">67%</div>
                            <p className="text-sm font-lato-medium text-muted-foreground">Mejora en retención</p>
                            <p className="text-xs font-lato-light text-muted-foreground mt-1">desde implementación IA</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TalentAIModule;