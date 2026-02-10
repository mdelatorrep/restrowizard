import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRegisterProvider } from '@/hooks/useProviderProfile';
import { useAuth } from '@/hooks/useAuth';

const categories = [
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'technology', label: 'Tecnología' },
  { value: 'food_supplies', label: 'Ingredientes' },
  { value: 'consulting', label: 'Consultoría' },
  { value: 'design', label: 'Diseño' },
  { value: 'catering', label: 'Catering' },
  { value: 'photography', label: 'Fotografía' },
  { value: 'other', label: 'Otro' },
];

const ProviderRegister = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const registerProvider = useRegisterProvider();
  const [form, setForm] = useState({
    name: '', headline: '', specialty: '', category: 'equipment', city: '', country: 'Colombia',
    description: '', contact_email: '', contact_phone: '', website_url: '', tags: '', certifications: '',
  });

  if (!session) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerProvider.mutate({
      name: form.name,
      headline: form.headline || undefined,
      specialty: form.specialty || undefined,
      category: form.category,
      city: form.city,
      country: form.country,
      description: form.description || undefined,
      contact_email: form.contact_email || undefined,
      contact_phone: form.contact_phone || undefined,
      website_url: form.website_url || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : undefined,
      certifications: form.certifications ? form.certifications.split(',').map(t => t.trim()) : undefined,
    }, {
      onSuccess: () => navigate('/services/dashboard'),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 pt-28 pb-12 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/services')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>

        <Card>
          <CardHeader className="text-center">
            <Building2 className="h-10 w-10 mx-auto mb-2 text-primary" />
            <CardTitle className="text-2xl">Registra tu Empresa</CardTitle>
            <p className="text-sm text-muted-foreground">Únete al marketplace gastronómico más grande de LATAM</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre de empresa *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Mi Empresa" /></div>
                <div className="space-y-2"><Label>Titular profesional</Label>
                  <Input value={form.headline} onChange={e => setForm(p => ({ ...p, headline: e.target.value }))} placeholder="Expertos en tecnología para restaurantes" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Especialidad</Label>
                  <Input value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} placeholder="Sistemas POS, Inventario..." /></div>
                <div className="space-y-2"><Label>Categoría *</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
              <div className="space-y-2"><Label>Descripción</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe tu empresa y servicios..." /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ciudad *</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required placeholder="Bogotá" /></div>
                <div className="space-y-2"><Label>País</Label>
                  <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email de contacto</Label>
                  <Input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Teléfono</Label>
                  <Input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Sitio web</Label>
                <Input value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Tags (separados por coma)</Label>
                <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="tecnología, POS, inventario" /></div>
              <div className="space-y-2"><Label>Certificaciones (separadas por coma)</Label>
                <Input value={form.certifications} onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))} placeholder="ISO 9001, HACCP" /></div>

              <Button type="submit" className="w-full" disabled={registerProvider.isPending}>
                {registerProvider.isPending ? 'Registrando...' : 'Registrar Empresa'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProviderRegister;
