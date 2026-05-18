import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';

export const PublicRestaurantAbout = ({ website }: { website: PublicWebsiteData }) => {
  const brand = website.brand;
  return (
    <section id="nosotros" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: brand?.primary_font }}>
              {website.about_title || 'Nuestra Historia'}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {website.about_description || 'Bienvenidos a nuestro restaurante. Cada plato cuenta una historia de pasión, tradición y los mejores ingredientes.'}
            </p>
          </div>
          {website.about_image_url && (
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img src={website.about_image_url} alt="Sobre nosotros" className="w-full h-80 object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
