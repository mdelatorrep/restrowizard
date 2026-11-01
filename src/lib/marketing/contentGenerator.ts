/**
 * Marketing gastronómico guiado por margen y calendario.
 *
 * El contenido no se escribe "a ojo": cada momento (partido, festivo, día
 * flojo) empuja los platos que más margen dejan y que tienen espacio para
 * vender más (rompecabezas antes que estrellas), y cualquier oferta respeta un
 * piso de margen. Todo es determinístico: funciona sin IA y se puede editar.
 */

export type Quadrant = 'estrella' | 'caballo' | 'rompecabezas' | 'perro' | 'sin_costo';

export interface MenuOpportunity {
  id: string;
  name: string;
  category: string;
  price: number;
  net_price: number;
  cost: number | null;
  margin: number;
  margin_pct: number | null;
  units: number;
  revenue: number;
  contribution: number;
  has_cost: boolean;
  quadrant: Quadrant;
}

export type MomentKind = 'deporte' | 'festivo' | 'dia_flojo' | 'brunch' | 'otro';

export interface MarketingMoment {
  key: string;
  date: string; // yyyy-MM-dd
  time: string | null; // HH:MM[:SS]
  title: string;
  kind: MomentKind;
  lift: number | null;
}

export interface OfferSuggestion {
  type: 'combo' | 'valor_agregado';
  label: string;
  regularPrice: number;
  offerPrice: number;
  discountPct: number;
  marginPctAfter: number | null;
}

export type Channel = 'instagram' | 'story' | 'whatsapp' | 'google';

export interface GeneratedPiece {
  channel: Channel;
  title: string;
  body: string;
  /** Hora sugerida de publicación, 'yyyy-MM-ddTHH:MM' en hora de Bogotá. */
  publishAt: string;
}

export interface BusinessContext {
  restaurantName: string;
  city?: string | null;
  neighborhood?: string | null;
  reservationUrl?: string | null;
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  instagram: 'Instagram (post)',
  story: 'Historia',
  whatsapp: 'WhatsApp a clientes',
  google: 'Google (perfil del negocio)',
};

export const QUADRANT_INFO: Record<Quadrant, { label: string; action: string }> = {
  estrella: { label: 'Estrella', action: 'Vende mucho y deja buen margen: mantenlo visible y no le toques el precio.' },
  rompecabezas: { label: 'Rompecabezas', action: 'Deja buen margen pero se vende poco: es el que más vale la pena promocionar.' },
  caballo: { label: 'Caballo de batalla', action: 'Se vende mucho con poco margen: súbele el precio un poco o empácalo en combo.' },
  perro: { label: 'Perro', action: 'Ni vende ni deja: reformúlalo o sácalo de la carta.' },
  sin_costo: { label: 'Sin costo', action: 'Sin receta costeada no se sabe si deja plata: costéalo antes de promocionarlo.' },
};

const SHAREABLE = /(compartir|picada|alitas|wings|nacho|costilla|tender|poutine|para 4|bucket|combo)/i;
const DRINK = /(cerveza|cubeta|aguardiente|ron|whisky|tequila|mule|margarita|mojito|old fashioned|c[oó]ctel|shot|limonada|bebida|licor)/i;
const BRUNCH = /(brunch|waffle|pancake|huevo|desayuno)/i;

const isDrink = (i: MenuOpportunity) => DRINK.test(`${i.category} ${i.name}`);
const QUADRANT_RANK: Record<Quadrant, number> = { rompecabezas: 0, estrella: 1, caballo: 2, perro: 3, sin_costo: 4 };

/** Rompecabezas primero (necesitan empujón), luego estrellas; a igualdad, más margen en pesos. */
const byPushPriority = (a: MenuOpportunity, b: MenuOpportunity) =>
  QUADRANT_RANK[a.quadrant] - QUADRANT_RANK[b.quadrant] || b.margin - a.margin;

const promotable = (items: MenuOpportunity[]) =>
  items.filter(i => i.has_cost && (i.quadrant === 'rompecabezas' || i.quadrant === 'estrella'));

