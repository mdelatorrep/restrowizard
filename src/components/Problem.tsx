import React from 'react';

const Problem = () => {
  return (
    <section id="problema" className="py-20 bg-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline text-purple-intense mb-4">
            La Crisis Silenciosa que Mata Restaurantes
          </h2>
          <p className="max-w-4xl mx-auto text-lg text-soft-black font-lato-regular">
            Mientras cocinas con pasión, <span className="font-lato-bold">4 enemigos invisibles</span> devoran tu rentabilidad. 
            El 97% lucha con costos, el 45% no encuentra personal, el 79% no atrae clientes suficientes, 
            y el 77% batalla con inventario. <span className="font-lato-bold">No tienes que seguir peleando solo.</span>
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <div className="text-4xl text-purple-medium mb-3">💸</div>
            <h3 className="text-lg font-headline text-purple-intense mb-2">
              Crisis Financiera
            </h3>
            <p className="text-sm text-soft-black font-lato-regular">
              <span className="font-lato-bold">97%</span> lucha con costos de alimentos, 
              <span className="font-lato-bold">38%</span> no es rentable, 
              <span className="font-lato-bold">43%</span> tiene deudas
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <div className="text-4xl text-purple-medium mb-3">👥</div>
            <h3 className="text-lg font-headline text-purple-intense mb-2">
              Escasez de Talento
            </h3>
            <p className="text-sm text-soft-black font-lato-regular">
              <span className="font-lato-bold">45%</span> no encuentra personal, 
              <span className="font-lato-bold">67%</span> vacantes en cocina, 
              <span className="font-lato-bold">98%</span> lucha con costos laborales
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <div className="text-4xl text-purple-medium mb-3">📊</div>
            <h3 className="text-lg font-headline text-purple-intense mb-2">
              Operaciones Caóticas
            </h3>
            <p className="text-sm text-soft-black font-lato-regular">
              <span className="font-lato-bold">79%</span> lucha por atraer clientes, 
              <span className="font-lato-bold">81%</span> no tiene programa de lealtad, 
              sin datos para decidir
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <div className="text-4xl text-purple-medium mb-3">📦</div>
            <h3 className="text-lg font-headline text-purple-intense mb-2">
              Inventario Ineficiente
            </h3>
            <p className="text-sm text-soft-black font-lato-regular">
              <span className="font-lato-bold">77%</span> problemas de suministros, 
              <span className="font-lato-bold">86%</span> quiere más variedad, 
              merma descontrolada
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;