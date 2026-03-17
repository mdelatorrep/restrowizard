import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="text-center max-w-lg mx-auto">
          <div className="text-8xl font-headline text-primary/20 mb-4">404</div>
          <h1 className="text-3xl font-headline text-foreground mb-3">
            Página no encontrada
          </h1>
          <p className="text-muted-foreground font-lato-regular mb-8">
            Lo sentimos, la página que buscas no existe o fue movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver atrás
            </Button>
            <Button onClick={() => navigate('/')} className="gap-2">
              <Home className="h-4 w-4" /> Ir al inicio
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-2 justify-center text-sm">
            <Button variant="link" size="sm" onClick={() => navigate('/jobs')}>RestroJobs</Button>
            <Button variant="link" size="sm" onClick={() => navigate('/learn')}>RestroLearn</Button>
            <Button variant="link" size="sm" onClick={() => navigate('/services')}>RestroServices</Button>
            <Button variant="link" size="sm" onClick={() => navigate('/growth')}>RestroGrowth</Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
