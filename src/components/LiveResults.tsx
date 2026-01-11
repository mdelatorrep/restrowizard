import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faBolt, faArrowUp, faArrowDown, 
  faUtensils, faUsers, faRobot, faLeaf
} from '@fortawesome/free-solid-svg-icons';

const LiveResults = () => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [communityStats, setCommunityStats] = useState({
    totalSaved: 2347892,
    hoursAutomated: 45230,
    alertsToday: 1247
  });

  const tickerItems = [
    { restaurant: 'El Jardín Secreto', saving: 847, city: 'CDMX', module: 'Finanzas IA', time: '3 min' },
    { restaurant: 'Tacos Don Pepe', saving: 1230, city: 'Guadalajara', module: 'Menú IA', time: '8 min' },
    { restaurant: 'La Parrilla Norteña', saving: 560, city: 'Monterrey', module: 'Talento IA', time: '12 min' },
    { restaurant: 'Café Bohemio', saving: 2100, city: 'Puebla', module: 'Operaciones IA', time: '15 min' },
    { restaurant: 'Sushi Express', saving: 980, city: 'Cancún', module: 'Ghost Kitchen', time: '22 min' },
  ];

  // Rotate ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Increment community stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCommunityStats(prev => ({
        totalSaved: prev.totalSaved + Math.floor(Math.random() * 30) + 5,
        hoursAutomated: prev.hoursAutomated + Math.floor(Math.random() * 2),
        alertsToday: prev.alertsToday + Math.floor(Math.random() * 3)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const beforeAfterMetrics = [
    { label: 'Food Cost', before: '35%', after: '28%', improvement: '-20%', icon: faUtensils, color: 'orange' },
    { label: 'Merma', before: '12%', after: '4%', improvement: '-67%', icon: faLeaf, color: 'green' },
    { label: 'Rotación Personal', before: '45%', after: '28%', improvement: '-38%', icon: faUsers, color: 'blue' },
    { label: 'Rentabilidad', before: '8%', after: '18%', improvement: '+125%', icon: faChartLine, color: 'purple' },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-soft-black to-dark-gray overflow-hidden">
      {/* Live Ticker */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-soft-black via-transparent to-soft-black z-10 pointer-events-none"></div>
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-y border-green-500/20 py-4">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center gap-4 text-off-white">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-400 font-lato-bold">En vivo:</span>
              <div className="overflow-hidden relative h-6 flex-1 max-w-xl">
                {tickerItems.map((item, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 flex items-center gap-2 transition-all duration-500 ${
                      index === tickerIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                  >
                    <span className="text-off-white/90">
                      <strong className="text-green-400">${formatNumber(item.saving)}</strong> ahorrado por{' '}
                      <span className="text-lavender-light">{item.restaurant}</span> • {item.city}
                    </span>
                    <span className="text-off-white/50 text-sm">hace {item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-medium/20 rounded-full px-4 py-2 mb-4">
            <FontAwesomeIcon icon={faBolt} className="text-yellow-400" />
            <span className="text-sm font-lato-medium text-lavender-light">Resultados en tiempo real</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline text-off-white mb-4">
            Mira el Impacto de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              RestroWizard
            </span>
          </h2>
          <p className="text-off-white/60 font-lato-light max-w-2xl mx-auto">
            Datos reales de restaurantes que ya están optimizando sus operaciones con nuestra IA
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {beforeAfterMetrics.map((metric, index) => (
            <div 
              key={index}
              className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  metric.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                  metric.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  metric.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  <FontAwesomeIcon icon={metric.icon} />
                </div>
                <span className="text-off-white/80 font-lato-medium">{metric.label}</span>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-xs text-off-white/50 mb-1">Antes</p>
                  <p className="text-xl font-headline text-red-400 line-through opacity-70">{metric.before}</p>
                </div>
                <FontAwesomeIcon icon={faArrowDown} className="text-green-400 transform rotate-[-45deg]" />
                <div className="text-center">
                  <p className="text-xs text-off-white/50 mb-1">Después</p>
                  <p className="text-xl font-headline text-green-400">{metric.after}</p>
                </div>
              </div>
              
              <div className={`text-center py-2 rounded-lg ${
                metric.improvement.startsWith('+') 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-green-500/10 text-green-400'
              }`}>
                <span className="font-lato-bold">{metric.improvement}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Community Stats */}
        <div className="bg-gradient-to-r from-purple-intense/50 to-purple-medium/30 rounded-3xl p-8 border border-purple-medium/30">
          <div className="text-center mb-8">
            <h3 className="text-xl font-headline text-off-white mb-2">
              Comunidad RestroWizard
            </h3>
            <p className="text-off-white/60 font-lato-light">
              Más de 500 restaurantes optimizando juntos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                ${formatNumber(communityStats.totalSaved)}
              </div>
              <p className="text-off-white/60 font-lato-light">Total ahorrado</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
                {formatNumber(communityStats.hoursAutomated)}
              </div>
              <p className="text-off-white/60 font-lato-light">Horas automatizadas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
                {formatNumber(communityStats.alertsToday)}
              </div>
              <p className="text-off-white/60 font-lato-light">Alertas enviadas hoy</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveResults;
