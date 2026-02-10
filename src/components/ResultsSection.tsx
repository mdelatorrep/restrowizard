const metrics = [
  { value: '-12%', label: 'Prime Cost promedio' },
  { value: '-30%', label: 'Rotación de personal' },
  { value: '+23%', label: 'Rentabilidad neta' },
  { value: '+500', label: 'Restaurantes activos' },
];

const ResultsSection = () => {
  return (
    <section className="py-32 bg-off-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline text-purple-intense leading-tight">
            Resultados reales.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {metrics.map((metric, i) => (
            <div key={i} className="text-center">
              <p className="text-5xl md:text-6xl font-headline text-purple-intense mb-2">
                {metric.value}
              </p>
              <p className="text-dark-gray font-lato-light text-sm md:text-base">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
