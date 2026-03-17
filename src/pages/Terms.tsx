import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const Terms = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Términos y Condiciones | RestroWizard" description="Términos y condiciones de uso de la plataforma RestroWizard." canonical="https://restrowizard.lovable.app/terms" />
    <Header />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-6 max-w-3xl prose prose-gray">
        <h1 className="text-3xl font-headline text-foreground">Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground mb-6">Última actualización: Marzo 2026</p>
        <h2>1. Aceptación de los Términos</h2>
        <p>Al acceder y usar RestroWizard, aceptas estar sujeto a estos términos y condiciones de servicio.</p>
        <h2>2. Descripción del Servicio</h2>
        <p>RestroWizard es una plataforma tecnológica que ofrece herramientas de gestión con IA para la industria gastronómica, incluyendo módulos de diagnóstico, operaciones, finanzas, talento y más.</p>
        <h2>3. Cuenta de Usuario</h2>
        <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Debes proporcionar información precisa y actualizada.</p>
        <h2>4. Uso Aceptable</h2>
        <p>Te comprometes a usar la plataforma de manera lícita y conforme a estos términos. Queda prohibido el uso para actividades ilegales o no autorizadas.</p>
        <h2>5. Propiedad Intelectual</h2>
        <p>Todo el contenido, diseño, código y marca de RestroWizard son propiedad de sus creadores y están protegidos por leyes de propiedad intelectual.</p>
        <h2>6. Limitación de Responsabilidad</h2>
        <p>RestroWizard no será responsable por daños indirectos derivados del uso de la plataforma. Las recomendaciones de IA son orientativas y no sustituyen el juicio profesional.</p>
        <h2>7. Contacto</h2>
        <p>Para consultas: <a href="mailto:hola@restrowizard.com" className="text-primary">hola@restrowizard.com</a></p>
      </div>
    </section>
    <Footer />
  </div>
);

export default Terms;
