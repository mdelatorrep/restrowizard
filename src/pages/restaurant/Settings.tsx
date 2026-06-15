import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Shield, Building2, Users, Loader2, Info } from 'lucide-react';
import PaymentGatewaySettings from '@/components/pos/PaymentGatewaySettings';
import POSTaxSettings from '@/components/pos/POSTaxSettings';
import TeamManagementTab from '@/components/team/TeamManagementTab';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}
interface BusinessRow {
  id: string;
  name: string | null;
  business_type: string | null;
  cuisine_type: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [business, setBusiness] = useState<BusinessRow | null>(null);

  // form state mirrors loaded rows
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [{ data: prof }, { data: biz }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, phone, avatar_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('restaurant_businesses')
            .select('id, name, business_type, cuisine_type, address, city, country, phone, website')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (prof) {
          setProfile(prof as ProfileRow);
          setFullName(prof.full_name || (user.user_metadata?.full_name as string) || '');
          setPhone(prof.phone || '');
        } else {
          setFullName((user.user_metadata?.full_name as string) || '');
        }

        if (biz) {
          setBusiness(biz as BusinessRow);
          setBusinessName(biz.name || '');
          setBusinessType(biz.business_type || '');
          setCuisineType(biz.cuisine_type || '');
          setAddress(biz.address || '');
          setCity(biz.city || '');
          setCountry(biz.country || '');
          setBusinessPhone(biz.phone || '');
          setWebsite(biz.website || '');
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const payload = { full_name: fullName.trim(), phone: phone.trim() };
      if (profile?.id) {
        const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, ...payload, user_type: 'restaurant_owner' })
          .select()
          .single();
        if (error) throw error;
        setProfile(data as ProfileRow);
      }
      toast({ title: 'Perfil actualizado', description: 'Tus datos personales se han guardado.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo guardar el perfil', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!user || !business?.id) {
      toast({
        title: 'Configura tu restaurante primero',
        description: 'Completa el onboarding para crear tu negocio.',
        variant: 'destructive',
      });
      return;
    }
    setSavingBusiness(true);
    try {
      const { error } = await supabase
        .from('restaurant_businesses')
        .update({
          name: businessName.trim(),
          business_type: businessType.trim() || null,
          cuisine_type: cuisineType.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          phone: businessPhone.trim() || null,
          website: website.trim() || null,
        })
        .eq('id', business.id);
      if (error) throw error;
      toast({ title: 'Negocio actualizado', description: 'La información de tu restaurante se ha guardado.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo actualizar el negocio', variant: 'destructive' });
    } finally {
      setSavingBusiness(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground font-lato-light">Administra tu cuenta y preferencias</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="business">Negocio</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-1" />Equipo</TabsTrigger>
          <TabsTrigger value="payments">Pasarelas de Pago</TabsTrigger>
          <TabsTrigger value="tax">Impuestos POS</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <User className="h-5 w-5" />
                Perfil
              </CardTitle>
              <CardDescription>Tu información personal de la cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu información…
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre completo</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled />
                      <p className="text-xs text-muted-foreground">
                        El email no se puede cambiar desde aquí.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar cambios
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Building2 className="h-5 w-5" />
                Negocio
              </CardTitle>
              <CardDescription>
                Información operativa de tu restaurante. La identidad visual (logo, colores, NIT, redes) se
                gestiona en{' '}
                <Link to="/r/brand" className="text-primary underline">
                  Marca
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu negocio…
                </div>
              ) : !business ? (
                <div className="flex items-start gap-2 text-sm bg-muted/50 border border-border rounded-md p-3">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p>
                    Aún no tienes un restaurante configurado. Completa el{' '}
                    <Link to="/onboarding" className="text-primary underline">onboarding</Link> para empezar.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Nombre del restaurante</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Tipo de negocio</Label>
                      <Input
                        id="businessType"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        placeholder="Restaurante, Café, Bar…"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuisineType">Tipo de cocina</Label>
                    <Input
                      id="cuisineType"
                      value={cuisineType}
                      onChange={(e) => setCuisineType(e.target.value)}
                      placeholder="Italiana, mexicana, fusión…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, número, barrio"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Teléfono del negocio</Label>
                      <Input
                        id="businessPhone"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Sitio web</Label>
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveBusiness} disabled={savingBusiness}>
                    {savingBusiness && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Actualizar negocio
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementTab />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentGatewaySettings />
        </TabsContent>

        <TabsContent value="tax">
          <POSTaxSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas del Co-Piloto IA</p>
                  <p className="text-sm text-muted-foreground">Recibe alertas proactivas en tiempo real</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resumen diario por email</p>
                  <p className="text-sm text-muted-foreground">Recibe un resumen cada mañana</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones push</p>
                  <p className="text-sm text-muted-foreground">Alertas en tu dispositivo móvil</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de stock bajo</p>
                  <p className="text-sm text-muted-foreground">Notificación cuando el inventario esté bajo</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>Protege tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">Cambiar contraseña</Button>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticación de dos factores</p>
                  <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
