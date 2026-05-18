import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Facebook, Instagram, Twitter, Globe } from 'lucide-react';
import type { PublicWebsiteData } from '@/hooks/useRestaurantWebsite';

export const PublicRestaurantContact = ({ website }: { website: PublicWebsiteData }) => {
  const brand = website.brand;
  const profile = website.profile;
  const socialLinks: Record<string, string> = (brand?.social_links as any) || {};

  return (
    <section id="contacto" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: brand?.primary_font }}>
          Contacto
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {profile?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>{profile.address}</p>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <a href={`tel:${profile.phone}`} className="hover:text-primary transition-colors">{profile.phone}</a>
                </div>
              )}
              {Object.keys(socialLinks).length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="flex gap-4">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.website && (
                      <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <div className="h-full min-h-[300px] bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Mapa próximamente</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
