import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';

interface Props {
  website: PublicWebsiteData;
  restaurantName: string;
}

export const PublicRestaurantFooter = ({ website, restaurantName }: Props) => {
  const brand = website.brand;
  return (
    <footer className="bg-muted/50 py-8 border-t">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {brand?.logo_url && <img src={brand.logo_url} alt={restaurantName} className="h-8 w-auto" />}
          <span className="font-semibold">{restaurantName}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {restaurantName}. Todos los derechos reservados.
        </p>
        <p className="text-xs text-muted-foreground mt-2">Potenciado por RestroWizard</p>
      </div>
    </footer>
  );
};
