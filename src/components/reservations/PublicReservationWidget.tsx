import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, Sparkles, User, Phone, Mail, MessageSquare,
  PartyPopper, CalendarPlus, Share2, MapPin
} from 'lucide-react';
import { format, addDays, isSameDay, isToday, isTomorrow, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReservationWidgetProps {
  restaurantName: string;
  restaurantLogo?: string;
  primaryColor?: string;
  accentColor?: string;
  maxPartySize?: number;
  availableTimeSlots?: string[];
  onSubmit: (data: ReservationFormData) => Promise<string | null>;
  loading?: boolean;
}

export interface ReservationFormData {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
}

const DEFAULT_TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

export function PublicReservationWidget({
  restaurantName,
  restaurantLogo,
  primaryColor = 'hsl(var(--primary))',
  accentColor = 'hsl(var(--accent))',
  maxPartySize = 10,
  availableTimeSlots = DEFAULT_TIME_SLOTS,
  onSubmit,
  loading = false,
}: ReservationWidgetProps) {
  const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [showMoreSizes, setShowMoreSizes] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: '',
  });

  // Quick date selection (next 7 days)
  const quickDates = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEE d', { locale: es });
  };

  const canProceedToDetails = selectedDate && selectedTime;

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    
    const data: ReservationFormData = {
      customer_name: formData.customer_name,
      customer_email: formData.customer_email || undefined,
      customer_phone: formData.customer_phone,
      party_size: partySize,
      reservation_date: format(selectedDate, 'yyyy-MM-dd'),
      reservation_time: selectedTime,
      special_requests: formData.special_requests || undefined,
    };

    const code = await onSubmit(data);
    if (code) {
      setConfirmationCode(code);
      setStep('success');
    }
  };

  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedTime) return;
    
    const [hours, minutes] = selectedTime.split(':');
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 2);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Reserva en ${restaurantName}`)}&dates=${format(startDateTime, "yyyyMMdd'T'HHmmss")}/${format(endDateTime, "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(`Reserva para ${partySize} personas. Código: ${confirmationCode}`)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Reserva en ${restaurantName}`,
        text: `¡Tengo una reserva en ${restaurantName}! ${format(selectedDate!, 'EEEE d MMMM', { locale: es })} a las ${selectedTime} para ${partySize} personas.`,
      });
    }
  };

  const handleNewReservation = () => {
    setStep('select');
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setConfirmationCode(null);
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_requests: '',
    });
  };

  // Success step
  if (step === 'success' && confirmationCode) {
    return (
      <Card className="max-w-lg mx-auto overflow-hidden border-0 shadow-2xl">
        {/* Success header */}
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNHMxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvZz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">¡Reserva Confirmada!</h2>
            <p className="text-white/90">Tu mesa te espera</p>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Confirmation code */}
          <div className="text-center p-6 bg-gradient-to-br from-muted/50 to-muted rounded-2xl">
            <p className="text-sm text-muted-foreground mb-2">Código de confirmación</p>
            <p className="text-4xl font-mono font-bold tracking-wider text-primary">
              {confirmationCode}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Guarda este código para presentarlo en el restaurante
            </p>
          </div>

          {/* Reservation details */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted/30 rounded-xl">
              <CalendarIcon className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="font-semibold">{format(selectedDate!, 'd MMM', { locale: es })}</p>
              <p className="text-xs text-muted-foreground">{format(selectedDate!, 'EEEE', { locale: es })}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="font-semibold">{selectedTime}</p>
              <p className="text-xs text-muted-foreground">Hora</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="font-semibold">{partySize}</p>
              <p className="text-xs text-muted-foreground">Personas</p>
            </div>
          </div>

          {/* Restaurant info */}
          <div className="flex items-center gap-3 p-4 border rounded-xl">
            {restaurantLogo ? (
              <img src={restaurantLogo} alt={restaurantName} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold">{restaurantName}</p>
              <p className="text-sm text-muted-foreground">Reserva a nombre de {formData.customer_name}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleAddToCalendar}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Agregar al calendario
            </Button>
            <Button 
              variant="outline"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            variant="ghost" 
            className="w-full"
            onClick={handleNewReservation}
          >
            Hacer otra reserva
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Details step
  if (step === 'details') {
    return (
      <Card className="max-w-lg mx-auto overflow-hidden border-0 shadow-2xl">
        {/* Header with selection summary */}
        <div 
          className="p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
        >
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 -ml-2 mb-4"
            onClick={() => setStep('select')}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Cambiar selección
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Completa tu reserva</h2>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {partySize} personas
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" /> {format(selectedDate!, 'd MMM', { locale: es })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {selectedTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Nombre completo *
            </label>
            <Input
              required
              placeholder="¿Cómo te llamas?"
              value={formData.customer_name}
              onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
              className="h-12"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Teléfono *
            </label>
            <Input
              required
              type="tel"
              placeholder="+57 300 123 4567"
              value={formData.customer_phone}
              onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
              className="h-12"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Input
              type="email"
              placeholder="Para enviarte la confirmación"
              value={formData.customer_email}
              onChange={e => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
              className="h-12"
            />
          </div>

          {/* Special requests */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Peticiones especiales
            </label>
            <Textarea
              placeholder="Alergias, celebraciones, preferencia de mesa..."
              value={formData.special_requests}
              onChange={e => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button 
            className="w-full h-14 text-lg font-semibold shadow-lg"
            onClick={handleSubmit}
            disabled={loading || !formData.customer_name || !formData.customer_phone}
            style={{ background: primaryColor }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Confirmar reserva
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Al confirmar, aceptas las políticas de reserva del restaurante
          </p>
        </CardContent>
      </Card>
    );
  }

  // Selection step (default)
  return (
    <Card className="max-w-2xl mx-auto overflow-hidden border-0 shadow-2xl">
      {/* Header */}
      <div 
        className="p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
      >
        <div className="flex items-center gap-3 mb-4">
          {restaurantLogo && (
            <img src={restaurantLogo} alt="" className="w-10 h-10 rounded-lg" />
          )}
          <div>
            <h2 className="text-2xl font-bold">Reserva tu mesa</h2>
            <p className="text-white/80 text-sm">{restaurantName}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Party size selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            ¿Cuántas personas?
          </label>
          <div className="flex flex-wrap gap-2">
            {PARTY_SIZES.slice(0, showMoreSizes ? undefined : 6).map(size => (
              <Button
                key={size}
                variant={partySize === size ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  "w-14 h-14 rounded-xl text-lg font-semibold transition-all",
                  partySize === size && "ring-2 ring-offset-2 ring-primary"
                )}
                onClick={() => setPartySize(size)}
              >
                {size}
              </Button>
            ))}
            {!showMoreSizes && maxPartySize > 6 && (
              <Button
                variant="outline"
                size="lg"
                className="w-14 h-14 rounded-xl"
                onClick={() => setShowMoreSizes(true)}
              >
                +
              </Button>
            )}
            {showMoreSizes && maxPartySize > 8 && (
              <div className="w-full mt-2">
                <Input
                  type="number"
                  min={1}
                  max={maxPartySize}
                  value={partySize}
                  onChange={e => setPartySize(Math.min(maxPartySize, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-32"
                  placeholder="Grupo grande"
                />
              </div>
            )}
          </div>
        </div>

        {/* Date selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            ¿Qué día?
          </label>
          
          {/* Quick dates */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickDates.map(date => (
              <Button
                key={date.toISOString()}
                variant={selectedDate && isSameDay(selectedDate, date) ? 'default' : 'outline'}
                className={cn(
                  "flex-shrink-0 h-16 px-4 rounded-xl flex flex-col items-center justify-center",
                  selectedDate && isSameDay(selectedDate, date) && "ring-2 ring-offset-2 ring-primary"
                )}
                onClick={() => setSelectedDate(date)}
              >
                <span className="text-xs text-muted-foreground">{isToday(date) ? 'Hoy' : format(date, 'EEE', { locale: es })}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
              </Button>
            ))}
            
            {/* More dates */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-shrink-0 h-16 px-4 rounded-xl">
                  <span className="text-sm">Más fechas</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < startOfToday()}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Time selector */}
        {selectedDate && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              ¿A qué hora?
            </label>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {availableTimeSlots.map(time => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  className={cn(
                    "h-12 rounded-xl font-semibold",
                    selectedTime === time && "ring-2 ring-offset-2 ring-primary"
                  )}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <Button
          className="w-full h-14 text-lg font-semibold shadow-lg"
          disabled={!canProceedToDetails}
          onClick={() => setStep('details')}
          style={{ background: canProceedToDetails ? primaryColor : undefined }}
        >
          {canProceedToDetails ? (
            <>
              Continuar
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            'Selecciona fecha y hora'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default PublicReservationWidget;
