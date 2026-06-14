/**
 * Etiquetas i18n (es-CO) para enums que se muestran en la UI.
 * Centraliza traducciones para no esparcir switch/case por componentes.
 *
 * Uso:
 *   import { labelFor } from '@/lib/enumLabels';
 *   labelFor('payment_method', 'efectivo') // -> 'Efectivo'
 *   labelFor('difficulty', 'media')        // -> 'Media'
 */

export const ENUM_LABELS = {
  payment_method: {
    efectivo: 'Efectivo',
    tarjeta_credito: 'Tarjeta de crédito',
    tarjeta_debito: 'Tarjeta de débito',
    tarjeta: 'Tarjeta',
    nequi: 'Nequi',
    daviplata: 'Daviplata',
    bancolombia_transfer: 'Transferencia Bancolombia',
    transferencia: 'Transferencia',
    qr: 'Pago QR',
    cortesia: 'Cortesía',
    otro: 'Otro',
  },
  difficulty: {
    facil: 'Fácil',
    media: 'Media',
    dificil: 'Difícil',
  },
  reservation_source: {
    phone: 'Teléfono',
    walk_in: 'Sin reserva',
    website: 'Sitio web',
    whatsapp: 'WhatsApp',
    app: 'App',
  },
  reward_type: {
    discount_percent: 'Descuento %',
    discount_fixed: 'Descuento fijo',
    free_item: 'Producto gratis',
    free_delivery: 'Domicilio gratis',
    experience: 'Experiencia',
    upgrade: 'Upgrade',
  },
  campaign_type: {
    points_multiplier: 'Multiplicador de puntos',
    bonus_points: 'Puntos bonus',
    birthday: 'Cumpleaños',
    reactivation: 'Reactivación',
    referral: 'Referidos',
    achievement: 'Logro',
  },
  order_status: {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    preparing: 'En preparación',
    ready: 'Lista',
    delivered: 'Entregada',
    cancelled: 'Cancelada',
    paid: 'Pagada',
  },
  transaction_type: {
    earn: 'Ganados',
    redeem: 'Canjeados',
    bonus: 'Bonus',
    expire: 'Expirados',
    adjustment: 'Ajuste',
  },
  achievement_type: {
    orders_count: 'Cantidad de órdenes',
    total_spent: 'Total gastado',
    streak: 'Racha',
    referrals: 'Referidos',
    reviews: 'Reseñas',
    custom: 'Personalizado',
  },
} as const;

type EnumGroup = keyof typeof ENUM_LABELS;

export function labelFor<G extends EnumGroup>(
  group: G,
  value: string | null | undefined,
): string {
  if (!value) return '—';
  const map = ENUM_LABELS[group] as Record<string, string>;
  return map[value] ?? value.replace(/_/g, ' ');
}

/** Devuelve [{ value, label }] útil para <Select>. */
export function optionsFor<G extends EnumGroup>(group: G) {
  return Object.entries(ENUM_LABELS[group]).map(([value, label]) => ({
    value,
    label: label as string,
  }));
}
