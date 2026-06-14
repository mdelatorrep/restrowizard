import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Brain, CheckCircle2, Leaf, Link2, Play, Store, TrendingUp, Users, Utensils } from 'lucide-react';

const Ecosystem = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(0);

  const modules = [
    {
      icon: TrendingUp,
      gradient: 'from-green-400 to-emerald-600',
      bgGradient: 'from-green-500/20 to-emerald-500/10',
      borderColor: 'border-green-500/30',
      title: 'Finanzas IA',
      subtitle: 'Control Financiero Inteligente',
      description: 'Predice tu rentabilidad antes de que termine el mes. Detecta fugas de dinero y sugiere precios óptimos automáticamente.',
      features: [
        'Proyecciones de rentabilidad con 95% precisión',
        'Alertas automáticas de costos elevados',
        'Simulador de escenarios financieros',
        'Análisis de punto de equilibrio'
      ],
      metric: '+15%',
      metricLabel: 'rentabilidad promedio',
      screenshot: 'Dashboard mostrando gráficas de rentabilidad, alertas de costos y proyecciones financieras'
    },
    {
      icon: Users,
      gradient: 'from-blue-400 to-indigo-600',
      bgGradient: 'from-blue-500/20 to-indigo-500/10',
      borderColor: 'border-blue-500/30',
      title: 'Talento IA',
      subtitle: 'Gestión de Personal Eficiente',
      description: 'Optimiza horarios basados en demanda real. Encuentra y retiene al personal ideal para tu equipo.',
      features: [
        'Horarios optimizados por demanda',
        'Conexión con candidatos ideales',
        'Programas de capacitación automáticos',
        'Predicción de rotación de personal'
      ],
      metric: '-30%',
      metricLabel: 'rotación de personal',
      screenshot: 'Panel de gestión de turnos, métricas de desempeño y alertas de personal'
    },
    {
      icon: Bot,
      gradient: 'from-purple-400 to-pink-600',
      bgGradient: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      title: 'Operaciones IA',
      subtitle: 'Análisis de Operaciones Avanzado',
      description: 'Convierte tus datos en acciones claras. Recupera clientes y automatiza tu marketing.',
      features: [
        'Reportes accionables diarios',
        'Programas de lealtad inteligentes',
        'Recuperación automática de clientes',
        'Análisis de tiempos de servicio'
      ],
      metric: '+25%',
      metricLabel: 'clientes recurrentes',
      screenshot: 'Vista de operaciones con métricas en tiempo real y automatizaciones activas'
    },
    {
      icon: Utensils,
      gradient: 'from-orange-400 to-red-600',
      bgGradient: 'from-orange-500/20 to-red-500/10',
      borderColor: 'border-orange-500/30',
      title: 'Menú e Inventario IA',
      subtitle: 'Optimización de Menú e Inventario',
      description: 'Diseña menús que maximizan ganancias. Predice necesidades de stock y elimina desperdicios.',
      features: [
        'Simulador de rentabilidad por plato',
        'Predicción precisa de inventario',
        'Reducción de merma automática',
        'Ingeniería de menú avanzada'
      ],
      metric: '-40%',
      metricLabel: 'desperdicio de alimentos',
      screenshot: 'Matriz de ingeniería de menú con análisis de rentabilidad y popularidad'
    },
    {
      icon: Leaf,
      gradient: 'from-teal-400 to-green-600',
      bgGradient: 'from-teal-500/20 to-green-500/10',
      borderColor: 'border-teal-500/30',
      title: 'Sostenibilidad IA',
      subtitle: 'Impacto Ambiental Positivo',
      description: 'Mide y reduce tu huella de carbono. Obtén certificaciones ambientales y atrae clientes conscientes.',
      features: [
        'Medición de huella de carbono',
        'Optimización de desperdicio',
        'Reportes de sostenibilidad',
        'Sugerencias de proveedores locales'
      ],
      metric: '-35%',
      metricLabel: 'huella de carbono',
      screenshot: 'Dashboard de sostenibilidad con métricas ambientales y objetivos'
    },
    {
      icon: Store,
      gradient: 'from-violet-400 to-purple-600',
      bgGradient: 'from-violet-500/20 to-purple-500/10',
      borderColor: 'border-violet-500/30',
      title: 'Ghost Kitchen IA',
      subtitle: 'Marcas Virtuales Rentables',
      description: 'Lanza y gestiona marcas virtuales desde tu cocina. Optimiza operaciones multi-plataforma.',
      features: [
        'Gestión de múltiples marcas',
        'Integración con agregadores',
        'Análisis de comisiones y márgenes',
        'Cola de producción unificada'
      ],
      metric: '+45%',
      metricLabel: 'ingresos adicionales',
      screenshot: 'Panel de Ghost Kitchen con marcas virtuales y pedidos en tiempo real'
    },
    {
      icon: Link2,
      gradient: 'from-cyan-400 to-blue-600',
      bgGradient: 'from-cyan-500/20 to-blue-500/10',
      borderColor: 'border-cyan-500/30',
      title: 'Gestión de Cadenas IA',
      subtitle: 'Control Multi-Sucursal',
      description: 'Administra todas tus ubicaciones desde un solo lugar. Estandariza procesos y compara rendimiento.',
      features: [
        'Dashboard consolidado multi-ubicación',
        'Menú maestro centralizado',
        'Transferencias de inventario',
        'Benchmarking entre sucursales'
      ],
      metric: '+20%',
      metricLabel: 'eficiencia operativa',
      screenshot: 'Vista de cadena con comparativas entre ubicaciones y KPIs consolidados'
    }
  ];

  return (
    <section id="ecosistema" className="py-24 bg-gradient-to-b from-dark-gray to-soft-black text-off-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-medium/20 rounded-full px-4 py-2 mb-6">
            <Brain className="text-purple-medium" />
            <span className="text-sm font-lato-medium text-purple-medium">Ecosistema completo de IA</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline mb-6">
            7 Co-Pilotos de IA que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lavender-light to-accent">
              Trabajan 24/7
            </span>
          </h2>
          
          <p className="max-w-3xl mx-auto text-lg font-lato-light text-off-white/80">
            Cada módulo resuelve un problema crítico de tu restaurante. 
            <strong className="font-lato-bold text-off-white"> Trabajan unidos para maximizar tu rentabilidad</strong> mientras tú te enfocas en la gastronomía.
          </p>
        </div>
        
        {/* Module Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {modules.map((module, index) => (
            <button
              key={index}
              onClick={() => setActiveModule(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                activeModule === index
                  ? `bg-gradient-to-r ${module.gradient} text-white shadow-lg`
                  : 'bg-white/5 text-off-white/70 hover:bg-white/10 hover:text-off-white'
              }`}
            >
              {(() => { const Icon = module.icon; return <Icon className="text-sm" />; })()}
              <span className="font-lato-medium text-sm hidden sm:inline">{module.title}</span>
            </button>
          ))}
        </div>
        
        {/* Active Module Display */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Module Info */}
          <div className={`bg-gradient-to-br ${modules[activeModule].bgGradient} backdrop-blur-sm rounded-3xl p-8 border ${modules[activeModule].borderColor}`}>
            <div className="flex items-start justify-between mb-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${modules[activeModule].gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                {(() => { const Icon = modules[activeModule].icon; return <Icon className="text-white text-2xl" />; })()}
              </div>
              <div className="text-right">
                <div className="text-4xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  {modules[activeModule].metric}
                </div>
                <div className="text-sm text-off-white/60 font-lato-light">{modules[activeModule].metricLabel}</div>
              </div>
            </div>
            
            <h3 className="text-3xl font-headline text-lavender-light mb-2">{modules[activeModule].title}</h3>
            <p className="text-sm text-purple-medium/80 font-lato-medium mb-4">{modules[activeModule].subtitle}</p>
            <p className="font-lato-light text-off-white/80 mb-6 text-lg">{modules[activeModule].description}</p>
            
            <div className="space-y-3 mb-8">
              {modules[activeModule].features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-400 text-sm flex-shrink-0" />
                  <span className="text-off-white/80 font-lato-light">{feature}</span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => navigate('/auth')}
              className={`group bg-gradient-to-r ${modules[activeModule].gradient} hover:opacity-90 text-white font-lato-bold px-6 py-3 rounded-xl transition-all duration-300 inline-flex items-center gap-2`}
            >
              Ver en acción
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Module Screenshot/Preview */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="aspect-[4/3] bg-gradient-to-br from-purple-intense/30 to-soft-black rounded-2xl flex items-center justify-center relative overflow-hidden">
              {/* Simulated Screenshot */}
              <div className="absolute inset-4 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  <div className="flex-1 bg-white/10 rounded h-4 ml-4"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 h-20"></div>
                  <div className="bg-white/5 rounded-lg p-3 h-20"></div>
                  <div className="bg-white/5 rounded-lg p-3 h-32 col-span-2"></div>
                </div>
              </div>
              
              {/* Play Button Overlay */}
              <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all group">
                <Play className="text-white text-xl ml-1 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <p className="text-center text-off-white/50 text-sm mt-4 font-lato-light">
              {modules[activeModule].screenshot}
            </p>
          </div>
        </div>
        
        {/* Quick Access Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {modules.map((module, index) => (
            <button
              key={index}
              onClick={() => setActiveModule(index)}
              className={`p-4 rounded-2xl transition-all duration-300 ${
                activeModule === index
                  ? `bg-gradient-to-br ${module.gradient} shadow-lg scale-105`
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {(() => { const Icon = module.icon; return <Icon className="text-2xl text-white mb-2" />; })()}
              <p className="text-xs text-white/80 font-lato-medium">{module.title.replace(' IA', '')}</p>
            </button>
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center mt-16">
          <button 
            onClick={() => navigate('/auth')}
            className="group bg-gradient-to-r from-purple-medium to-purple-intense hover:from-purple-intense hover:to-purple-medium text-white font-lato-bold text-lg px-10 py-5 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
          >
            Activa todos los Co-Pilotos
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-off-white/50 font-lato-light">
            Comienza gratis • Sin compromiso • Resultados garantizados
          </p>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;
