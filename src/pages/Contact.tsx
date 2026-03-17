import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import SEOHead from '@/components/SEOHead';
import { useState } from 'react';
import { toast } from 'sonner';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Mensaje enviado. Te responderemos pronto.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Contacto | RestroWizard" description="Contáctanos para resolver tus dudas sobre RestroWizard." canonical="https://restrowizard.lovable.app/contact" />
      <Header />
      <section className="pt-28 pb-16 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-headline text-foreground mb-4">Contáctanos</h1>
          <p className="text-muted-foreground font-lato-regular">¿Tienes preguntas? Escríbenos y nuestro equipo te responderá a la brevedad.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nombre</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
            <div><Label>Mensaje</Label><Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required rows={5} /></div>
            <Button type="submit" className="w-full">Enviar Mensaje</Button>
          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>También puedes escribirnos a <a href="mailto:hola@restrowizard.com" className="text-primary hover:underline">hola@restrowizard.com</a></p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;
