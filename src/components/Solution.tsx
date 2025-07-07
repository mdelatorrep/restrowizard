import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faMapLocationDot, faRocket } from '@fortawesome/free-solid-svg-icons';

const Solution = () => {
  return (
    <section 
      id="solucion" 
      className="py-20"
      style={{ background: 'linear-gradient(180deg, #EFE2F2 0%, #f5eaf7 100%)' }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-purple-intense mb-4">
            Nuestra Magia: Un Plan Claro para la Rentabilidad
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-soft-black font-light">
            RestroWizard no es otro software, es tu socio estratégico. Usamos IA para darte una 
            hoja de ruta clara hacia el éxito en 3 simples pasos.
          </p>
        </div>
        
        <div className="relative">
          {/* Connection line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-lavender-light/50 -translate-y-1/2"></div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="text-center">
              <div className="bg-purple-medium text-white w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-white shadow-lg">
                <FontAwesomeIcon icon={faWandMagicSparkles} />
              </div>
              <h3 className="text-xl font-bold font-headline mb-2 text-purple-intense">
                Paso 1: Diagnóstico Inteligente
              </h3>
              <p className="text-soft-black font-light">
                Nuestro <span className="font-bold">Modelo de Madurez RestroWizard™</span> patentado 
                analiza con IA tus finanzas, operaciones y talento para revelarte el estado real de tu negocio.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-medium text-white w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-white shadow-lg">
                <FontAwesomeIcon icon={faMapLocationDot} />
              </div>
              <h3 className="text-xl font-bold font-headline mb-2 text-purple-intense">
                Paso 2: Plan de Acción Personalizado
              </h3>
              <p className="text-soft-black font-light">
                La IA genera un plan de acción específico para ti, con acciones claras y priorizadas 
                para cerrar brechas y llevar tu restaurante al siguiente nivel.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-medium text-white w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-white shadow-lg">
                <FontAwesomeIcon icon={faRocket} />
              </div>
              <h3 className="text-xl font-bold font-headline mb-2 text-purple-intense">
                Paso 3: Activación de Copilotos IA
              </h3>
              <p className="text-soft-black font-light">
                Habilitamos los <span className="font-bold">Copilotos IA</span> que necesitas para 
                ejecutar tu plan, automatizando la mejora continua y liberándote para enfocarte en la gastronomía.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;