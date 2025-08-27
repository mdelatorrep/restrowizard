import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, TestTube, Smartphone, Monitor, Clock } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const NotificationSettings = () => {
  const {
    permission,
    isSubscribed,
    isLoading,
    subscriptions,
    preferences,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Notificaciones no soportadas
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones push. Considera usar Chrome, Firefox o Safari actualizado.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500">Permitido</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denegado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    if (!preferences) return;
    updatePreferences({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado de Notificaciones
          </CardTitle>
          <CardDescription>
            Gestiona cómo recibes alertas de tu copiloto IA de RestroWizard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-lato-medium">Permisos del navegador</Label>
              <p className="text-sm text-muted-foreground">
                Estado actual de los permisos de notificación
              </p>
            </div>
            {getPermissionBadge()}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-lato-medium">Estado de suscripción</Label>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? `Suscrito en ${subscriptions.length} dispositivo(s)`
                  : 'No estás suscrito a notificaciones'
                }
              </p>
            </div>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {isSubscribed ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          <div className="flex gap-2">
            {!isSubscribed ? (
              <Button 
                onClick={permission === 'granted' ? subscribe : requestPermission}
                disabled={isLoading || permission === 'denied'}
                className="font-lato-medium"
              >
                <Bell className="mr-2 h-4 w-4" />
                {permission === 'granted' ? 'Suscribirse' : 'Activar Notificaciones'}
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => unsubscribe()}
                  disabled={isLoading}
                  className="font-lato-medium"
                >
                  <BellOff className="mr-2 h-4 w-4" />
                  Desuscribirse
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={sendTestNotification}
                  disabled={isLoading}
                  className="font-lato-medium"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Enviar Prueba
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos Suscritos</CardTitle>
            <CardDescription>
              Lista de dispositivos que reciben notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {subscription.device_type === 'mobile' ? (
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-lato-medium">{subscription.device_type === 'mobile' ? 'Móvil' : 'Escritorio'}</p>
                      <p className="text-sm text-muted-foreground">
                        Activado: {new Date(subscription.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unsubscribe(subscription.id)}
                    disabled={isLoading}
                  >
                    Desactivar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Card */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Preferencias de Notificación
            </CardTitle>
            <CardDescription>
              Personaliza qué tipo de alertas deseas recibir de tu copiloto IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-lato-medium">Alertas del Copiloto IA</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones sobre costos, inventario y oportunidades
                    </p>
                  </div>
                  <Switch
                    checked={preferences.ai_alerts}
                    onCheckedChange={(checked) => handlePreferenceChange('ai_alerts', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-lato-medium">Alertas de KPIs Críticos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones cuando los KPIs están fuera de rango normal
                    </p>
                  </div>
                  <Switch
                    checked={preferences.kpi_alerts}
                    onCheckedChange={(checked) => handlePreferenceChange('kpi_alerts', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-lato-medium">Recordatorios de Formación</Label>
                    <p className="text-sm text-muted-foreground">
                      Recordatorios sobre cursos pendientes y capacitación del personal
                    </p>
                  </div>
                  <Switch
                    checked={preferences.training_reminders}
                    onCheckedChange={(checked) => handlePreferenceChange('training_reminders', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-lato-medium">Actualizaciones del Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones sobre nuevas funcionalidades y actualizaciones
                    </p>
                  </div>
                  <Switch
                    checked={preferences.system_updates}
                    onCheckedChange={(checked) => handlePreferenceChange('system_updates', checked)}
                  />
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-lato-medium">Horario de Silencio</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    No recibir notificaciones entre: {preferences.quiet_hours_start} - {preferences.quiet_hours_end}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Puedes configurar horarios específicos contactando a soporte
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationSettings;