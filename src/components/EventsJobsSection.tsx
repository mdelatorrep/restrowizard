import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Briefcase, MapPin, Clock, Users } from 'lucide-react';

const EventsJobsSection = () => {
  const navigate = useNavigate();

  const featuredEvents = [
    {
      id: 1,
      title: "Workshop: Gestión Financiera para Restaurantes",
      date: "15 Feb 2024",
      time: "10:00 AM",
      location: "Online",
      attendees: 45
    },
    {
      id: 2,
      title: "Networking Gastronómico",
      date: "22 Feb 2024", 
      time: "7:00 PM",
      location: "Madrid, España",
      attendees: 120
    }
  ];

  const featuredJobs = [
    {
      id: 1,
      title: "Chef de Cocina",
      restaurant: "Restaurante El Jardín",
      location: "Barcelona",
      type: "Tiempo Completo",
      salary: "€35,000 - €45,000"
    },
    {
      id: 2,
      title: "Gerente de Restaurante",
      restaurant: "La Mesa Redonda",
      location: "Valencia",
      type: "Tiempo Completo", 
      salary: "€40,000 - €55,000"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-headline mb-4 text-foreground">
            Conecta, Aprende y Crece
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Descubre eventos exclusivos para profesionales gastronómicos y encuentra las mejores oportunidades laborales en el sector.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Events Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-headline text-foreground">Próximos Eventos</h3>
            </div>
            
            <div className="space-y-4">
              {featuredEvents.map((event) => (
                <div key={event.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h4 className="font-semibold text-lg text-card-foreground mb-3">{event.title}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} participantes confirmados</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/events')}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ver Todos los Eventos
            </button>
          </div>

          {/* Jobs Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Briefcase className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-2xl font-headline text-foreground">Empleos Destacados</h3>
            </div>
            
            <div className="space-y-4">
              {featuredJobs.map((job) => (
                <div key={job.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h4 className="font-semibold text-lg text-card-foreground mb-2">{job.title}</h4>
                  <p className="text-primary font-medium mb-3">{job.restaurant}</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.type}</span>
                    </div>
                    <div className="font-semibold text-foreground">
                      {job.salary}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/jobs')}
              className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors"
            >
              Ver Todas las Ofertas
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsJobsSection;