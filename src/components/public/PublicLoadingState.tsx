 import { Loader2, UtensilsCrossed } from 'lucide-react';
 
 interface PublicLoadingStateProps {
   message?: string;
 }
 
 export function PublicLoadingState({ message = 'Cargando...' }: PublicLoadingStateProps) {
   return (
     <div className="min-h-screen flex items-center justify-center bg-background">
       <div className="text-center space-y-4">
         <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
         <p className="text-muted-foreground">{message}</p>
       </div>
     </div>
   );
 }
 
 interface PublicErrorStateProps {
   type: 'not_found' | 'not_published' | 'error' | 'unavailable';
   message?: string;
   title?: string;
 }
 
 export function PublicErrorState({ type, message, title: customTitle }: PublicErrorStateProps) {
   const config = {
     not_found: {
       title: 'Restaurante no encontrado',
       description: 'El restaurante que buscas no existe o la URL es incorrecta.',
     },
     not_published: {
       title: 'Sitio no disponible',
       description: 'Este restaurante aún no ha publicado su sitio web.',
     },
     unavailable: {
       title: 'Servicio no disponible',
       description: message || 'Este restaurante no ofrece este servicio por ahora.',
     },
     error: {
       title: 'Error al cargar',
       description: message || 'Ocurrió un error al cargar la información. Intenta de nuevo.',
     },
   };
 
   const { title: defaultTitle, description } = config[type];
   const title = customTitle || defaultTitle;
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-background p-6">
       <div className="text-center space-y-6 max-w-md">
         <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
           <UtensilsCrossed className="w-12 h-12 text-muted-foreground" />
         </div>
         <h1 className="text-3xl font-bold">{title}</h1>
         <p className="text-muted-foreground">{description}</p>
       </div>
     </div>
   );
 }