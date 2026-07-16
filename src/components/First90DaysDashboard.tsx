 import React from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   Rocket, Calendar, TrendingUp, Users, DollarSign, Target,
   CheckCircle2, Circle, Clock, ChefHat, Megaphone, ArrowRight,
   Sparkles, Trophy, AlertCircle, Lightbulb, BarChart3
 } from 'lucide-react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useFirst90Days, Milestone } from '@/hooks/useFirst90Days';
 import { useIsMobile } from '@/hooks/use-mobile';
 import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   AreaChart,
   Area
 } from 'recharts';
 
 const getCategoryIcon = (category: Milestone['category']) => {
   switch (category) {
     case 'revenue': return DollarSign;
     case 'operations': return ChefHat;
     case 'marketing': return Megaphone;
     case 'team': return Users;
     case 'customer': return Users;
     default: return Target;
   }
 };
 
 const getCategoryColor = (category: Milestone['category']) => {
   switch (category) {
     case 'revenue': return 'text-success';
     case 'operations': return 'text-primary';
     case 'marketing': return 'text-info';
     case 'team': return 'text-warning';
     case 'customer': return 'text-accent';
     default: return 'text-muted-foreground';
   }
 };
 
 export const First90DaysDashboard: React.FC = () => {
   const navigate = useNavigate();
   const { metrics, businessData, isLoading } = useFirst90Days();
   const isMobile = useIsMobile();
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
       </div>
     );
   }
 
   if (!metrics || !businessData) {
     return (
       <Card>
         <CardContent className="py-8 sm:py-12 text-center">
           <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
           <p className="text-sm sm:text-base text-muted-foreground">No se encontró información del negocio</p>
         </CardContent>
       </Card>
     );
   }
 
   const completedMilestones = metrics.milestones.filter(m => m.isCompleted).length;
   const upcomingMilestones = metrics.milestones.filter(
     m => !m.isCompleted && m.targetDay <= metrics.daysOpen + 14
   );
 
   const weeklyChartData = Array.from({ length: metrics.weekNumber }, (_, i) => ({
     week: `S${i + 1}`,
     revenue: metrics.revenueGrowth[i] || Math.random() * 50000 + 30000,
     customers: metrics.customerGrowth[i] || Math.random() * 300 + 100,
   }));
 
   return (
     <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
       {/* Hero Section */}
       <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border">
         <div className="flex items-center justify-between gap-3 sm:gap-6">
           <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
             <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
               <Rocket className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-foreground" />
             </div>
             <div className="min-w-0 flex-1">
               <h1 className="text-base sm:text-xl md:text-3xl font-headline font-bold leading-tight truncate">
                 Primeros 90 Días
               </h1>
               <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                 {businessData.name} • Día {metrics.daysOpen}
               </p>
             </div>
           </div>
 
           <div className="flex items-center gap-2 sm:gap-4 shrink-0">
             <div className="text-right hidden sm:block">
               <p className="text-xs sm:text-sm text-muted-foreground">Progreso</p>
               <p className="text-lg sm:text-2xl font-bold text-primary">
                 {metrics.progressPercentage.toFixed(0)}%
               </p>
             </div>
             <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 relative">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                 <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted" />
                 <circle
                   cx="40" cy="40" r="35"
                   stroke="currentColor" strokeWidth="6" fill="none"
                   className="text-primary"
                   strokeDasharray={`${2 * Math.PI * 35}`}
                   strokeDashoffset={`${2 * Math.PI * 35 * (1 - metrics.progressPercentage / 100)}`}
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-[9px] sm:text-xs md:text-sm font-bold">{metrics.daysRemaining}d</span>
               </div>
             </div>
           </div>
         </div>
 
         <div className="mt-3 sm:mt-6">
           <div className="flex justify-between text-[9px] sm:text-xs md:text-sm mb-1.5 sm:mb-2">
             <span>Inicio</span>
             <span className="font-medium">Semana {metrics.weekNumber}</span>
             <span>Día 90</span>
           </div>
           <Progress value={metrics.progressPercentage} className="h-1.5 sm:h-2 md:h-3" />
         </div>
       </div>
 
       {/* Weekly Focus Card */}
       <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
         <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
           <div className="flex items-center gap-2">
             <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
             <CardTitle className="text-sm sm:text-base md:text-lg truncate">
               Semana {metrics.weeklyFocus.weekNumber}
             </CardTitle>
           </div>
           <CardDescription className="text-xs sm:text-sm md:text-base font-medium text-foreground mt-0.5 line-clamp-1">
             {metrics.weeklyFocus.title}
           </CardDescription>
         </CardHeader>
         <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
           <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-2 sm:mb-4 line-clamp-2">{metrics.weeklyFocus.description}</p>
           
           <div className="grid grid-cols-2 gap-3 sm:gap-6">
             <div>
               <h4 className="font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm">
                 <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                 Objetivos
               </h4>
               <ul className="space-y-1 sm:space-y-2">
                 {metrics.weeklyFocus.objectives.slice(0, isMobile ? 2 : 3).map((obj, i) => (
                   <li key={i} className="flex items-start gap-1.5 text-[9px] sm:text-xs md:text-sm">
                     <Circle className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                     <span className="line-clamp-2">{obj}</span>
                   </li>
                 ))}
               </ul>
             </div>
             <div>
               <h4 className="font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm">
                 <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-warning shrink-0" />
                 Tips
               </h4>
               <ul className="space-y-1 sm:space-y-2">
                 {metrics.weeklyFocus.tips.slice(0, isMobile ? 2 : 3).map((tip, i) => (
                   <li key={i} className="flex items-start gap-1.5 text-[9px] sm:text-xs md:text-sm text-muted-foreground">
                     <span className="text-warning shrink-0">•</span>
                     <span className="line-clamp-2">{tip}</span>
                   </li>
                 ))}
               </ul>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* KPIs Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
         <Card>
           <CardContent className="p-2.5 sm:p-4 md:pt-6">
             <div className="flex items-center justify-between mb-1 sm:mb-2">
               <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
               <Badge variant="secondary" className="text-[8px] sm:text-xs px-1 sm:px-1.5 py-0">Total</Badge>
             </div>
             <p className="text-base sm:text-xl md:text-2xl font-bold">
               ${(metrics.totalRevenue / 1000).toFixed(1)}k
             </p>
             <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground">Ventas</p>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="p-2.5 sm:p-4 md:pt-6">
             <div className="flex items-center justify-between mb-1 sm:mb-2">
               <Users className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
               <Badge variant="secondary" className="text-[8px] sm:text-xs px-1 sm:px-1.5 py-0">Total</Badge>
             </div>
             <p className="text-base sm:text-xl md:text-2xl font-bold">
               {metrics.totalCustomers.toLocaleString()}
             </p>
             <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground">Clientes</p>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="p-2.5 sm:p-4 md:pt-6">
             <div className="flex items-center justify-between mb-1 sm:mb-2">
               <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
               <Badge variant="secondary" className="text-[8px] sm:text-xs px-1 sm:px-1.5 py-0">Prom</Badge>
             </div>
             <p className="text-base sm:text-xl md:text-2xl font-bold">
               ${metrics.averageTicket.toFixed(0)}
             </p>
             <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground">Ticket</p>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="p-2.5 sm:p-4 md:pt-6">
             <div className="flex items-center justify-between mb-1 sm:mb-2">
               <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
               <Badge variant={metrics.foodCostAverage <= 32 ? 'default' : 'destructive'} className="text-[8px] sm:text-xs px-1 sm:px-1.5 py-0">
                 {metrics.foodCostAverage <= 32 ? 'OK' : 'Alto'}
               </Badge>
             </div>
             <p className="text-base sm:text-xl md:text-2xl font-bold">
               {metrics.foodCostAverage.toFixed(1)}%
             </p>
             <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground">Food Cost</p>
           </CardContent>
         </Card>
       </div>
 
       {/* Tabs */}
       <Tabs defaultValue="progress" className="w-full">
         <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9 md:h-10">
           <TabsTrigger value="progress" className="text-[10px] sm:text-xs md:text-sm">Progreso</TabsTrigger>
           <TabsTrigger value="milestones" className="text-[10px] sm:text-xs md:text-sm">Hitos</TabsTrigger>
           <TabsTrigger value="analytics" className="text-[10px] sm:text-xs md:text-sm">Análisis</TabsTrigger>
         </TabsList>
 
         <TabsContent value="progress" className="mt-3 sm:mt-4 md:mt-6 space-y-3 sm:space-y-4 md:space-y-6">
           {/* Revenue Chart */}
           <Card>
             <CardHeader className="p-3 sm:p-4 md:p-6 pb-1 sm:pb-2">
               <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                 <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                 Evolución Semanal
               </CardTitle>
             </CardHeader>
             <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
               <div className="h-36 sm:h-48 md:h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={weeklyChartData}>
                     <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                     <XAxis dataKey="week" tick={{ fontSize: isMobile ? 9 : 12 }} />
                     <YAxis tick={{ fontSize: isMobile ? 9 : 12 }} width={isMobile ? 30 : 50} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                     <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']} contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                     <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>
 
           {/* Projections */}
           <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
             <Card>
               <CardHeader className="p-2.5 sm:p-4 pb-1 sm:pb-2">
                 <CardTitle className="text-[10px] sm:text-sm md:text-base">Proyección Mes</CardTitle>
               </CardHeader>
               <CardContent className="p-2.5 sm:p-4 pt-0">
                 <p className="text-lg sm:text-2xl md:text-3xl font-bold text-primary">
                   ${(metrics.projectedMonthlyRevenue / 1000).toFixed(0)}k
                 </p>
                 <p className="text-[8px] sm:text-xs text-muted-foreground mt-0.5">
                   Prom: ${metrics.averageDailyRevenue.toFixed(0)}/día
                 </p>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader className="p-2.5 sm:p-4 pb-1 sm:pb-2">
                 <CardTitle className="text-[10px] sm:text-sm md:text-base">Días Fuertes</CardTitle>
               </CardHeader>
               <CardContent className="p-2.5 sm:p-4 pt-0">
                 {metrics.peakDays.length > 0 ? (
                   <div className="flex flex-wrap gap-1">
                     {metrics.peakDays.slice(0, isMobile ? 2 : 3).map((day, i) => (
                       <Badge key={i} variant="secondary" className="text-[8px] sm:text-xs">{day}</Badge>
                     ))}
                   </div>
                 ) : (
                   <p className="text-[8px] sm:text-xs text-muted-foreground">
                     Aún sin ventas suficientes para identificarlos
                   </p>
                 )}
                 {metrics.peakHours.length > 0 && (
                   <p className="text-[8px] sm:text-xs text-muted-foreground mt-1.5">
                     Pico: {metrics.peakHours.slice(0, 2).join(', ')}
                   </p>
                 )}
               </CardContent>
             </Card>
           </div>
         </TabsContent>
 
         <TabsContent value="milestones" className="mt-3 sm:mt-4 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4">
           {upcomingMilestones.length > 0 && (
             <Card className="border-warning/30 bg-warning/5">
               <CardHeader className="p-2.5 sm:p-4 pb-1 sm:pb-2">
                 <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                   <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                   Próximos Hitos
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-2.5 sm:p-4 pt-0 space-y-1.5 sm:space-y-2">
                 {upcomingMilestones.slice(0, isMobile ? 2 : 3).map((milestone) => {
                   const Icon = getCategoryIcon(milestone.category);
                   const daysUntil = milestone.targetDay - metrics.daysOpen;
                   return (
                     <div key={milestone.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-background rounded-lg">
                       <div className={`p-1 sm:p-1.5 rounded-lg bg-muted ${getCategoryColor(milestone.category)} shrink-0`}>
                         <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-[10px] sm:text-xs md:text-sm truncate">{milestone.title}</p>
                         <p className="text-[9px] sm:text-xs text-muted-foreground line-clamp-1">{milestone.description}</p>
                       </div>
                       <Badge variant="outline" className="shrink-0 text-[8px] sm:text-xs px-1 sm:px-2">
                         {daysUntil > 0 ? `${daysUntil}d` : 'Hoy'}
                       </Badge>
                     </div>
                   );
                 })}
               </CardContent>
             </Card>
           )}
 
           <Card>
             <CardHeader className="p-2.5 sm:p-4 pb-1 sm:pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                   <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                   Todos los Hitos
                 </CardTitle>
                 <Badge className="text-[8px] sm:text-xs px-1 sm:px-2">{completedMilestones}/{metrics.milestones.length}</Badge>
               </div>
             </CardHeader>
             <CardContent className="p-2.5 sm:p-4 pt-0">
               <div className="space-y-1.5 sm:space-y-2">
                 {metrics.milestones.map((milestone) => {
                   const Icon = getCategoryIcon(milestone.category);
                   return (
                     <div key={milestone.id} className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${milestone.isCompleted ? 'bg-success/5 border-success/20' : 'bg-muted/30'}`}>
                       <div className={`p-1 sm:p-1.5 rounded-lg shrink-0 ${milestone.isCompleted ? 'bg-success/20' : 'bg-muted'}`}>
                         {milestone.isCompleted ? <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-success" /> : <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${getCategoryColor(milestone.category)}`} />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className={`font-medium text-[10px] sm:text-xs md:text-sm truncate ${milestone.isCompleted ? 'text-success' : ''}`}>{milestone.title}</p>
                         <p className="text-[9px] sm:text-xs text-muted-foreground line-clamp-1">{milestone.description}</p>
                       </div>
                       <Badge variant={milestone.isCompleted ? 'default' : 'outline'} className="shrink-0 text-[8px] sm:text-xs px-1 sm:px-2">D{milestone.targetDay}</Badge>
                     </div>
                   );
                 })}
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="analytics" className="mt-3 sm:mt-4 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4">
           <Card>
             <CardHeader className="p-2.5 sm:p-4 pb-1 sm:pb-2">
               <CardTitle className="text-sm sm:text-base">Métricas de Eficiencia</CardTitle>
             </CardHeader>
             <CardContent className="p-2.5 sm:p-4 pt-0">
               <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                 <div>
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-[9px] sm:text-xs text-muted-foreground">Food Cost</span>
                     <span className="font-bold text-[10px] sm:text-xs">{metrics.foodCostAverage.toFixed(1)}%</span>
                   </div>
                   <Progress value={Math.min(metrics.foodCostAverage, 40) * 2.5} className="h-1 sm:h-1.5" />
                   <p className="text-[8px] sm:text-xs text-muted-foreground mt-0.5">&lt;32%</p>
                 </div>
                 <div>
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-[9px] sm:text-xs text-muted-foreground">Labor</span>
                     <span className="font-bold text-[10px] sm:text-xs">{metrics.laborCostAverage.toFixed(1)}%</span>
                   </div>
                   <Progress value={Math.min(metrics.laborCostAverage, 35) * 2.86} className="h-1 sm:h-1.5" />
                   <p className="text-[8px] sm:text-xs text-muted-foreground mt-0.5">&lt;28%</p>
                 </div>
                 <div>
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-[9px] sm:text-xs text-muted-foreground">Clientes/d</span>
                     <span className="font-bold text-[10px] sm:text-xs">{metrics.averageDailyCustomers.toFixed(0)}</span>
                   </div>
                   <Progress value={Math.min(metrics.averageDailyCustomers, 100)} className="h-1 sm:h-1.5" />
                   <p className="text-[8px] sm:text-xs text-muted-foreground mt-0.5">Prom.</p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="p-2.5 sm:p-4 pb-1 sm:pb-2">
               <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                 <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                 Recomendaciones
               </CardTitle>
             </CardHeader>
             <CardContent className="p-2.5 sm:p-4 pt-0 space-y-2 sm:space-y-3">
               {metrics.foodCostAverage > 32 && (
                 <div className="p-2 sm:p-3 bg-warning/10 rounded-lg border border-warning/20">
                   <p className="font-medium text-warning text-[10px] sm:text-xs md:text-sm">Food Cost Elevado</p>
                   <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">
                     En {metrics.foodCostAverage.toFixed(1)}%. Revisa porciones.
                   </p>
                   <Button variant="link" className="p-0 h-auto mt-1 text-[9px] sm:text-xs" onClick={() => navigate('/r/menu-engineering')}>
                     Ver Menú <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5" />
                   </Button>
                 </div>
               )}
               {metrics.averageTicket < 150 && (
                 <div className="p-2 sm:p-3 bg-info/10 rounded-lg border border-info/20">
                   <p className="font-medium text-info text-[10px] sm:text-xs md:text-sm">Oportunidad de Ticket</p>
                   <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">Ticket: ${metrics.averageTicket.toFixed(0)}. Considera upselling.</p>
                 </div>
               )}
               {metrics.daysOpen >= 30 && (
                 <div className="p-2 sm:p-3 bg-success/10 rounded-lg border border-success/20">
                   <p className="font-medium text-success text-[10px] sm:text-xs md:text-sm">¡Primer mes!</p>
                   <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">{metrics.totalCustomers} clientes, ${(metrics.totalRevenue/1000).toFixed(1)}k ventas.</p>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
 
       <Card className="bg-muted/30 overflow-hidden">
         <CardContent className="p-3 sm:p-4">
           <div className="flex items-center justify-between gap-3">
             <div className="min-w-0">
               <p className="font-medium text-xs sm:text-sm">Dashboard completo</p>
               <p className="text-[9px] sm:text-xs text-muted-foreground">Todas las herramientas</p>
             </div>
             <Button onClick={() => navigate('/r/dashboard')} size={isMobile ? "sm" : "default"} className="shrink-0 text-[10px] sm:text-xs md:text-sm h-7 sm:h-9">
               Ver
             </Button>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 };