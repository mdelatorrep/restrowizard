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
          <h2 className="text-3xl md:text-4xl font-headline text-purple-intense mb-4">
            4 Copilotos IA que Transforman Todo en 3 Pasos
          </h2>
          <p className="max-w-4xl mx-auto text-lg text-soft-black font-lato-regular">
            No más adivinar. <span className="font-lato-bold">Cada uno de los 4 enemigos tiene su copiloto IA especializado</span> 
            que automatiza la solución mientras tú te enfocas en la gastronomía. 
            <span className="font-lato-bold">Resultados medibles desde el primer mes.</span>
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
              <h3 className="text-xl font-headline text-purple-intense mb-2">
                Paso 1: Diagnóstico 360° con IA
              </h3>
              <p className="text-soft-black font-lato-regular">
                Nuestro <span className="font-lato-bold">Modelo de Madurez RestroWizard™</span> evalúa tus 4 áreas críticas: 
                finanzas, talento, operaciones y menú/inventario. <span className="font-lato-bold">En 15 minutos conoces tu estado real</span> 
                y el potencial de crecimiento exacto.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-medium text-white w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-white shadow-lg">
                <FontAwesomeIcon icon={faMapLocationDot} />
              </div>
              <h3 className="text-xl font-headline text-purple-intense mb-2">
                Paso 2: Activación de Copilotos IA
              </h3>
              <p className="text-soft-black font-lato-regular">
                Basado en tu diagnóstico, activamos los copilotos que necesitas: 
                <span className="font-lato-bold">Finanzas IA, Talento IA, Operaciones IA y Menú IA</span>. 
                Cada uno automatiza su área específica con recomendaciones precisas.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-medium text-white w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-white shadow-lg">
                <FontAwesomeIcon icon={faRocket} />
              </div>
              <h3 className="text-xl font-headline text-purple-intense mb-2">
                Paso 3: Transformación Automatizada
              </h3>
              <p className="text-soft-black font-lato-regular">
                Los copilotos trabajan 24/7: predicen rentabilidad, optimizan horarios, personalizan marketing, 
                y gestionan inventario. <span className="font-lato-bold">Tú ves los resultados, no el trabajo.</span> 
                Libertad total para crear experiencias gastronómicas increíbles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;