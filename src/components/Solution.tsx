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
            Tu Restaurante Funcionando Como Relojería en 3 Pasos
          </h2>
          <p className="max-w-4xl mx-auto text-lg text-soft-black font-lato-regular">
            No más adivinar ni improvisar. <span className="font-lato-bold">RestroWizard automatiza las 4 áreas críticas</span> 
            de tu negocio para que funcione sin tu presencia constante. 
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
                Paso 1: Diagnóstico Completo de tu Negocio
              </h3>
              <p className="text-soft-black font-lato-regular">
                Nuestro <span className="font-lato-bold">Modelo de Madurez RestroWizard™</span> evalúa tus 4 áreas críticas: 
                finanzas, personal, operaciones y menú. <span className="font-lato-bold">En 15 minutos conoces tu estado real</span> 
                y las oportunidades exactas de crecimiento.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-medium text-white w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-white shadow-lg">
                <FontAwesomeIcon icon={faMapLocationDot} />
              </div>
              <h3 className="text-xl font-headline text-purple-intense mb-2">
                Paso 2: Activación de Sistemas Inteligentes
              </h3>
              <p className="text-soft-black font-lato-regular">
                Basado en tu diagnóstico, activamos los módulos que necesitas: 
                <span className="font-lato-bold">Control Financiero, Gestión de Personal, Análisis de Operaciones y Optimización de Menú</span>. 
                Cada uno automatiza decisiones clave con recomendaciones precisas.
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
                RestroWizard trabaja 24/7: predice tu rentabilidad, optimiza horarios de personal, atrae clientes ideales, 
                y gestiona tu inventario automáticamente. <span className="font-lato-bold">Tú ves los resultados, no el trabajo.</span> 
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