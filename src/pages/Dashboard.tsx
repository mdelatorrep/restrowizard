import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut, Scatter } from 'react-chartjs-2';
import { useDashboard } from '@/hooks/useDashboard';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { 
    LayoutDashboard, BarChart2, MessageSquare, UtensilsCrossed, Sparkles, 
    BookOpen, Warehouse, CalendarDays, Users, DollarSign, ShoppingCart, 
    Star, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
    Instagram, Facebook, Twitter, ThumbsUp, ThumbsDown, Meh, LogOut, Briefcase
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import JobsManagement from '@/components/JobsManagement';
import FinancesAIModule from '@/components/FinancesAIModule';
import TalentAIModule from '@/components/TalentAIModule';
import OperationsAIModule from '@/components/OperationsAIModule';
import MenuInventoryAIModule from '@/components/MenuInventoryAIModule';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// --- MOCK DATA ---
const mockData = {
    kpis: {
        ventasHoy: 7850000, costoAlimentos: 32.5, margenUtilidad: 25.2,
        satisfaccionCliente: 4.6, rotacionPersonal: 8,
    },
    ventasSemana: [6500000, 7200000, 5800000, 8100000, 9200000, 11500000, 7850000],
    alertasCopiloto: [
        { id: 1, tipo: 'alerta', icono: <TrendingDown className="text-destructive" />, texto: "El costo de la carne de res ha subido un 12% esta semana.", sugerencia: "Considera negociar con 'Proveedor Carnes del Sur' o ajustar temporalmente el margen del 'Lomo Saltado'." },
        { id: 2, tipo: 'oportunidad', icono: <TrendingUp className="text-green-500" />, texto: "El 'Ajiaco Santafereño' tiene un food cost bajo (22%) y altas ventas.", sugerencia: "Promociónalo como el plato de la semana para maximizar ganancias." },
        { id: 3, tipo: 'info', icono: <AlertTriangle className="text-yellow-500" />, texto: "Pico de rotación de personal en el área de meseros.", sugerencia: "Revisa el plan de formación de 'RestroLearn' para mejorar la retención." },
    ],
    menuEngineering: [
        { x: 85, y: 75, label: 'Lomo Saltado', type: 'Estrella' },
        { x: 30, y: 90, label: 'Bandeja Paisa', type: 'Vaca Lechera' },
        { x: 90, y: 25, label: 'Salmón Maracuyá', type: 'Incógnita' },
        { x: 20, y: 15, label: 'Sopa del Día', type: 'Perro' },
    ],
    socialMedia: {
        instagram: { followers: 12500, engagement: 4.2, change: 150 },
        facebook: { followers: 8200, engagement: 2.1, change: 45 },
        tiktok: { followers: 25000, engagement: 15.8, change: 1200 },
        recentPosts: [
            { platform: 'instagram', content: '¡Nuevo postre de chocolate!', likes: 580, comments: 45 },
            { platform: 'tiktok', content: 'El chef preparando el Lomo Saltado', likes: 12000, comments: 250 },
        ]
    },
    sentimentAnalysis: {
        positivo: 75, negativo: 15, neutro: 10,
        positiveKeywords: ['delicioso', 'ambiente', 'servicio', 'rápido'],
        negativeKeywords: ['demora', 'frío', 'ruido', 'precio'],
    },
    inventory: [
        { name: 'Carne de Res (kg)', stock: 25, reorderPoint: 20, status: 'ok' },
        { name: 'Pechuga de Pollo (kg)', stock: 15, reorderPoint: 20, status: 'bajo' },
        { name: 'Arroz (kg)', stock: 50, reorderPoint: 30, status: 'ok' },
        { name: 'Tomates (kg)', stock: 5, reorderPoint: 10, status: 'critico' },
    ],
    shifts: {
        Lunes: { Cocinero: 'Ana', Mesero: 'Carlos', Barista: 'Sofía' },
        Martes: { Cocinero: 'Juan', Mesero: 'Lucía', Barista: 'Sofía' },
        Miércoles: { Cocinero: 'Ana', Mesero: 'Pedro', Barista: 'Luis' },
        Jueves: { Cocinero: 'Juan', Mesero: 'Carlos', Barista: 'Sofía' },
        Viernes: { Cocinero: 'Ana', Mesero: 'Lucía', Barista: 'Luis' },
        Sábado: { Cocinero: 'Juan', Mesero: 'Pedro', Barista: 'Sofía' },
        Domingo: { Cocinero: 'Ana', Mesero: 'Carlos', Barista: 'Luis' },
    },
    training: [
        { course: 'Servicio al Cliente Nivel 2', employee: 'Carlos', progress: 80 },
        { course: 'Gestión de Alérgenos', employee: 'Ana', progress: 100 },
        { course: 'Introducción a la Coctelería', employee: 'Sofía', progress: 45 },
    ]
};

// --- Componentes de la UI ---
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <li 
        onClick={onClick} 
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all font-lato-medium ${
            active 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
        {icon}
        <span className="ml-4 font-lato-bold">{label}</span>
    </li>
);

interface KPICardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    unit: string;
    colorClass: string;
}

