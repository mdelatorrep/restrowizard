import React from 'react';

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="py-20 bg-dark-gray text-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline mb-4">
            4 Copilotos IA Especializados: Tu Equipo de Gestión Automatizado
          </h2>
          <p className="max-w-4xl mx-auto text-lg font-lato-light">
            Cada copiloto domina su área con inteligencia artificial avanzada. 
            <span className="font-lato-bold">Trabajan unidos para maximizar tu rentabilidad</span> mientras tú te enfocas en la pasión: la gastronomía.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">💰</div>
              <h3 className="text-2xl font-headline text-lavender-light">
                Copiloto Finanzas IA
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">Rentabilidad Predictiva:</span> Predice si serás rentable el próximo mes. 
              <span className="font-lato-bold">Detección de Anomalías:</span> Alerta sobre costos descontrolados. 
              <span className="font-lato-bold">Precios Dinámicos:</span> Optimiza precios en tiempo real según demanda.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Análisis predictivo de rentabilidad<br/>
              ✓ Monitoreo automático de costos<br/>
              ✓ Simulaciones de flujo de caja
            </div>
          </div>
          
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">👥</div>
              <h3 className="text-2xl font-headline text-lavender-light">
                Copiloto Talento IA
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">Horarios Predictivos:</span> Optimiza personal según tráfico previsto. 
              <span className="font-lato-bold">Reclutamiento Inteligente:</span> Conecta candidatos ideales por IA. 
              <span className="font-lato-bold">Capacitación Adaptativa:</span> Planes personalizados por empleado.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Planificación automática de horarios<br/>
              ✓ Matching inteligente de candidatos<br/>
              ✓ Capacitación personalizada por IA
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📊</div>
              <h3 className="text-2xl font-headline text-lavender-light">
                Copiloto Operaciones IA
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">BI Aumentado:</span> Transforma datos en recomendaciones. 
              <span className="font-lato-bold">Hiper-Personalización:</span> Ofertas únicas por cliente. 
              <span className="font-lato-bold">Marketing Predictivo:</span> Anticipa comportamiento de clientes.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Business Intelligence automatizado<br/>
              ✓ Programas de lealtad personalizados<br/>
              ✓ Campañas de retención predictivas
            </div>
          </div>
          
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🍽️</div>
              <h3 className="text-2xl font-headline text-lavender-light">
                Copiloto Menú IA
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">Ingeniería de Menú:</span> Simula impacto financiero de cambios. 
              <span className="font-lato-bold">Inventario Predictivo:</span> Previene escasez automáticamente. 
              <span className="font-lato-bold">Optimización Delivery:</span> Mejora calidad en entregas.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Simulación de rentabilidad por plato<br/>
              ✓ Pronósticos de demanda por ingrediente<br/>
              ✓ Recomendaciones de empaque inteligente
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;