export const pickHeroItems = (
  items: MenuOpportunity[],
  moment: Pick<MarketingMoment, 'kind'>,
): { food: MenuOpportunity | null; drink: MenuOpportunity | null } => {
  const pool = promotable(items);
  const foods = pool.filter(i => !isDrink(i));
  const drinks = pool.filter(isDrink).sort(byPushPriority);
  let food: MenuOpportunity | undefined;
  if (moment.kind === 'brunch') {
    food = foods.filter(i => BRUNCH.test(`${i.category} ${i.name}`)).sort(byPushPriority)[0];
  } else if (moment.kind === 'deporte' || moment.kind === 'festivo') {
    food = foods.filter(i => SHAREABLE.test(`${i.category} ${i.name}`)).sort(byPushPriority)[0];
  }
  food = food || foods.filter(i => !BRUNCH.test(`${i.category} ${i.name}`)).sort(byPushPriority)[0] || foods.sort(byPushPriority)[0];
  return { food: food || null, drink: drinks[0] || null };
};

/**
 * Combo plato + bebida con el mayor descuento que deja el margen por encima del
 * piso (60 % por defecto, es decir costo de insumos ≤ 40 % del precio de la
 * oferta), con tope de 15 %. Si el margen no da para al menos 5 %, no se
 * descuenta: se ofrece valor agregado.
 */
export const suggestOffer = (
  food: MenuOpportunity | null,
  drink: MenuOpportunity | null,
  floorMarginPct = 60,
  maxDiscountPct = 15,
): OfferSuggestion | null => {
  const parts = [food, drink].filter((x): x is MenuOpportunity => !!x);
  if (parts.length === 0) return null;
  const regular = parts.reduce((s, p) => s + p.price, 0);
  const net = parts.reduce((s, p) => s + p.net_price, 0);
  const cost = parts.reduce((s, p) => s + (p.cost || 0), 0);
  const label = parts.map(p => p.name).join(' + ');
  if (net <= 0) return null;

  const floor = floorMarginPct / 100;
  const maxD = Math.min(maxDiscountPct / 100, Math.max(0, 1 - cost / (net * (1 - floor))));
  // Se redondea HACIA ARRIBA a miles: hacia abajo pasaba el tope de descuento y podía romper el piso de margen.
  const offerPrice = Math.ceil((regular * (1 - maxD)) / 1000) * 1000;
  const discount = regular > 0 ? 1 - offerPrice / regular : 0;
  if (parts.length < 2 || discount < 0.05) {
    return {
      type: 'valor_agregado', label, regularPrice: regular, offerPrice: regular, discountPct: 0,
      marginPctAfter: Math.round(((net - cost) / net) * 1000) / 10,
    };
  }
  const netAfter = offerPrice * (net / regular);
  return {
    type: 'combo', label, regularPrice: regular, offerPrice,
    discountPct: Math.round(discount * 1000) / 10,
    marginPctAfter: Math.round(((netAfter - cost) / netAfter) * 1000) / 10,
  };
};

// ── Texto ─────────────────────────────────────────────────────────────────

const COP = (v: number) => `$${Math.round(v).toLocaleString('es-CO')}`;

