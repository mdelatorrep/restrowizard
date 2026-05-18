// Shared constants and types for NewQuotation step components.
export const eventTypes = [
  { value: 'corporativo', label: 'Evento Corporativo' },
  { value: 'social', label: 'Evento Social' },
  { value: 'boda', label: 'Boda' },
  { value: 'cumpleaños', label: 'Cumpleaños' },
  { value: 'conferencia', label: 'Conferencia/Seminario' },
  { value: 'otro', label: 'Otro' },
];

export const menuCategories = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'plato_fuerte', label: 'Plato Fuerte' },
  { value: 'postre', label: 'Postre' },
  { value: 'bebida', label: 'Bebida' },
  { value: 'aperitivo', label: 'Aperitivo' },
];

export const serviceTypes = [
  { value: 'musica', label: 'Música en Vivo' },
  { value: 'dj', label: 'DJ' },
  { value: 'show', label: 'Show/Entretenimiento' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'fotografia', label: 'Fotografía/Video' },
  { value: 'otro', label: 'Otro Servicio' },
];

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
