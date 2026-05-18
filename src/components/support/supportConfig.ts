import { Clock, MessageSquare, User, CheckCircle } from 'lucide-react';

export const ticketTypeConfig: Record<string, { label: string; color: string }> = {
  peticion: { label: 'Petición', color: 'bg-blue-100 text-blue-800' },
  queja: { label: 'Queja', color: 'bg-orange-100 text-orange-800' },
  reclamo: { label: 'Reclamo', color: 'bg-red-100 text-red-800' },
  sugerencia: { label: 'Sugerencia', color: 'bg-green-100 text-green-800' },
  felicitacion: { label: 'Felicitación', color: 'bg-purple-100 text-purple-800' },
};

export const ticketPriorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

export const ticketStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Abierto', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
  in_progress: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending_customer: { label: 'Esperando Cliente', color: 'bg-orange-100 text-orange-800', icon: User },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

export const TICKET_TYPE_OPTIONS = [
  { value: 'peticion', label: 'Petición' },
  { value: 'queja', label: 'Queja' },
  { value: 'reclamo', label: 'Reclamo' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'felicitacion', label: 'Felicitación' },
];

export const TICKET_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export const TICKET_STATUS_OPTIONS = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'pending_customer', label: 'Esperando Cliente' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
];
