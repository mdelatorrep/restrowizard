import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Banknote, Check, PackageOpen, PieChart, UserX } from 'lucide-react';

const Problem = () => {
  const navigate = useNavigate();

  const problems = [
    {
      icon: Banknote,
      gradient: 'from-red-500 to-rose-600',
      lightGradient: 'from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      title: 'Crisis Financiera',
      painPoint: '97% lucha con costos',
      stats: [
        { value: '38%', label: 'no es rentable' },
        { value: '43%', label: 'tiene deudas activas' }
      ],
      solution: 'IA que predice y optimiza tus finanzas'
    },
    {
      icon: UserX,
      gradient: 'from-orange-500 to-amber-600',
      lightGradient: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      title: 'Escasez de Talento',
      painPoint: '45% no encuentra personal',
      stats: [
        { value: '67%', label: 'vacantes en cocina' },
        { value: '98%', label: 'costos laborales altos' }
      ],
      solution: 'Conexión con candidatos + horarios inteligentes'
    },
    {
      icon: PieChart,
      gradient: 'from-purple-500 to-violet-600',
      lightGradient: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200',
      title: 'Sin Presencia Digital',
      painPoint: '79% lucha por atraer clientes',
      stats: [
        { value: '81%', label: 'sin reservas online' },
        { value: '60%', label: 'sin sitio web' }
      ],
      solution: 'Sitio web + reservas + delivery en minutos'
    },
    {
      icon: PackageOpen,
      gradient: 'from-blue-500 to-indigo-600',
      lightGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      title: 'Inventario Descontrolado',
      painPoint: '30% merma descontrolada',
      stats: [
        { value: '77%', label: 'problemas de stock' },
        { value: '$$$', label: 'desperdicio diario' }
      ],
      solution: 'Predicción de inventario con IA'
    }
  ];

  return (
    <section id="problema" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>

      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-5 py-2.5 mb-6">
            <AlertTriangle className="text-red-500" />
            <span className="text-sm font-lato-bold text-red-600">Datos reales de la industria restaurantera</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline text-purple-intense mb-6">
            4 Problemas que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Están Matando tu Restaurante
            </span>
          </h2>
          
          <p className="max-w-3xl mx-auto text-lg text-soft-black/70 font-lato-regular">
            La buena noticia: <strong className="font-lato-bold text-purple-intense">todos tienen solución</strong>. 
            RestroWizard automatiza las decisiones difíciles para que tú te enfoques en lo que amas.
          </p>
        </div>
        
        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className={`group bg-gradient-to-br ${problem.lightGradient} rounded-3xl p-8 ${problem.borderColor} border-2 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${problem.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${problem.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {(() => { const Icon = problem.icon; return <Icon className="text-white text-2xl" />; })()}
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl font-headline bg-gradient-to-r ${problem.gradient} bg-clip-text text-transparent`}>
                      {problem.stats[0].value}
                    </span>
                    <p className="text-sm text-soft-black/60">{problem.stats[0].label}</p>
                  </div>
                </div>
                
                {/* Title & Pain */}
                <h3 className="text-2xl font-headline text-purple-intense mb-2">
                  {problem.title}
                </h3>
                <p className="text-lg text-soft-black/70 font-lato-light mb-4">
                  {problem.painPoint}
                </p>
                
                {/* Additional Stats */}
                <div className="flex gap-6 mb-6">
                  {problem.stats.slice(1).map((stat, idx) => (
                    <div key={idx} className="flex items-baseline gap-2">
                      <span className={`text-2xl font-headline bg-gradient-to-r ${problem.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </span>
                      <span className="text-sm text-soft-black/60 font-lato-light">{stat.label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Solution */}
                <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl border border-white shadow-sm group-hover:bg-white transition-colors">
                  <div className={`w-8 h-8 bg-gradient-to-br ${problem.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Check className="text-white text-sm" />
                  </div>
                  <p className="text-sm font-lato-medium text-purple-intense">{problem.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-xl font-lato-medium text-soft-black/80 mb-6">
            ¿Te identificas con alguno?{' '}
            <span className="font-lato-bold text-purple-intense">RestroWizard los resuelve todos.</span>
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="group bg-gradient-to-r from-purple-medium to-purple-intense hover:from-purple-intense hover:to-purple-medium text-white font-lato-bold text-lg px-10 py-5 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
          >
            Diagnosticar Mi Restaurante Gratis
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Problem;
