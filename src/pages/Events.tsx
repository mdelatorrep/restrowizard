import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, Star, Clock, Search, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'event' | 'venue' | 'service'>('event');
  const { user } = useAuth();
  const navigate = useNavigate();

  const eventCategories = [
    { id: "all", name: "Todos", color: "bg-gray-100 text-gray-800" },
    { id: "corporate", name: "Corporativo", color: "bg-blue-100 text-blue-800" },
    { id: "wedding", name: "Bodas", color: "bg-pink-100 text-pink-800" },
    { id: "birthday", name: "Cumpleaños", color: "bg-yellow-100 text-yellow-800" },
    { id: "graduation", name: "Graduaciones", color: "bg-green-100 text-green-800" }
  ];

  const handleAction = (type: 'event' | 'venue' | 'service') => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setDialogType(type);
    setCreateDialogOpen(true);
  };

  const handleDialogAction = () => {
    setCreateDialogOpen(false);
    
    if (dialogType === 'event') {
      toast.info("Para organizar eventos, contacta con un restaurante o consultor");
    } else if (dialogType === 'venue') {
      navigate("/r/settings");
      toast.success("Configura tu espacio desde la configuración de tu restaurante");
    } else if (dialogType === 'service') {
      toast.info("Próximamente: Marketplace de servicios para eventos");
    }
  };

  const getDialogContent = () => {
    switch (dialogType) {
      case 'event':
        return {
          title: "Organizar un Evento",
          description: "Para organizar un evento, te recomendamos contactar directamente con los restaurantes o espacios de tu interés.",
          buttonText: "Entendido"
        };
      case 'venue':
        return {
          title: "Publicar tu Espacio",
          description: "Si eres propietario de un restaurante, puedes configurar tu espacio para eventos desde el panel de configuración.",
          buttonText: "Ir a Configuración"
        };
      case 'service':
        return {
          title: "Ofrecer Servicios",
          description: "El marketplace de servicios para eventos estará disponible próximamente. Te notificaremos cuando esté listo.",
          buttonText: "Entendido"
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Marketplace de Eventos RestroWizard
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Conecta restaurantes, proveedores de servicios y organizadores de eventos
            en una sola plataforma
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => handleAction('event')} size="lg" className="bg-primary text-primary-foreground">
              <Calendar className="mr-2 h-5 w-5" />
              Organizar Evento
            </Button>
            <Button onClick={() => handleAction('venue')} variant="outline" size="lg">
              <MapPin className="mr-2 h-5 w-5" />
              Publicar Espacio
            </Button>
            <Button onClick={() => handleAction('service')} variant="outline" size="lg">
              <Users className="mr-2 h-5 w-5" />
              Ofrecer Servicios
            </Button>
          </div>
        </section>

        {/* Dialog for actions */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogContent.title}</DialogTitle>
              <DialogDescription>
                {dialogContent.description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleDialogAction}>
                {dialogContent.buttonText}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search and Filters */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar espacios, servicios o proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {eventCategories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`cursor-pointer hover:opacity-80 ${
                  selectedCategory === category.id ? "" : category.color
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </section>

        {/* Main Content Tabs */}
        <Tabs defaultValue="venues" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="venues">Espacios</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
          </TabsList>

          {/* Venues Tab */}
          <TabsContent value="venues" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Espacios Disponibles</h2>
              <Button onClick={() => handleAction('venue')} variant="outline">
                Publicar mi espacio
              </Button>
            </div>
            
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Próximamente</h3>
              <p className="text-muted-foreground mb-6">
                Los espacios para eventos estarán disponibles pronto. ¡Sé el primero en publicar!
              </p>
              <Button onClick={() => handleAction('venue')} size="lg">
                Publicar mi espacio
              </Button>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Servicios para Eventos</h2>
              <Button onClick={() => handleAction('service')} variant="outline">
                Ofrecer servicios
              </Button>
            </div>
            
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Próximamente</h3>
              <p className="text-muted-foreground mb-6">
                El marketplace de servicios estará disponible pronto. ¡Regístrate para ser notificado!
              </p>
              <Button onClick={() => handleAction('service')} size="lg">
                Ofrecer mis servicios
              </Button>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Eventos Próximos</h2>
              <Button onClick={() => handleAction('event')}>
                Crear Evento
              </Button>
            </div>
            
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">¡Organiza tu primer evento!</h3>
              <p className="text-muted-foreground mb-6">
                Encuentra el espacio perfecto y los mejores servicios para tu evento
              </p>
              <Button onClick={() => handleAction('event')} size="lg">
                Comenzar a organizar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
