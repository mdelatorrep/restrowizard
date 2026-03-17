import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Política de Privacidad | RestroWizard" description="Conoce cómo protegemos tus datos personales en RestroWizard." canonical="https://restrowizard.lovable.app/privacy" />
    <Header />
    <section className="pt-28 pb-16">
      <div className="container mx-auto px-6 max-w-3xl prose prose-gray">
        <h1 className="text-3xl font-headline text-foreground">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-6">Última actualización: Marzo 2026</p>
        <h2>1. Información que recopilamos</h2>
        <p>Recopilamos información que nos proporcionas directamente al crear una cuenta, como tu nombre, correo electrónico, nombre del restaurante y datos de operación.</p>
        <h2>2. Uso de la información</h2>
        <p>Utilizamos tu información para proveer, personalizar y mejorar nuestros servicios, incluyendo diagnósticos con IA, recomendaciones operativas y comunicaciones relevantes.</p>
        <h2>3. Protección de datos</h2>
        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra acceso no autorizado, alteración o destrucción.</p>
        <h2>4. Compartir información</h2>
        <p>No vendemos ni compartimos tu información personal con terceros para fines de marketing. Solo compartimos datos cuando es necesario para proveer nuestros servicios.</p>
        <h2>5. Tus derechos</h2>
        <p>Tienes derecho a acceder, rectificar y eliminar tus datos personales. Para ejercer estos derechos, contáctanos a hola@restrowizard.com.</p>
        <h2>6. Contacto</h2>
        <p>Para consultas sobre privacidad: <a href="mailto:hola@restrowizard.com" className="text-primary">hola@restrowizard.com</a></p>
      </div>
    </section>
    <Footer />
  </div>
);

export default Privacy;
