import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';

export const PublicRestaurantGallery = ({ website }: { website: PublicWebsiteData }) => {
  const brand = website.brand;
  return (
    <section id="galeria" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
          Galería
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {website.gallery_images.map((img, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden shadow-lg">
              <img src={img} alt={`Galería ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