export const formatTime = (t: string | null | undefined): string => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${suffix}`;
};

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const weekdayOf = (day: string) => WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];

const hashtag = (s: string) =>
  '#' + s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('');

export const hashtagsFor = (ctx: BusinessContext, moment: MarketingMoment): string[] => {
  const tags = [hashtag(ctx.restaurantName)];
  if (ctx.city) tags.push(hashtag(ctx.city));
  if (ctx.neighborhood) tags.push(hashtag(ctx.neighborhood));
  const t = moment.title.toLowerCase();
  if (t.includes('nfl') || t.includes('football')) tags.push('#NFL');
  if (t.includes('champions')) tags.push('#ChampionsLeague');
  if (t.includes('premier')) tags.push('#PremierLeague');
  if (moment.kind === 'deporte') tags.push('#SportsBar');
  if (moment.kind === 'brunch') tags.push('#Brunch');
  return [...new Set(tags)];
};

/** Resta horas a fecha+hora local 'yyyy-MM-dd' 'HH:MM' → 'yyyy-MM-ddTHH:MM' (local). */
const minusHours = (day: string, time: string, hours: number) => {
  const [h, m] = time.split(':').map(Number);
  // Se opera como si fuera UTC solo para hacer la resta; el resultado se lee como hora local.
  const base = Date.parse(`${day}T00:00:00Z`) + (h * 60 + (m || 0)) * 60_000 - hours * 3_600_000;
  return new Date(base).toISOString().slice(0, 16);
};

export const suggestedPublishTimes = (moment: MarketingMoment): Record<Channel, string> => {
  if (moment.time) {
    const [h] = moment.time.split(':').map(Number);
    // Partido de noche: el WhatsApp sale al mediodía, cuando se arma el plan.
    const whatsapp = h >= 17 ? `${moment.date}T12:00` : minusHours(moment.date, moment.time, 4);
    return {
      instagram: minusHours(moment.date, moment.time, 3),
      story: minusHours(moment.date, moment.time, 1),
      whatsapp,
      google: minusHours(moment.date, moment.time, 5),
    };
  }
  return {
    instagram: `${moment.date}T11:30`, story: `${moment.date}T17:00`,
    whatsapp: `${moment.date}T12:00`, google: `${moment.date}T10:00`,
  };
};

export interface GeneratedContent {
  food: MenuOpportunity | null;
  drink: MenuOpportunity | null;
  offer: OfferSuggestion | null;
  pieces: GeneratedPiece[];
}

export const generateContent = (
  ctx: BusinessContext,
  moment: MarketingMoment,
  items: MenuOpportunity[],
  floorMarginPct = 60,
): GeneratedContent => {
  const { food, drink } = pickHeroItems(items, moment);
  const offer = suggestOffer(food, drink, floorMarginPct);
  const when = moment.time ? `a las ${formatTime(moment.time)}` : '';
  const dish = [food?.name, drink?.name].filter(Boolean).join(' y ');
  const reserve = ctx.reservationUrl ? `Reserva aquí: ${ctx.reservationUrl}` : 'Reserva por DM o en el link de la bio.';
  const tags = hashtagsFor(ctx, moment).join(' ');
  const times = suggestedPublishTimes(moment);
  const place = [ctx.restaurantName, ctx.neighborhood].filter(Boolean).join(', ');

  const offerLine = offer?.type === 'combo'
    ? `Combo ${offer.label} a ${COP(offer.offerPrice)} (normal ${COP(offer.regularPrice)}).`
    : moment.kind === 'deporte'
      ? 'Llega temprano: las mesas frente a la pantalla grande se van primero.'
      : food ? `Pide la ${food.name}: la receta de la casa que más gente repite.` : '';

  let headline: string;
  let intro: string;
  switch (moment.kind) {
    case 'deporte':
      headline = `${moment.title} ${when}`.trim();
      intro = `Hoy ${moment.title} ${when}. Pantallas gigantes, sonido de estadio y ${dish || 'la cocina abierta'} para acompañar.`.replace(/\s+/g, ' ');
      break;
    case 'festivo':
      headline = `${moment.title}: abrimos`;
      intro = `${moment.title} y la ciudad descansa: nosotros abrimos. ${dish ? `${dish} para el plan del día.` : ''}`.trim();
      break;
    case 'brunch':
      headline = `Brunch de ${weekdayOf(moment.date)}`;
      intro = `Brunch de ${weekdayOf(moment.date)}${food ? ` con ${food.name}` : ''}${drink ? ` y ${drink.name}` : ''}.`;
      break;
    case 'dia_flojo': {
      const d = weekdayOf(moment.date);
      headline = `${d[0].toUpperCase()}${d.slice(1)} en ${ctx.restaurantName}`;
      intro = `¿Plan de ${d}? ${food ? `La ${food.name}` : 'La cocina'}${drink ? ` con ${drink.name}` : ''} te está esperando.`;
      break;
    }
    default:
      headline = moment.title;
      intro = `${moment.title}. ${dish}`.trim();
  }

  const pieces: GeneratedPiece[] = [
    {
      channel: 'instagram',
      title: headline,
      body: [intro, offerLine, reserve, tags].filter(Boolean).join('\n\n'),
      publishAt: times.instagram,
    },
    {
      channel: 'story',
      title: headline,
      body: [headline, dish, offer?.type === 'combo' ? `Combo a ${COP(offer.offerPrice)}` : '', 'Desliza para reservar 👆']
        .filter(Boolean).join('\n'),
      publishAt: times.story,
    },
    {
      channel: 'whatsapp',
      title: headline,
      body: [
        `Hola {{nombre}} 👋 ${intro}`,
        offerLine,
        '¿Te apartamos mesa? Respóndenos con cuántas personas vienen.',
        'Si no quieres recibir estos mensajes, responde NO.',
      ].filter(Boolean).join('\n\n'),
      publishAt: times.whatsapp,
    },
    {
      channel: 'google',
      title: headline,
      body: [`${intro.replace(/^Hoy /, `${weekdayOf(moment.date)[0].toUpperCase()}${weekdayOf(moment.date).slice(1)} `)} En ${place}.`, offerLine, reserve]
        .filter(Boolean).join(' '),
      publishAt: times.google,
    },
  ];

  // "a las 7:20 p. m." + ". " dejaba "p. m.." en el texto.
  const tidy = (t: string) => t.replace(/\.(\s*)\./g, '.$1').replace(/[ \t]{2,}/g, ' ');
  return { food, drink, offer, pieces: pieces.map(p => ({ ...p, title: tidy(p.title), body: tidy(p.body) })) };
};

// ── Momentos ──────────────────────────────────────────────────────────────

export interface DemandEventRow {
  id: string;
  event_date: string;
  start_time: string | null;
  title: string;
  category: string;
  expected_lift: number | null;
}

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/**
 * Momentos de las próximas `days` jornadas: cada evento del calendario, más el
 * día más flojo de la semana (cuando no tiene evento), que es donde el
 * contenido mueve la aguja. `slowWeekday` es 0=domingo … 6=sábado.
 */
export const buildMoments = (
  events: DemandEventRow[],
  today: string,
  slowWeekday: number | null,
  days = 14,
  hasBrunch = false,
): MarketingMoment[] => {
  const end = addDays(today, days - 1);
  const moments: MarketingMoment[] = events
    .filter(e => e.event_date >= today && e.event_date <= end)
    .map(e => ({
      key: `ev:${e.id}`, date: e.event_date, time: e.start_time, title: e.title,
      kind: (['deporte', 'festivo'].includes(e.category) ? e.category : 'otro') as MomentKind,
      lift: e.expected_lift != null ? Number(e.expected_lift) : null,
    }));
  const eventDays = new Set(moments.map(m => m.date));
  for (let i = 0; i < days; i++) {
    const d = addDays(today, i);
    const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (slowWeekday !== null && wd === slowWeekday && !eventDays.has(d)) {
      moments.push({ key: `slow:${d}`, date: d, time: null, title: `${weekdayOf(d)[0].toUpperCase()}${weekdayOf(d).slice(1)}, el día más flojo de la semana`, kind: 'dia_flojo', lift: null });
    }
    if (hasBrunch && wd === 6) {
      moments.push({ key: `brunch:${d}`, date: d, time: '10:00', title: 'Brunch de fin de semana', kind: 'brunch', lift: null });
    }
  }
  return moments.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'));
};

/** Día de la semana con menor venta promedio (0=domingo). */
export const slowestWeekday = (daily: { date: string; total_revenue: number }[]): number | null => {
  const sums = new Map<number, { s: number; n: number }>();
  for (const d of daily) {
    const wd = new Date(`${d.date}T12:00:00Z`).getUTCDay();
    const cur = sums.get(wd) || { s: 0, n: 0 };
    sums.set(wd, { s: cur.s + d.total_revenue, n: cur.n + 1 });
  }
  let best: number | null = null;
  let bestAvg = Infinity;
  sums.forEach((v, wd) => {
    const avg = v.s / v.n;
    if (v.n >= 2 && avg < bestAvg) { bestAvg = avg; best = wd; }
  });
  return best;
};
