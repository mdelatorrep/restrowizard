 import { Link, useParams } from 'react-router-dom';
 import { Separator } from '@/components/ui/separator';
 import { Instagram, Facebook, Twitter, Globe } from 'lucide-react';
 
 interface PublicFooterProps {
   restaurantName: string;
   logoUrl?: string | null;
   socialLinks?: Record<string, string>;
   phone?: string | null;
   showMenu?: boolean;
   showReservations?: boolean;
   showDelivery?: boolean;
   showLoyalty?: boolean;
 }
 
 const SOCIAL_ICONS: Record<string, React.ElementType> = {
   instagram: Instagram,
   facebook: Facebook,
   twitter: Twitter,
   website: Globe,
 };
 
 export function PublicFooter({
   restaurantName,
   logoUrl,
   socialLinks = {},
   phone,
   showMenu = true,
   showReservations = true,
   showDelivery = true,
   showLoyalty = true,
 }: PublicFooterProps) {
   const { slug } = useParams<{ slug: string }>();
   const basePath = `/p/${slug}`;
 
   const footerLinks = [
     { label: 'Menú', path: `${basePath}/menu`, show: showMenu },
     { label: 'Reservas', path: `${basePath}/reservas`, show: showReservations },
     { label: 'Domicilios', path: `${basePath}/domicilios`, show: showDelivery },
     { label: 'Fidelidad', path: `${basePath}/fidelidad`, show: showLoyalty },
   ];
 
   return (
     <footer className="bg-muted/50 border-t mt-auto">
       <div className="container mx-auto px-4 py-12">
         <div className="grid md:grid-cols-3 gap-8">
           {/* Brand */}
           <div className="space-y-4">
             <div className="flex items-center gap-3">
               {logoUrl && (
                 <img src={logoUrl} alt={restaurantName} className="h-10 w-auto" />
               )}
               <span className="font-bold text-xl">{restaurantName}</span>
             </div>
             {phone && (
               <p className="text-muted-foreground">
                 Tel: <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
               </p>
             )}
           </div>
 
           {/* Links */}
           <div>
             <h4 className="font-semibold mb-4">Enlaces</h4>
             <ul className="space-y-2">
               {footerLinks.filter(l => l.show).map(link => (
                 <li key={link.path}>
                   <Link 
                     to={link.path} 
                     className="text-muted-foreground hover:text-foreground transition-colors"
                   >
                     {link.label}
                   </Link>
                 </li>
               ))}
             </ul>
           </div>
 
           {/* Social */}
           <div>
             <h4 className="font-semibold mb-4">Síguenos</h4>
             <div className="flex gap-3">
               {Object.entries(socialLinks).map(([platform, url]) => {
                 const Icon = SOCIAL_ICONS[platform] || Globe;
                 return (
                   <a
                     key={platform}
                     href={url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                   >
                     <Icon className="h-5 w-5" />
                   </a>
                 );
               })}
             </div>
           </div>
         </div>
 
         <Separator className="my-8" />
 
         <div className="text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} {restaurantName}. Todos los derechos reservados.
         </div>
       </div>
     </footer>
   );
 }