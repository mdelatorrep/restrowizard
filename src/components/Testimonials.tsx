import { Quote } from 'lucide-react';
/**
 * F-02: Testimonios.
 *
 * Los testimonios anteriores tenían nombres y ciudades reales (Carlos Valderrama
 * — CDMX, etc.) que no corresponden a clientes reales: riesgo de publicidad
 * engañosa. Hasta tener piloto y consentimiento explícito por escrito,
 * mostramos un placeholder honesto.
 */
const Testimonials = () => {
  return (
    <section id="testimonios" className="py-32 bg-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Quote className="text-3xl text-lavender-light mb-6" />
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline text-purple-intense leading-tight">
            Pronto: voces reales de cocinas reales.
          </h2>
          <p className="text-dark-gray font-lato-regular text-lg leading-relaxed mt-6">
            Estamos en piloto privado con un grupo selecto de restaurantes en LatAm.
            Publicaremos sus historias — con nombre, foto y cifras — solo cuando
            tengamos su autorización por escrito. Mientras tanto, prueba la
            plataforma y mide los resultados en tu propia operación.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
