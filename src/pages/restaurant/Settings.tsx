import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, Building2 } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground font-lato-light">
          Administra tu cuenta y preferencias
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" placeholder="Tu nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" placeholder="+52 55 1234 5678" />
          </div>
          <Button>Guardar cambios</Button>
        </CardContent>
      </Card>

      {/* Business Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Building2 className="h-5 w-5" />
            Negocio
          </CardTitle>
          <CardDescription>Información de tu restaurante</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del restaurante</Label>
              <Input id="businessName" placeholder="Mi Restaurante" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Tipo de negocio</Label>
              <Input id="businessType" placeholder="Restaurante" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" placeholder="Calle, número, colonia, ciudad" />
          </div>
          <Button>Actualizar negocio</Button>
        </CardContent>
      </Card>

      {/* Notifications Section */}
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
        </CardContent>
      </Card>

      {/* Security Section */}
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
    </div>
  );
};

export default Settings;
