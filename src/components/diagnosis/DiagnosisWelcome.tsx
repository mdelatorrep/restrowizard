import { Brain, BarChart3, Target } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
export const DiagnosisWelcome = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen bg-card p-4 md:p-8">
    <div className="container mx-auto max-w-4xl">
      <div className="text-center bg-background p-8 md:p-12 rounded-2xl shadow-xl">
        <div className="text-5xl text-secondary mb-4">✨</div>
        <h1 className="text-3xl md:text-5xl font-headline font-bold text-primary mb-4">
          Descubre el Nivel de Madurez de tu Restaurante
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-lato-light">
          Este diagnóstico de 5 minutos, basado en nuestro <span className="font-lato-bold">Modelo de Madurez 2.0</span>,
          te revelará tus fortalezas y las áreas clave de oportunidad para transformar tu rentabilidad.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-5 w-5 text-primary" />
            <span>Análisis con IA</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Benchmark vs Industria</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-5 w-5 text-primary" />
            <span>Plan de Acción Personalizado</span>
          </div>
        </div>
        <button
          onClick={onStart}
          className="bg-primary text-primary-foreground font-lato-bold text-xl px-10 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          Iniciar Diagnóstico <ArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  </div>
);
