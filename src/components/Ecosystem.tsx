import React from 'react';

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="py-20 bg-dark-gray text-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline mb-4">
            4 Módulos Especializados: Tu Equipo de Gestión Automatizado
          </h2>
          <p className="max-w-4xl mx-auto text-lg font-lato-light">
            Cada módulo está diseñado para resolver problemas específicos de tu restaurante. 
            <span className="font-lato-bold">Trabajan unidos para maximizar tu rentabilidad</span> mientras tú te enfocas en la pasión: la gastronomía.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">💰</div>
               <h3 className="text-2xl font-headline text-lavender-light">
                Control Financiero Inteligente
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">Predice tu Rentabilidad:</span> Sabrás si serás rentable el próximo mes antes de que termine este. 
              <span className="font-lato-bold">Detecta Fugas de Dinero:</span> Te alerta cuando algo está costando más de lo normal. 
              <span className="font-lato-bold">Precios Inteligentes:</span> Te sugiere cuándo subir o bajar precios para vender más.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Proyecciones de rentabilidad confiables<br/>
              ✓ Alertas automáticas de costos elevados<br/>
              ✓ Simulaciones de escenarios financieros
            </div>
          </div>
          
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">👥</div>
               <h3 className="text-2xl font-headline text-lavender-light">
                Gestión de Personal Eficiente
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">Horarios Optimizados:</span> Programa al personal perfecto para cada momento de alta demanda. 
              <span className="font-lato-bold">Encuentra Talento:</span> Te conecta con candidatos que realmente funcionarán en tu equipo. 
              <span className="font-lato-bold">Capacitación Personalizada:</span> Planes de entrenamiento únicos para cada empleado.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Horarios basados en demanda real<br/>
              ✓ Conexión con candidatos ideales<br/>
              ✓ Programas de capacitación efectivos
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📊</div>
               <h3 className="text-2xl font-headline text-lavender-light">
                Análisis de Operaciones Avanzado
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">Datos que Hablan:</span> Convierte tus ventas en recomendaciones claras de qué hacer. 
              <span className="font-lato-bold">Clientes Felices:</span> Ofertas personalizadas que hacen que regresen una y otra vez. 
              <span className="font-lato-bold">Marketing Automático:</span> Identifica quién puede dejar de venir y los recupera.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Reportes que te dicen exactamente qué hacer<br/>
              ✓ Programas de lealtad que realmente funcionan<br/>
              ✓ Recuperación automática de clientes perdidos
            </div>
          </div>
          
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🍽️</div>
               <h3 className="text-2xl font-headline text-lavender-light">
                Optimización de Menú e Inventario
              </h3>
            </div>
            <p className="font-lato-light flex-grow mb-4">
              <span className="font-lato-bold">Menús Rentables:</span> Te dice exactamente cuánto ganarás antes de cambiar cualquier plato. 
              <span className="font-lato-bold">Nunca te Quedas Sin Stock:</span> Predice qué necesitarás y cuándo pedirlo. 
              <span className="font-lato-bold">Delivery Perfecto:</span> Garantiza que tu comida llegue como recién salida de la cocina.
            </p>
            <div className="text-sm text-lavender-light/80">
              ✓ Simulador de rentabilidad por cada plato<br/>
              ✓ Predicciones precisas de inventario<br/>
              ✓ Empaques optimizados para delivery
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;