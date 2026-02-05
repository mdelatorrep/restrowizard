 import { Link, useParams } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { 
   UtensilsCrossed, CalendarDays, Truck, Gift, MessageSquare, Home
 } from 'lucide-react';
 
 interface PublicHeaderProps {
   restaurantName: string;
   logoUrl?: string | null;
   primaryFont?: string | null;
   showMenu?: boolean;
   showReservations?: boolean;
   showDelivery?: boolean;
   showLoyalty?: boolean;
   showFeedback?: boolean;
   currentSection?: 'home' | 'menu' | 'reservas' | 'domicilios' | 'fidelidad' | 'experiencia';
 }
 
 export function PublicHeader({
   restaurantName,
   logoUrl,
   primaryFont,
   showMenu = true,
   showReservations = true,
   showDelivery = true,
   showLoyalty = true,
   showFeedback = true,
   currentSection = 'home',
 }: PublicHeaderProps) {
   const { slug } = useParams<{ slug: string }>();
   const basePath = `/p/${slug}`;
 
   const navItems = [
     { key: 'home', label: 'Inicio', icon: Home, path: basePath, show: true },
     { key: 'menu', label: 'Menú', icon: UtensilsCrossed, path: `${basePath}/menu`, show: showMenu },
     { key: 'reservas', label: 'Reservas', icon: CalendarDays, path: `${basePath}/reservas`, show: showReservations },
     { key: 'domicilios', label: 'Domicilios', icon: Truck, path: `${basePath}/domicilios`, show: showDelivery },
     { key: 'fidelidad', label: 'Fidelidad', icon: Gift, path: `${basePath}/fidelidad`, show: showLoyalty },
     { key: 'experiencia', label: 'Calificar', icon: MessageSquare, path: `${basePath}/experiencia`, show: showFeedback },
   ];
 
   return (
     <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
       <div className="container mx-auto px-4">
         <div className="flex items-center justify-between h-16">
           <Link to={basePath} className="flex items-center gap-3">
             {logoUrl && (
               <img src={logoUrl} alt={restaurantName} className="h-10 w-auto" />
             )}
             <span 
               className="font-bold text-xl hidden sm:inline" 
               style={{ fontFamily: primaryFont || undefined }}
             >
               {restaurantName}
             </span>
           </Link>
 
           <div className="flex items-center gap-1 md:gap-2">
             {navItems.filter(item => item.show).map(item => (
               <Button
                 key={item.key}
                 variant={currentSection === item.key ? 'default' : 'ghost'}
                 size="sm"
                 asChild
                 className="h-9"
               >
                 <Link to={item.path}>
                   <item.icon className="h-4 w-4 md:mr-1.5" />
                   <span className="hidden md:inline">{item.label}</span>
                 </Link>
               </Button>
             ))}
           </div>
         </div>
       </div>
     </nav>
   );
 }