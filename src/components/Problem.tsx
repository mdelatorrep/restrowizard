import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faMoneyBillWave, faUserSlash, faChartPie, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

const Problem = () => {
  const problems = [
    {
      icon: faMoneyBillWave,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      title: 'Crisis Financiera',
      stats: [
        { value: '97%', label: 'lucha con costos de alimentos' },
        { value: '38%', label: 'no es rentable' },
        { value: '43%', label: 'tiene deudas activas' }
      ]
    },
    {
      icon: faUserSlash,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      title: 'Escasez de Talento',
      stats: [
        { value: '45%', label: 'no encuentra personal' },
        { value: '67%', label: 'vacantes en cocina' },
        { value: '98%', label: 'lucha con costos laborales' }
      ]
    },
    {
      icon: faChartPie,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      title: 'Operaciones Caóticas',
      stats: [
        { value: '79%', label: 'lucha por atraer clientes' },
        { value: '81%', label: 'sin programa de lealtad' },
        { value: '60%', label: 'decide sin datos' }
      ]
    },
    {
      icon: faBoxOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      title: 'Inventario Ineficiente',
      stats: [
        { value: '77%', label: 'problemas de suministros' },
        { value: '30%', label: 'merma descontrolada' },
        { value: '86%', label: 'quiere más variedad' }
      ]
    }
  ];

  return (
    <section id="problema" className="py-24 bg-gradient-to-b from-off-white to-lavender-light/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-500/10 rounded-full px-4 py-2 mb-6">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
            <span className="text-sm font-lato-medium text-red-600">Datos reales de la industria</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline text-purple-intense mb-6">
            La Crisis Silenciosa que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Mata Restaurantes
            </span>
          </h2>
          
          <p className="max-w-3xl mx-auto text-lg text-soft-black font-lato-regular">
            Mientras cocinas con pasión, <strong className="font-lato-bold">4 enemigos invisibles</strong> devoran tu rentabilidad. 
            No tienes que seguir peleando solo.
          </p>
        </div>
        
        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className={`w-14 h-14 ${problem.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                <FontAwesomeIcon icon={problem.icon} className={`${problem.color} text-2xl`} />
              </div>
              
              <h3 className="text-xl font-headline text-purple-intense mb-4">
                {problem.title}
              </h3>
              
              <div className="space-y-3">
                {problem.stats.map((stat, idx) => (
                  <div key={idx} className="flex items-baseline gap-2">
                    <span className={`text-2xl font-headline ${problem.color}`}>{stat.value}</span>
                    <span className="text-sm text-soft-black/70 font-lato-light">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom Message */}
        <div className="mt-16 text-center">
          <p className="text-xl font-lato-medium text-purple-intense">
            ¿Te identificas con alguno? <span className="font-lato-bold">RestroWizard tiene la solución.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Problem;