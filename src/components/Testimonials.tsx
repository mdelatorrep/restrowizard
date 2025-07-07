import React from 'react';

const Testimonials = () => {
  return (
    <section className="py-20 bg-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline text-purple-intense">
            La Transformación es Real
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <p className="text-soft-black font-lato-medium-italic mb-6">
              "Estaba ahogado en hojas de cálculo y no entendía por qué no ganaba más. 
              RestroWizard me dio un diagnóstico claro y un plan. En 3 meses, mi rentabilidad 
              subió un 15%. Es magia de verdad."
            </p>
            <div className="flex items-center">
              <img 
                src="https://placehold.co/60x60/93339E/EFE2F2?text=CV" 
                alt="Foto de Carlos Valderrama" 
                className="w-14 h-14 rounded-full mr-4 border-2 border-lavender-light"
              />
              <div>
                <p className="font-lato-bold text-purple-intense">Carlos Valderrama</p>
                <p className="text-sm text-dark-gray font-lato-regular">Dueño de "La Sazón del Abuelo"</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <p className="text-soft-black font-lato-medium-italic mb-6">
              "Gestionar el personal era mi mayor dolor de cabeza. Con RestroTalent, no solo 
              contratamos mejor, sino que la formación de RestroLearn ha hecho que mi equipo 
              se sienta valorado y se quede."
            </p>
            <div className="flex items-center">
              <img 
                src="https://placehold.co/60x60/93339E/EFE2F2?text=SM" 
                alt="Foto de Sofía Mendoza" 
                className="w-14 h-14 rounded-full mr-4 border-2 border-lavender-light"
              />
              <div>
                <p className="font-lato-bold text-purple-intense">Sofía Mendoza</p>
                <p className="text-sm text-dark-gray font-lato-regular">Gerente de "Urbano Grill"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;