const KPI_Card: React.FC<KPICardProps> = ({ icon, label, value, unit, colorClass }) => (
    <div className="bg-card p-4 rounded-xl shadow-md flex items-center transform transition-transform hover:-translate-y-1">
        <div className={`rounded-full p-3 mr-4 ${colorClass}`}>
            {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <div>
            <p className="text-sm text-muted-foreground font-lato-light">{label}</p>
            <p className="text-2xl font-lato-bold text-foreground">{value}<span className="text-lg">{unit}</span></p>
        </div>
    </div>
);

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = '' }) => (
    <div className={`bg-card p-6 rounded-xl shadow-md ${className}`}>
        <h3 className="text-lg font-lato-bold text-foreground mb-4">{title}</h3>
        <div className="h-80">{children}</div>
    </div>
);

// --- Módulos del Dashboard ---
const DashboardHome = () => (
    <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <KPI_Card 
                icon={<DollarSign />} 
                label="Ventas del Día" 
                value={new Intl.NumberFormat('es-CO').format(mockData.kpis.ventasHoy)} 
                unit=" COP" 
                colorClass="bg-green-100 text-green-600" 
            />
            <KPI_Card 
                icon={<ShoppingCart />} 
                label="Costo Alimentos" 
                value={mockData.kpis.costoAlimentos.toFixed(1)} 
                unit="%" 
                colorClass="bg-red-100 text-red-600"
            />
            <KPI_Card 
                icon={<TrendingUp />} 
                label="Margen Utilidad" 
                value={mockData.kpis.margenUtilidad.toFixed(1)} 
                unit="%" 
                colorClass="bg-blue-100 text-blue-600"
            />
            <KPI_Card 
                icon={<Star />} 
                label="Satisfacción Cliente" 
                value={mockData.kpis.satisfaccionCliente.toFixed(1)} 
                unit="/5" 
                colorClass="bg-yellow-100 text-yellow-600"
            />
            <KPI_Card 
                icon={<Users />} 
                label="Rotación Personal" 
                value={mockData.kpis.rotacionPersonal.toFixed(1)} 
                unit="%" 
                colorClass="bg-purple-100 text-purple-600"
            />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <ChartCard title="Ventas de la Semana">
                    <Line 
                        data={{
                            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                            datasets: [{
                                label: 'Ventas', 
                                data: mockData.ventasSemana, 
                                borderColor: 'hsl(var(--primary))',
                                backgroundColor: 'hsl(var(--primary) / 0.1)', 
                                fill: true, 
                                tension: 0.4
                            }],
                        }} 
                        options={{ 
                            responsive: true, 
                            maintainAspectRatio: false, 
                            plugins: { legend: { display: false } }, 
                            scales: { 
                                y: { 
                                    ticks: { 
                                        callback: (value) => `${((value as number) / 1000000).toFixed(1)}M` 
                                    } 
                                } 
                            } 
                        }} 
                    />
                </ChartCard>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-lato-bold text-foreground mb-4 flex items-center">
                    <AlertTriangle className="text-primary mr-2" /> Copiloto IA
                </h3>
                <div className="space-y-3">
                    {mockData.alertasCopiloto.map(alerta => (
                        <div 
                            key={alerta.id} 
                            className={`p-3 rounded-lg border-l-4 ${
                                alerta.tipo === 'alerta' 
                                    ? 'bg-destructive/10 border-destructive' 
                                    : alerta.tipo === 'oportunidad' 
                                    ? 'bg-green-50 border-green-400' 
                                    : 'bg-yellow-50 border-yellow-400'
                            }`}
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-1">{alerta.icono}</div>
                                <div className="ml-3">
                                    <p className="text-sm font-lato-bold text-foreground">{alerta.texto}</p>
                                    <p className="text-xs text-muted-foreground font-lato-light mt-1">{alerta.sugerencia}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const MenuEngineeringModule = () => {
    const data = {
        datasets: [
            { label: 'Estrella', data: mockData.menuEngineering.filter(p => p.type === 'Estrella').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(74, 222, 128, 0.8)', pointRadius: 8 },
            { label: 'Vaca Lechera', data: mockData.menuEngineering.filter(p => p.type === 'Vaca Lechera').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(59, 130, 246, 0.8)', pointRadius: 8 },
            { label: 'Incógnita', data: mockData.menuEngineering.filter(p => p.type === 'Incógnita').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(251, 146, 60, 0.8)', pointRadius: 8 },
            { label: 'Perro', data: mockData.menuEngineering.filter(p => p.type === 'Perro').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(239, 68, 68, 0.8)', pointRadius: 8 },
        ],
    };

    const options = {
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const point = mockData.menuEngineering.find(p => p.x === context.parsed.x && p.y === context.parsed.y);
                        return point ? point.label : '';
                    }
                }
            }
        },
        scales: {
            x: { title: { display: true, text: 'Rentabilidad (%)' }, min: 0, max: 100 },
            y: { title: { display: true, text: 'Popularidad (Ventas)' }, min: 0, max: 100 },
        },
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ChartCard title="Matriz de Ingeniería de Menú" className="lg:col-span-2">
                <Scatter options={options} data={data} />
            </ChartCard>
            <div className="bg-card p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-lato-bold text-foreground mb-4">Recomendaciones del Copiloto</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-lato-bold text-green-500">Estrellas (Mantener y Promocionar)</h4>
                        <p className="text-sm text-muted-foreground font-lato-light">'Lomo Saltado' es un ganador. Asegura su visibilidad en el menú.</p>
                    </div>
                    <div>
                        <h4 className="font-lato-bold text-blue-500">Vacas Lecheras (Optimizar Costos)</h4>
                        <p className="text-sm text-muted-foreground font-lato-light">'Bandeja Paisa' es popular pero poco rentable. Intenta reducir su costo de ingredientes sin afectar la calidad.</p>
                    </div>
                    <div>
                        <h4 className="font-lato-bold text-orange-500">Incógnitas (Analizar y Probar)</h4>
                        <p className="text-sm text-muted-foreground font-lato-light">'Salmón Maracuyá' es rentable pero poco vendido. Prueba una promoción o mejor descripción en el menú.</p>
                    </div>
                    <div>
                        <h4 className="font-lato-bold text-red-500">Perros (Considerar Eliminar)</h4>
                        <p className="text-sm text-muted-foreground font-lato-light">'Sopa del Día' no es popular ni rentable. Considera reemplazarla por una opción más atractiva.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialMediaModule = () => {
    const data = mockData.socialMedia;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-card p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-lato-bold text-foreground mb-4">KPIs de Redes Sociales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <Instagram className="mx-auto text-pink-500 mb-2" size={32}/>
                        <p className="text-2xl font-lato-bold">{Intl.NumberFormat().format(data.instagram.followers)}</p>
                        <p className="text-sm text-muted-foreground font-lato-light">Seguidores</p>
                        <p className="text-sm text-green-500 font-lato-bold">+{data.instagram.change} esta semana</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <Facebook className="mx-auto text-blue-600 mb-2" size={32}/>
                        <p className="text-2xl font-lato-bold">{Intl.NumberFormat().format(data.facebook.followers)}</p>
                        <p className="text-sm text-muted-foreground font-lato-light">Seguidores</p>
                        <p className="text-sm text-green-500 font-lato-bold">+{data.facebook.change} esta semana</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <Twitter className="mx-auto text-black mb-2" size={32}/>
                        <p className="text-2xl font-lato-bold">{Intl.NumberFormat().format(data.tiktok.followers)}</p>
                        <p className="text-sm text-muted-foreground font-lato-light">Seguidores</p>
                        <p className="text-sm text-green-500 font-lato-bold">+{data.tiktok.change} esta semana</p>
                    </div>
                </div>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-lato-bold text-foreground mb-4">Últimas Publicaciones</h3>
                <div className="space-y-4">
                    {data.recentPosts.map((post, i) => (
                        <div key={i} className="flex items-center">
                            {post.platform === 'instagram' ? <Instagram className="text-pink-500 mr-3" /> : <Twitter className="text-black mr-3" />}
                            <div>
                                <p className="text-sm font-lato-bold">{post.content}</p>
                                <p className="text-xs text-muted-foreground font-lato-light">Likes: {post.likes}, Comentarios: {post.comments}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SentimentAnalysisModule = () => {
    const data = {
        labels: ['Positivo', 'Negativo', 'Neutro'],
        datasets: [{
            data: [mockData.sentimentAnalysis.positivo, mockData.sentimentAnalysis.negativo, mockData.sentimentAnalysis.neutro],
            backgroundColor: ['#22C55E', '#EF4444', '#FBBF24'],
            borderColor: '#FFFFFF',
            borderWidth: 2,
        }],
    };
    const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Análisis de Sentimientos de Reseñas">
                <Doughnut data={data} options={options} />
            </ChartCard>
            <div className="bg-card p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-lato-bold text-foreground mb-4">Temas Clave Mencionados</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="flex items-center font-lato-bold text-green-600"><ThumbsUp className="mr-2" size={20}/> Menciones Positivas</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {mockData.sentimentAnalysis.positiveKeywords.map(kw => 
                                <span key={kw} className="bg-green-100 text-green-800 text-sm font-lato-medium mr-2 px-2.5 py-0.5 rounded-full">{kw}</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="flex items-center font-lato-bold text-red-600"><ThumbsDown className="mr-2" size={20}/> Menciones Negativas</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {mockData.sentimentAnalysis.negativeKeywords.map(kw => 
                                <span key={kw} className="bg-red-100 text-red-800 text-sm font-lato-medium mr-2 px-2.5 py-0.5 rounded-full">{kw}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InventoryModule = () => {
    const getStatusColor = (status: string) => {
        if (status === 'critico') return 'bg-destructive';
        if (status === 'bajo') return 'bg-yellow-500';
        return 'bg-green-500';
    };
    
    return (
        <div className="bg-card p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-lato-bold text-foreground mb-4">Gestión de Inventario</h3>
            <div className="space-y-4">
                {mockData.inventory.map(item => (
                    <div key={item.name}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-lato-bold">{item.name}</span>
                            <span className="text-sm text-muted-foreground font-lato-light">{item.stock} / {item.reorderPoint * 2}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4">
                            <div 
                                className={`h-4 rounded-full ${getStatusColor(item.status)}`} 
                                style={{ width: `${(item.stock / (item.reorderPoint * 2)) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ShiftsModule = () => (
    <div className="bg-card p-6 rounded-xl shadow-md overflow-x-auto">
        <h3 className="text-lg font-lato-bold text-foreground mb-4">Optimización de Turnos Semanales</h3>
        <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-foreground uppercase bg-muted">
                <tr>
                    <th scope="col" className="px-6 py-3">Rol</th>
                    {Object.keys(mockData.shifts).map(day => 
                        <th key={day} scope="col" className="px-6 py-3">{day}</th>
                    )}
                </tr>
            </thead>
            <tbody>
                {['Cocinero', 'Mesero', 'Barista'].map(role => (
                    <tr key={role} className="bg-background border-b">
                        <th scope="row" className="px-6 py-4 font-lato-bold text-foreground whitespace-nowrap">{role}</th>
                        {Object.values(mockData.shifts).map((shift: any, i) => 
                            <td key={i} className="px-6 py-4 font-lato-light">{shift[role]}</td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TrainingModule = () => (
    <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-lato-bold text-foreground mb-4">Formación (RestroLearn)</h3>
        <div className="space-y-4">
            {mockData.training.map(item => (
                <div key={item.course}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-lato-bold">{item.course} - <span className="text-muted-foreground font-lato-light">{item.employee}</span></span>
                        <span className="text-sm font-lato-bold text-primary">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- Componente Principal del Dashboard ---
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('home');
    const { user, signOut } = useAuth();
    const { hasDiagnosis, loading: diagnosisLoading, checkUserDiagnosis } = useDashboard();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }

        // Verificar si el usuario ha completado el diagnóstico
        const checkDiagnosis = async () => {
            console.log('🔍 Dashboard: Checking user diagnosis...');
            const hasDiag = await checkUserDiagnosis(user.id);
            console.log('📊 Dashboard: User has diagnosis:', hasDiag);
            
            if (!hasDiag) {
                console.log('🎯 Dashboard: Redirecting to diagnosis...');
                navigate('/diagnosis', { replace: true });
            }
        };

        checkDiagnosis();
    }, [user, navigate, checkUserDiagnosis]);

    const navItems = [
        { id: 'home', label: 'Mando de Control', icon: <LayoutDashboard size={20} /> },
        { id: 'finances', label: 'Finanzas e IA', icon: <DollarSign size={20} /> },
        { id: 'talent', label: 'Talento e IA', icon: <Users size={20} /> },
        { id: 'operations', label: 'Operaciones e IA', icon: <Sparkles size={20} /> },
        { id: 'menu', label: 'Menú e Inventario IA', icon: <UtensilsCrossed size={20} /> },
        { id: 'social', label: 'Redes Sociales', icon: <MessageSquare size={20} /> },
        { id: 'sentiment', label: 'Análisis de Sentimientos', icon: <BarChart2 size={20} /> },
        { id: 'inventory', label: 'Gestión de Inventario', icon: <Warehouse size={20} /> },
        { id: 'shifts', label: 'Optimización de Turnos', icon: <CalendarDays size={20} /> },
        { id: 'training', label: 'Formación (RestroLearn)', icon: <BookOpen size={20} /> },
        { id: 'jobs', label: 'Gestión de Empleos', icon: <Briefcase size={20} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <DashboardHome />;
            case 'finances': return <FinancesAIModule />;
            case 'talent': return <TalentAIModule />;
            case 'operations': return <OperationsAIModule />;
            case 'menu': return <MenuInventoryAIModule />;
            case 'social': return <SocialMediaModule />;
            case 'sentiment': return <SentimentAnalysisModule />;
            case 'inventory': return <InventoryModule />;
            case 'shifts': return <ShiftsModule />;
            case 'training': return <TrainingModule />;
            case 'jobs': return <JobsManagement />;
            default: return <DashboardHome />;
        }
    };

    return (
        <div className="flex min-h-screen bg-background font-lato-regular">
            {/* Sidebar de Navegación */}
            <aside className="w-64 bg-card p-4 flex-shrink-0 shadow-lg border-r">
                <div className="flex items-center mb-8">
                    <img 
                        src="/lovable-uploads/4c50cd38-4342-44bc-9a98-cc6a1eba63f4.png" 
                        alt="RestroWizard" 
                        className="h-10 w-auto"
                    />
                </div>
                <nav className="flex-1">
                    <ul>
                        {navItems.map(item => (
                            <NavItem 
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activeTab === item.id}
                                onClick={() => setActiveTab(item.id)}
                            />
                        ))}
                    </ul>
                </nav>
                <div className="mt-8 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={signOut}
                        className="w-full justify-start font-lato-medium"
                    >
                        <LogOut size={20} className="mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;