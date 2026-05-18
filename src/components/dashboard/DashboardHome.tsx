import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Menu, Briefcase, Calendar, Bell, BarChart2, Lightbulb } from 'lucide-react';

export const DashboardHome = ({ stats, recentActivity, userProfile, loading }: any) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isNewUser = !stats || (
    (stats.totalMenus === 0 || !stats.totalMenus) &&
    (stats.totalJobs === 0 || !stats.totalJobs) &&
    (stats.totalEvents === 0 || !stats.totalEvents) &&
    (!recentActivity || recentActivity.length === 0)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          ¡Bienvenido, {userProfile?.full_name || 'Usuario'}!
        </h1>
        <p className="text-muted-foreground">
          Restaurante: {userProfile?.restaurant_name || 'Mi Restaurante'}
        </p>
        {isNewUser && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary font-medium mb-2">
              🎉 ¡Acabas de unirte a RestroWizard!
            </p>
            <p className="text-sm text-muted-foreground">
              Comienza creando tu primer menú digital o publicando una oferta de empleo para darle vida a tu dashboard.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/menus')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Menús</p>
                <p className="text-2xl font-bold">{stats?.totalMenus || 0}</p>
                <p className="text-xs text-muted-foreground">{stats?.publishedMenus || 0} publicados</p>
              </div>
              <Menu className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/jobs')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empleos</p>
                <p className="text-2xl font-bold">{stats?.totalJobs || 0}</p>
                <p className="text-xs text-muted-foreground">{stats?.activeJobs || 0} activos</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/events')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eventos</p>
                <p className="text-2xl font-bold">{stats?.totalEvents || 0}</p>
                <p className="text-xs text-muted-foreground">{stats?.upcomingEvents || 0} próximos</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notificaciones</p>
                <p className="text-2xl font-bold">{stats?.totalNotifications || 0}</p>
                <p className="text-xs text-muted-foreground">{stats?.unreadNotifications || 0} sin leer</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {isNewUser ? '¡Tu actividad aparecerá aquí!' : 'No hay actividad reciente'}
                </p>
                {isNewUser && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Crea tu primer menú digital</p>
                    <p>• Publica una oferta de empleo</p>
                    <p>• Organiza un evento</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(recentActivity || []).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {activity.type === 'menu' && <Menu className="h-5 w-5 text-blue-500" />}
                      {activity.type === 'job' && <Briefcase className="h-5 w-5 text-green-500" />}
                      {activity.type === 'event' && <Calendar className="h-5 w-5 text-purple-500" />}
                      {activity.type === 'notification' && <Bell className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    {activity.status && (
                      <Badge variant={activity.status === 'published' || activity.status === 'active' ? 'default' : 'secondary'}>
                        {activity.status === 'published' ? 'Publicado' :
                          activity.status === 'active' ? 'Activo' :
                          activity.status === 'draft' ? 'Borrador' : activity.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isNewUser ? '¡Comienza Aquí!' : 'Acciones Rápidas'}</CardTitle>
            <CardDescription>
              {isNewUser
                ? 'Estas son las primeras acciones que puedes realizar para comenzar'
                : 'Accede rápidamente a las funciones principales'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => navigate('/menus')} className="h-20 flex flex-col items-center justify-center" variant={isNewUser ? 'default' : 'outline'}>
                <Menu className="h-6 w-6 mb-2" />
                <span className="text-sm">Crear Menú</span>
                {isNewUser && <span className="text-xs opacity-75">¡Recomendado!</span>}
              </Button>
              <Button onClick={() => navigate('/jobs')} className="h-20 flex flex-col items-center justify-center" variant="outline">
                <Briefcase className="h-6 w-6 mb-2" />
                <span className="text-sm">Publicar Empleo</span>
              </Button>
              <Button onClick={() => navigate('/events')} className="h-20 flex flex-col items-center justify-center" variant="outline">
                <Calendar className="h-6 w-6 mb-2" />
                <span className="text-sm">Crear Evento</span>
              </Button>
              <Button onClick={() => navigate('/diagnosis')} className="h-20 flex flex-col items-center justify-center" variant="outline">
                <BarChart2 className="h-6 w-6 mb-2" />
                <span className="text-sm">Ver Diagnóstico</span>
              </Button>
            </div>
            {isNewUser && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Consejo para Empezar
                </h4>
                <p className="text-sm text-muted-foreground">
                  Te recomendamos comenzar creando tu primer menú digital.
                  Es rápido, fácil y podrás compartirlo inmediatamente con tus clientes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
