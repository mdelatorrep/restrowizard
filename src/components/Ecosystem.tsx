import React from 'react';

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="py-20 bg-dark-gray text-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline mb-4">
            Un Ecosistema Conectado para una Transformación Completa
          </h2>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <h3 className="text-2xl font-headline mb-4 text-lavender-light">
              RestroWizard (Copiloto Central)
            </h3>
            <p className="font-lato-light flex-grow">
              El Cerebro de tu Operación. Activa copilotos para finanzas, operaciones y marketing. 
              Optimiza costos, automatiza el inventario y predice la demanda para que nunca más 
              tomes una decisión a ciegas.
            </p>
            <a href="#" className="mt-4 font-lato-bold text-lavender-light hover:text-white transition-colors">
              Saber más →
            </a>
          </div>
          
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <h3 className="text-2xl font-headline mb-4 text-lavender-light">
              RestroTalent
            </h3>
            <p className="font-lato-light flex-grow">
              Enamora a tu Industria. Combate la crisis de talento con nuestro portal de empleo 
              inteligente (RestroJobs) y planes de formación a medida (RestroLearn) que reducen 
              la rotación y aumentan la lealtad.
            </p>
            <a href="#" className="mt-4 font-lato-bold text-lavender-light hover:text-white transition-colors">
              Saber más →
            </a>
          </div>
          
          <div className="bg-soft-black p-8 rounded-xl border border-purple-medium/50 shadow-lg flex flex-col">
            <h3 className="text-2xl font-headline mb-4 text-lavender-light">
              RestroServices
            </h3>
            <p className="font-lato-light flex-grow">
              El Marketplace Inteligente. Conecta tu sistema de compras con un mercado de 
              proveedores validados. Encuentra mejores precios, calidad y las opciones 
              sostenibles que tus clientes demandan.
            </p>
            <a href="#" className="mt-4 font-lato-bold text-lavender-light hover:text-white transition-colors">
              Saber más →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;