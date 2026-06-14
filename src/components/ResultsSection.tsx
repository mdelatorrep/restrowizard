/**
 * F-02: Reemplazo de afirmaciones no sustentadas.
 *
 * El landing original mostraba métricas inventadas ("+500 restaurantes",
 * "-12% Prime Cost", "+23% rentabilidad"). Hasta tener datos verificables
 * agregados de cuentas reales, mostramos un mensaje honesto que enmarca
 * lo que la plataforma mide, sin prometer resultados que no podemos probar.
 */

const capabilities = [
  { label: 'Prime Cost', description: 'monitorizado en tiempo real' },
  { label: 'Rotación', description: 'medida con turnos y desempeño' },
  { label: 'Margen', description: 'calculado plato por plato' },
  { label: 'Sostenibilidad', description: 'huella de carbono e insumos' },
];

const ResultsSection = () => {
  return (
    <section className="py-32 bg-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline text-purple-intense leading-tight">
            Lo que medimos por ti.
          </h2>
          <p className="text-dark-gray font-lato-light mt-4">
            Indicadores que la plataforma calcula sobre tu operación, sin promesas vacías.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {capabilities.map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl md:text-3xl font-headline text-purple-intense mb-2">
                {item.label}
              </p>
              <p className="text-dark-gray font-lato-light text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
