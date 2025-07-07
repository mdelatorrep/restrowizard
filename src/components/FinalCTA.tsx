import React from 'react';

const FinalCTA = () => {
  return (
    <section id="cta-final" className="py-20 bg-purple-intense text-off-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-headline mb-4">
          ¿Listo para descubrir el mago que tu negocio necesita?
        </h2>
        <p className="max-w-2xl mx-auto text-lg font-lato-light mb-8">
          La magia no está en trabajar más duro, sino en trabajar de forma más inteligente. 
          Deja que RestroWizard sea tu guía.
        </p>
        <button 
          onClick={() => {
            const user = null; // This will be replaced by proper auth check
            if (user) {
              window.location.href = '/diagnosis';
            } else {
              window.location.href = '/auth';
            }
          }}
          className="bg-card text-primary font-lato-bold text-xl px-8 py-4 rounded-lg shadow-xl transform hover:scale-105 transition-smooth inline-block"
        >
          Iniciar mi Transformación Ahora
        </button>
      </div>
    </section>
  );
};

export default FinalCTA;