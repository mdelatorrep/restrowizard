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

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with real data from Supabase
  const venues = [
    {
      id: "1",
      name: "Restaurante El Jardín",
      location: "Zona Rosa, Bogotá",
      capacity: 150,
      pricePerHour: 250000,
      rating: 4.8,
      images: ["/placeholder.svg"],
      amenities: ["parking", "sound_system", "wifi", "air_conditioning"]
    },
    {
      id: "2", 
      name: "Terraza Vista",
      location: "Chapinero, Bogotá",
      capacity: 80,
      pricePerHour: 180000,
      rating: 4.6,
      images: ["/placeholder.svg"],
      amenities: ["outdoor_space", "wifi", "catering_kitchen"]
    }
  ];

  const services = [
    {
      id: "1",
      providerName: "Banda Los Alegres",
      serviceName: "Música en Vivo - Vallenato",
      category: "music",
      price: 800000,
      priceType: "fixed",
      rating: 4.9,
      location: "Bogotá",
      images: ["/placeholder.svg"]
    },
    {
      id: "2",
      providerName: "DJ Pro Events",
      serviceName: "DJ para Eventos Corporativos",
      category: "music", 
      price: 150000,
      priceType: "per_hour",
      rating: 4.7,
      location: "Bogotá",
      images: ["/placeholder.svg"]
    }
  ];

  const eventCategories = [
    { id: "all", name: "Todos", color: "bg-gray-100 text-gray-800" },
    { id: "corporate", name: "Corporativo", color: "bg-blue-100 text-blue-800" },
    { id: "wedding", name: "Bodas", color: "bg-pink-100 text-pink-800" },
    { id: "birthday", name: "Cumpleaños", color: "bg-yellow-100 text-yellow-800" },
    { id: "graduation", name: "Graduaciones", color: "bg-green-100 text-green-800" }
  ];

  const handleCreateEvent = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/events/create");
  };

  const handlePublishVenue = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/venues/create");
  };

  const handlePublishService = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/services/create");
  };

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
            <Button onClick={handleCreateEvent} size="lg" className="bg-primary text-primary-foreground">
              <Calendar className="mr-2 h-5 w-5" />
              Organizar Evento
            </Button>
            <Button onClick={handlePublishVenue} variant="outline" size="lg">
              <MapPin className="mr-2 h-5 w-5" />
              Publicar Espacio
            </Button>
            <Button onClick={handlePublishService} variant="outline" size="lg">
              <Users className="mr-2 h-5 w-5" />
              Ofrecer Servicios
            </Button>
          </div>
        </section>

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
              <Button onClick={handlePublishVenue} variant="outline">
                Publicar mi espacio
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <img 
                      src={venue.images[0]} 
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{venue.name}</span>
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {venue.rating}
                      </div>
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {venue.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Capacidad:</span>
                        <span className="font-medium">{venue.capacity} personas</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Precio por hora:</span>
                        <span className="font-medium">${venue.pricePerHour.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {venue.amenities.slice(0, 3).map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          {amenity.replace("_", " ")}
                        </Badge>
                      ))}
                      {venue.amenities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{venue.amenities.length - 3} más
                        </Badge>
                      )}
                    </div>
                    
                    <Button className="w-full">Ver Detalles</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Servicios para Eventos</h2>
              <Button onClick={handlePublishService} variant="outline">
                Ofrecer servicios
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <img 
                      src={service.images[0]} 
                      alt={service.serviceName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span className="text-lg">{service.serviceName}</span>
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {service.rating}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Por: {service.providerName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ubicación:</span>
                        <span className="font-medium">{service.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Precio:</span>
                        <span className="font-medium">
                          ${service.price.toLocaleString()}
                          {service.priceType === "per_hour" && "/hora"}
                        </span>
                      </div>
                    </div>
                    
                    <Badge className="mb-4" variant="outline">
                      {service.category === "music" ? "Música" : service.category}
                    </Badge>
                    
                    <Button className="w-full">Contactar</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Eventos Próximos</h2>
              <Button onClick={handleCreateEvent}>
                Crear Evento
              </Button>
            </div>
            
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">¡Organiza tu primer evento!</h3>
              <p className="text-muted-foreground mb-6">
                Encuentra el espacio perfecto y los mejores servicios para tu evento
              </p>
              <Button onClick={handleCreateEvent} size="lg">
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