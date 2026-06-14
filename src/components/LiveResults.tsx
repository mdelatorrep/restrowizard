import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Bot, CalendarCheck, Globe, Leaf, ShoppingCart, TrendingUp, Users, Utensils, Zap } from 'lucide-react';
const LiveResults = () => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [communityStats, setCommunityStats] = useState({
    totalSaved: 2847892,
    hoursAutomated: 45230,
    websitesCreated: 523,
    reservationsToday: 1892
  });

  const tickerItems = [
    { restaurant: 'El Jardín Secreto', saving: 1847, city: 'CDMX', module: 'Finanzas IA', time: '2 min' },
    { restaurant: 'Tacos Don Pepe', saving: 2230, city: 'Guadalajara', module: 'Sitio Web', time: '5 min' },
    { restaurant: 'La Parrilla Norteña', saving: 960, city: 'Monterrey', module: 'Reservas', time: '8 min' },
    { restaurant: 'Café Bohemio', saving: 3100, city: 'Puebla', module: 'Delivery', time: '12 min' },
    { restaurant: 'Sushi Express', saving: 1580, city: 'Cancún', module: 'Menú IA', time: '15 min' },
    { restaurant: 'Bistro Milano', saving: 2750, city: 'CDMX', module: 'Ghost Kitchen', time: '18 min' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCommunityStats(prev => ({
        totalSaved: prev.totalSaved + Math.floor(Math.random() * 50) + 10,
        hoursAutomated: prev.hoursAutomated + Math.floor(Math.random() * 2),
        websitesCreated: prev.websitesCreated + (Math.random() > 0.8 ? 1 : 0),
        reservationsToday: prev.reservationsToday + Math.floor(Math.random() * 3)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const beforeAfterMetrics = [
    { 
      label: 'Food Cost', 
      before: '35%', 
      after: '28%', 
      improvement: '-20%', 
      icon: faUtensils, 
      gradient: 'from-orange-500 to-red-500',
      description: 'Optimización de compras con IA'
    },
    { 
      label: 'Reservas Online', 
      before: '12%', 
      after: '67%', 
      improvement: '+458%', 
      icon: faCalendarCheck, 
      gradient: 'from-green-500 to-emerald-500',
      description: 'Sitio web con reservas 24/7'
    },
    { 
      label: 'Pedidos Directos', 
      before: '8%', 
      after: '45%', 
      improvement: '+462%', 
      icon: faShoppingCart, 
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Delivery propio sin comisiones'
    },
    { 
      label: 'Rentabilidad', 
      before: '8%', 
      after: '18%', 
      improvement: '+125%', 
      icon: faChartLine, 
      gradient: 'from-purple-500 to-pink-500',
      description: 'Co-pilotos IA optimizando 24/7'
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-soft-black via-purple-intense/20 to-soft-black overflow-hidden">
      {/* Live Ticker */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-soft-black via-transparent to-soft-black z-10 pointer-events-none"></div>
        <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/15 to-green-500/10 border-y border-green-500/20 py-4 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center gap-4 text-off-white">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-green-400 font-lato-bold text-sm">EN VIVO</span>
              </div>
              <div className="overflow-hidden relative h-6 flex-1 max-w-2xl">
                {tickerItems.map((item, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 flex items-center gap-2 transition-all duration-700 ${
                      index === tickerIndex ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'
                    }`}
                  >
                    <span className="text-off-white/90 truncate">
                      <strong className="text-green-400 font-headline">${formatNumber(item.saving)}</strong>
                      {' '}ahorrado por{' '}
                      <span className="text-lavender-light font-lato-medium">{item.restaurant}</span>
                      {' '}• {item.city} •{' '}
                      <span className="text-purple-medium">{item.module}</span>
                    </span>
                    <span className="text-off-white/40 text-sm whitespace-nowrap">hace {item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-medium/20 to-purple-intense/20 rounded-full px-5 py-2.5 mb-6 border border-purple-medium/30">
            <Zap className="text-yellow-400" />
            <span className="text-sm font-lato-bold text-purple-medium">Resultados en tiempo real</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-headline text-off-white mb-6">
            Impacto Real de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400">
              RestroWizard
            </span>
          </h2>
          <p className="text-off-white/60 font-lato-light max-w-2xl mx-auto text-lg">
            Datos de restaurantes que ya están transformando sus operaciones
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {beforeAfterMetrics.map((metric, index) => (
            <div 
              key={index}
              className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/25 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${metric.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <FontAwesomeIcon icon={metric.icon} className="text-white text-lg" />
                </div>
                
                <span className="text-off-white/80 font-lato-medium text-lg">{metric.label}</span>
                
                {/* Before/After */}
                <div className="flex items-center justify-between my-4">
                  <div className="text-center">
                    <p className="text-xs text-off-white/40 mb-1">Antes</p>
                    <p className="text-xl font-headline text-red-400/70 line-through">{metric.before}</p>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
                    <ArrowDown className="text-green-400 transform rotate-[-90deg] text-sm" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-off-white/40 mb-1">Después</p>
                    <p className="text-xl font-headline text-green-400">{metric.after}</p>
                  </div>
                </div>
                
                {/* Improvement Badge */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl py-2 px-4 text-center mb-3">
                  <span className="text-green-400 font-headline text-xl">{metric.improvement}</span>
                </div>
                
                {/* Description */}
                <p className="text-xs text-off-white/50 font-lato-light text-center">{metric.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Community Stats */}
        <div className="relative bg-gradient-to-r from-purple-intense/60 via-purple-medium/40 to-purple-intense/60 rounded-3xl p-10 border border-purple-medium/30 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-medium/20 via-transparent to-transparent"></div>
          
          <div className="relative">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-headline text-off-white mb-2">
                La Comunidad RestroWizard
              </h3>
              <p className="text-off-white/60 font-lato-light">
                Restaurantes y consultores que crecen con IA
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-4xl md:text-5xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2 tabular-nums">
                  ${formatNumber(communityStats.totalSaved)}
                </div>
                <p className="text-off-white/60 font-lato-light">Total ahorrado</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-4xl md:text-5xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 tabular-nums">
                  {formatNumber(communityStats.websitesCreated)}
                </div>
                <p className="text-off-white/60 font-lato-light">Sitios web activos</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-4xl md:text-5xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 tabular-nums">
                  {formatNumber(communityStats.reservationsToday)}
                </div>
                <p className="text-off-white/60 font-lato-light">Reservas hoy</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-4xl md:text-5xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2 tabular-nums">
                  {formatNumber(communityStats.hoursAutomated)}
                </div>
                <p className="text-off-white/60 font-lato-light">Horas automatizadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveResults;
