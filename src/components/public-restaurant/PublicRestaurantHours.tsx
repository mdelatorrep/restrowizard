import { Card, CardContent } from '@/components/ui/card';
import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

export const PublicRestaurantHours = ({ website }: { website: PublicWebsiteData }) => {
  const brand = website.brand;
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
          Horarios
        </h2>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-3">
              {DAYS.map(day => {
                const hours = website.business_hours[day];
                return (
                  <div key={day} className="flex justify-between items-center">
                    <span className="font-medium">{DAY_NAMES[day]}</span>
                    <span className="text-muted-foreground">
                      {hours?.closed ? 'Cerrado' : hours ? `${hours.open} - ${hours.close}` : 'No definido'}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
