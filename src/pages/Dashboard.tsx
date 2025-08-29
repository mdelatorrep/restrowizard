import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut, Scatter } from 'react-chartjs-2';
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
    Instagram, Facebook, Twitter, ThumbsUp, ThumbsDown, Meh, LogOut, Briefcase, Bell,
    Menu, FileText, Calendar, Activity, Lightbulb
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useMenus } from '@/hooks/useMenus';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import JobsManagement from '@/components/JobsManagement';
import FinancesAIModule from '@/components/FinancesAIModule';
import TalentAIModule from '@/components/TalentAIModule';
import OperationsAIModule from '@/components/OperationsAIModule';
import MenuInventoryAIModule from '@/components/MenuInventoryAIModule';
import NotificationSettings from '@/components/NotificationSettings';
import { useAIAlerts } from '@/hooks/useAIAlerts';

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
const DashboardHome = ({ stats, recentActivity, userProfile, loading }: any) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is new (no data) - with proper null checks
  const isNewUser = !stats || (
    (stats.totalMenus === 0 || !stats.totalMenus) && 
    (stats.totalJobs === 0 || !stats.totalJobs) && 
    (stats.totalEvents === 0 || !stats.totalEvents) && 
    (!recentActivity || recentActivity.length === 0)
  );

  return (
    <div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido, {userProfile?.full_name || 'Usuario'}!
          </h1>
          <p className="text-muted-foreground">
            Restaurante: {userProfile?.restaurant_name || 'Mi Restaurante'}
          </p>
          {isNewUser && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium mb-2">
                🎉 ¡Acabas de unirte a RestroWizard!
              </p>
              <p className="text-sm text-muted-foreground">
                Comienza creando tu primer menú digital o publicando una oferta de empleo para darle vida a tu dashboard.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/menus')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Menús</p>
                  <p className="text-2xl font-bold">{stats?.totalMenus || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.publishedMenus || 0} publicados
                  </p>
                </div>
                <Menu className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/jobs')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empleos</p>
                  <p className="text-2xl font-bold">{stats?.totalJobs || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeJobs || 0} activos
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/events')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eventos</p>
                  <p className="text-2xl font-bold">{stats?.totalEvents || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.upcomingEvents || 0} próximos
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notificaciones</p>
                  <p className="text-2xl font-bold">{stats?.totalNotifications || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.unreadNotifications || 0} sin leer
                  </p>
                </div>
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {isNewUser ? "¡Tu actividad aparecerá aquí!" : "No hay actividad reciente"}
                  </p>
                  {isNewUser && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Crea tu primer menú digital</p>
                      <p>• Publica una oferta de empleo</p>
                      <p>• Organiza un evento</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {activity.type === 'menu' && <Menu className="h-5 w-5 text-blue-500" />}
                        {activity.type === 'job' && <Briefcase className="h-5 w-5 text-green-500" />}
                        {activity.type === 'event' && <Calendar className="h-5 w-5 text-purple-500" />}
                        {activity.type === 'notification' && <Bell className="h-5 w-5 text-orange-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      {activity.status && (
                        <Badge variant={
                          activity.status === 'published' || activity.status === 'active' 
                            ? 'default' 
                            : 'secondary'
                        }>
                          {activity.status === 'published' ? 'Publicado' : 
                           activity.status === 'active' ? 'Activo' : 
                           activity.status === 'draft' ? 'Borrador' : activity.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isNewUser ? "¡Comienza Aquí!" : "Acciones Rápidas"}
              </CardTitle>
              <CardDescription>
                {isNewUser 
                  ? "Estas son las primeras acciones que puedes realizar para comenzar"
                  : "Accede rápidamente a las funciones principales"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => navigate('/menus')} 
                  className="h-20 flex flex-col items-center justify-center"
                  variant={isNewUser ? "default" : "outline"}
                >
                  <Menu className="h-6 w-6 mb-2" />
                  <span className="text-sm">Crear Menú</span>
                  {isNewUser && <span className="text-xs opacity-75">¡Recomendado!</span>}
                </Button>
                <Button 
                  onClick={() => navigate('/jobs')} 
                  className="h-20 flex flex-col items-center justify-center"
                  variant="outline"
                >
                  <Briefcase className="h-6 w-6 mb-2" />
                  <span className="text-sm">Publicar Empleo</span>
                </Button>
                <Button 
                  onClick={() => navigate('/events')} 
                  className="h-20 flex flex-col items-center justify-center"
                  variant="outline"
                >
                  <Calendar className="h-6 w-6 mb-2" />
                  <span className="text-sm">Crear Evento</span>
                </Button>
                <Button 
                  onClick={() => navigate('/diagnosis')} 
                  className="h-20 flex flex-col items-center justify-center"
                  variant="outline"
                >
                  <BarChart2 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Ver Diagnóstico</span>
                </Button>
              </div>
              {isNewUser && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Consejo para Empezar
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Te recomendamos comenzar creando tu primer menú digital. 
                    Es rápido, fácil y podrás compartirlo inmediatamente con tus clientes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

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

const PersonalModule = () => <ShiftsModule />;
const FormacionModule = () => <TrainingModule />;

const Dashboard: React.FC = () => {
    const [activeSection, setActiveSection] = useState('inicio');
    const navigate = useNavigate();
    const { user, loading: authLoading, signOut } = useAuth();
    const { sendAIAlert } = useAIAlerts();
    const { stats, recentActivity, userProfile, loading: dashboardLoading, hasDiagnosis, loadDashboardData } = useDashboard();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
            return;
        }
    }, [user, authLoading, navigate]);

    // Loading state
    if (authLoading || dashboardLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    // Check if user is authenticated
    if (!user) {
        return null;
    }

    // Demo AI alert on component mount
    useEffect(() => {
        const timer = setTimeout(() => {
            sendAIAlert({
                type: 'inventory_low',
                title: 'Alerta de Inventario',
                message: 'El stock de ingredientes principales está bajo. Se recomienda realizar pedido.',
                severity: 'medium',
                data: { inventory_level: 15, threshold: 20 }
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [sendAIAlert]);

    if (!hasDiagnosis && activeSection === 'inicio') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="max-w-md mx-auto p-8 bg-card rounded-lg shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-4">¡Bienvenido a RestroWizard!</h2>
                    <p className="text-muted-foreground mb-6">
                        Para comenzar, necesitamos conocer mejor tu restaurante. 
                        Completa nuestro diagnóstico para obtener recomendaciones personalizadas.
                    </p>
                    <Button 
                        onClick={() => navigate('/diagnosis')}
                        className="w-full"
                        size="lg"
                    >
                        Realizar Diagnóstico
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-card shadow-lg border-r">
                <div className="p-6">
                    <img 
                        src="/lovable-uploads/4c50cd38-4342-44bc-9a98-cc6a1eba63f4.png" 
                        alt="RestroWizard" 
                        className="h-10 w-auto mb-8"
                    />
                    <nav>
                        <ul className="space-y-1">
                            <NavItem icon={<LayoutDashboard />} label="Inicio" active={activeSection === 'inicio'} onClick={() => setActiveSection('inicio')} />
                            <NavItem icon={<BarChart2 />} label="Menu Engineering" active={activeSection === 'menu-engineering'} onClick={() => setActiveSection('menu-engineering')} />
                            <NavItem icon={<MessageSquare />} label="Redes Sociales" active={activeSection === 'redes-sociales'} onClick={() => setActiveSection('redes-sociales')} />
                            <NavItem icon={<Star />} label="Análisis de Sentimiento" active={activeSection === 'analisis-sentimiento'} onClick={() => setActiveSection('analisis-sentimiento')} />
                            <NavItem icon={<Warehouse />} label="Inventario" active={activeSection === 'inventario'} onClick={() => setActiveSection('inventario')} />
                            <NavItem icon={<Users />} label="Personal" active={activeSection === 'personal'} onClick={() => setActiveSection('personal')} />
                            <NavItem icon={<BookOpen />} label="Formación" active={activeSection === 'formacion'} onClick={() => setActiveSection('formacion')} />
                            <NavItem icon={<Briefcase />} label="Gestión de Empleos" active={activeSection === 'empleos'} onClick={() => setActiveSection('empleos')} />
                            <NavItem icon={<DollarSign />} label="Finanzas IA" active={activeSection === 'finanzas'} onClick={() => setActiveSection('finanzas')} />
                            <NavItem icon={<Sparkles />} label="Talento IA" active={activeSection === 'talento'} onClick={() => setActiveSection('talento')} />
                            <NavItem icon={<UtensilsCrossed />} label="Operaciones IA" active={activeSection === 'operaciones'} onClick={() => setActiveSection('operaciones')} />
                            <NavItem icon={<Warehouse />} label="Menú/Inventario IA" active={activeSection === 'menu-inventario'} onClick={() => setActiveSection('menu-inventario')} />
                            <NavItem icon={<Bell />} label="Notificaciones" active={activeSection === 'notificaciones'} onClick={() => setActiveSection('notificaciones')} />
                        </ul>
                    </nav>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                    <Button variant="outline" onClick={signOut} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <main className="flex-1 p-8 overflow-y-auto">
                    {activeSection === 'inicio' && <DashboardHome stats={stats} recentActivity={recentActivity} userProfile={userProfile} loading={dashboardLoading} />}
                    {activeSection === 'menu-engineering' && <MenuEngineeringModule />}
                    {activeSection === 'redes-sociales' && <SocialMediaModule />}
                    {activeSection === 'analisis-sentimiento' && <SentimentAnalysisModule />}
                    {activeSection === 'inventario' && <InventoryModule />}
                    {activeSection === 'personal' && <PersonalModule />}
                    {activeSection === 'formacion' && <FormacionModule />}
                    {activeSection === 'empleos' && <JobsManagement />}
                    {activeSection === 'finanzas' && <FinancesAIModule />}
                    {activeSection === 'talento' && <TalentAIModule />}
                    {activeSection === 'operaciones' && <OperationsAIModule />}
                    {activeSection === 'menu-inventario' && <MenuInventoryAIModule />}
                    {activeSection === 'notificaciones' && <NotificationSettings />}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;