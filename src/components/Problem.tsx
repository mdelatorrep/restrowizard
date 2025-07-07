import React from 'react';

const Problem = () => {
  return (
    <section id="problema" className="py-20 bg-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline text-purple-intense mb-4">
            ¿Tu pasión se ahoga en el caos diario?
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-soft-black font-lato-regular">
            Dirigir un restaurante es una tormenta perfecta. Estás atrapado en un{' '}
            <span className="font-lato-bold">torniquete de rentabilidad</span>: la demanda se estanca 
            mientras tus costos se disparan sin control.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <div className="text-5xl text-purple-medium mb-4">📉</div>
            <h3 className="text-xl font-headline text-purple-intense mb-2">
              Márgenes que Desaparecen
            </h3>
            <p className="text-soft-black font-lato-regular">
              El <span className="font-lato-bold">59%</span> de los restaurantes en mercados como Brasil 
              opera sin generar lucro. La rentabilidad se evapora antes de que te des cuenta.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <div className="text-5xl text-purple-medium mb-4">🚶‍♂️</div>
            <h3 className="text-xl font-headline text-purple-intense mb-2">
              Fuga de Talento
            </h3>
            <p className="text-soft-black font-lato-regular">
              La rotación de personal alcanza un alarmante <span className="font-lato-bold">80%</span>, 
              generando costos masivos y afectando la calidad de tu servicio.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <div className="text-5xl text-purple-medium mb-4">🧭</div>
            <h3 className="text-xl font-headline text-purple-intense mb-2">
              Navegando a Ciegas
            </h3>
            <p className="text-soft-black font-lato-regular">
              El <span className="font-lato-bold">94%</span> de los dueños no tiene formación en gestión. 
              Tomas decisiones cruciales sin datos fiables.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;