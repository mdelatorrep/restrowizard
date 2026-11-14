/**
 * C-07: alta guiada. Del registro a sitio, carta y reservas publicados.
 * Funciones puras (probadas en quickSetup.test.ts) y la publicación en Supabase.
 */
import { supabase } from '@/integrations/supabase/client';

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export interface QuickDish {
  name: string;
  category: string;
  price: string;
}

/** "Clutch Sports Bar & Grill" → "clutch-sports-bar-grill" */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(slug);
}

/** Horario igual para todos los días abiertos, en el formato del editor del sitio. */
export function buildBusinessHours(open: string, close: string, closedDays: DayKey[]) {
  return Object.fromEntries(
    DAY_KEYS.map((d) => [d, closedDays.includes(d) ? { open, close, closed: true } : { open, close, closed: false }]),
  );
}

/**
 * Turnos de reserva cada hora, desde la apertura hasta una hora antes del cierre.
 * Si cierra después de medianoche (22:00 → 02:00) se cuenta hasta las 23:00.
 */
export function buildReservationSlots(open: string, close: string): string[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const start = toMin(open);
  let end = toMin(close);
  if (end <= start) end = 24 * 60;
  const slots: string[] = [];
  for (let t = Math.ceil(start / 60) * 60; t <= end - 60; t += 60) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:00`);
  }
  return slots;
}

export function validDishes(dishes: QuickDish[]): QuickDish[] {
  return dishes.filter((d) => d.name.trim() && Number(d.price) > 0);
}

/** Solo dígitos, con indicativo de Colombia si viene un celular de 10 dígitos. */
export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  return digits;
}

interface PublishInput {
  userId: string;
  restaurantName: string;
  city: string;
  slug: string;
  whatsapp: string;
  openTime: string;
  closeTime: string;
  closedDays: DayKey[];
  reservations: boolean;
  dishes: QuickDish[];
}

/** Publica sitio y carta. Devuelve el slug que quedó (puede llevar sufijo si ya existía). */
export async function publishQuickSite(input: PublishInput): Promise<string> {
  const base = isValidSlug(input.slug) ? input.slug : slugify(input.restaurantName) || 'mi-restaurante';
  const website = {
    user_id: input.userId,
    is_published: true,
    site_title: input.restaurantName,
    hero_title: input.restaurantName,
    hero_subtitle: input.city ? `Te esperamos en ${input.city}` : null,
    show_menu: true,
    show_reservations: input.reservations,
    show_delivery: false,
    show_contact: true,
    business_hours: buildBusinessHours(input.openTime, input.closeTime, input.closedDays),
    reservation_available_times: buildReservationSlots(input.openTime, input.closeTime),
    reservation_max_party_size: 10,
    whatsapp_number: normalizeWhatsapp(input.whatsapp),
  };

  let slug = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('restaurant_websites').insert({ ...website, slug });
    if (!error) break;
    if (error.code !== '23505' || attempt === 4) throw error;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const dishes = validDishes(input.dishes);
  if (dishes.length > 0) {
    const { data: menu, error: menuErr } = await supabase
      .from('restaurant_menus')
      .insert({ user_id: input.userId, name: 'Carta', status: 'published', public_url_slug: slug })
      .select('id')
      .single();
    if (menuErr) throw menuErr;

    const categories = [...new Set(dishes.map((d) => d.category.trim() || 'General'))];
    const { data: cats, error: catErr } = await supabase
      .from('menu_categories')
      .insert(categories.map((name, i) => ({ menu_id: menu.id, name, sort_order: i })))
      .select('id, name');
    if (catErr) throw catErr;
    const catId = new Map((cats ?? []).map((c) => [c.name, c.id]));

    const { error: itemsErr } = await supabase.from('menu_items').insert(
      dishes.map((d, i) => {
        const category = d.category.trim() || 'General';
        return {
          menu_id: menu.id,
          name: d.name.trim(),
          category,
          category_id: catId.get(category) ?? null,
          price: Number(d.price),
          sort_order: i,
          is_available: true,
        };
      }),
    );
    if (itemsErr) throw itemsErr;
  }
  return slug;
}

/** Cronómetro del alta: arranca al entrar al onboarding y se lee al publicar. */
const TIMER_KEY = 'rw_onboarding_started_at';
export function startOnboardingTimer(): void {
  try {
    if (!localStorage.getItem(TIMER_KEY)) localStorage.setItem(TIMER_KEY, String(Date.now()));
  } catch {
    /* sin almacenamiento: no hay cronómetro */
  }
}
export function readOnboardingMinutes(): number | null {
  try {
    const t = Number(localStorage.getItem(TIMER_KEY));
    if (!t) return null;
    localStorage.removeItem(TIMER_KEY);
    return Math.max(1, Math.round((Date.now() - t) / 60000));
  } catch {
    return null;
  }
}
