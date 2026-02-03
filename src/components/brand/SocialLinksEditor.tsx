import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Facebook, 
  Instagram, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  MessageCircle
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTiktok, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;
  google_maps?: string;
  tripadvisor?: string;
}

interface SocialLinksEditorProps {
  socialLinks: SocialLinks;
  onChange: (links: SocialLinks) => void;
}

const SOCIAL_FIELDS = [
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: '@tu_restaurante',
    icon: <Instagram className="h-5 w-5" />,
    color: 'text-pink-500',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'facebook.com/tu_restaurante',
    icon: <Facebook className="h-5 w-5" />,
    color: 'text-blue-600',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: '@tu_restaurante',
    icon: <FontAwesomeIcon icon={faTiktok} className="h-5 w-5" />,
    color: 'text-foreground',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    placeholder: '+52 55 1234 5678',
    icon: <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5" />,
    color: 'text-green-500',
  },
  {
    key: 'phone',
    label: 'Teléfono',
    placeholder: '+52 55 1234 5678',
    icon: <Phone className="h-5 w-5" />,
    color: 'text-primary',
  },
  {
    key: 'email',
    label: 'Email',
    placeholder: 'contacto@restaurante.com',
    icon: <Mail className="h-5 w-5" />,
    color: 'text-orange-500',
  },
  {
    key: 'website',
    label: 'Sitio Web',
    placeholder: 'https://www.tu-restaurante.com',
    icon: <Globe className="h-5 w-5" />,
    color: 'text-primary',
  },
  {
    key: 'google_maps',
    label: 'Google Maps',
    placeholder: 'URL de Google Maps',
    icon: <MapPin className="h-5 w-5" />,
    color: 'text-red-500',
  },
  {
    key: 'tripadvisor',
    label: 'TripAdvisor',
    placeholder: 'URL de TripAdvisor',
    icon: <MessageCircle className="h-5 w-5" />,
    color: 'text-green-600',
  },
];

export const SocialLinksEditor: React.FC<SocialLinksEditorProps> = ({ socialLinks, onChange }) => {
  const handleChange = (key: string, value: string) => {
    onChange({ ...socialLinks, [key]: value || undefined });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Redes Sociales y Contacto
        </CardTitle>
        <CardDescription>
          Agrega tus enlaces de redes sociales e información de contacto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="flex items-center gap-2">
                <span className={field.color}>{field.icon}</span>
                {field.label}
              </Label>
              <Input
                id={field.key}
                placeholder={field.placeholder}
                value={socialLinks[field.key as keyof SocialLinks] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
