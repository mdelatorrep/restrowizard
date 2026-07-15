/**
 * B-37 — Lectura tolerante de las líneas de `restaurant_orders.items` (jsonb).
 *
 * El campo NO tiene una forma única: conviven dos convenciones según quién
 * escribió el pedido.
 *   - `price`      → CreateOrderDialog, website-public-order (pedidos web/manuales)
 *   - `unit_price` → POSMain, usePOSOrder / pos-standalone, useOfflineSync,
 *                    pos-payment-processor (todo lo que nace en el POS)
 *
 * Los lectores analíticos (reportes de ventas, ingeniería de menú) leían solo
 * `price`, así que TODA venta de POS entraba con ingreso 0: los platos más
 * vendidos en caja no aparecían en el top y la matriz BCG los clasificaba como
 * "perros" por facturación cero.
 *
 * Estos helpers leen ambas formas. Se usan en los lectores; los escritores
 * pueden converger después sin romper el histórico ya guardado.
 */
export interface OrderItemLike {
  menu_item_id?: string | null;
  id?: string | null;
  name?: string | null;
  price?: number | string | null;
  unit_price?: number | string | null;
  quantity?: number | string | null;
  modifiers?: { name?: string; price?: number }[] | null;
}

/** Precio unitario de la línea, sea `price` o `unit_price`. */
export const getLineUnitPrice = (item: OrderItemLike): number => {
  const raw = item?.price ?? item?.unit_price;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

/** Cantidad de la línea (por defecto 1, igual que el comportamiento previo). */
export const getLineQuantity = (item: OrderItemLike): number => {
  const n = Number(item?.quantity);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

/** Nombre visible de la línea. */
export const getLineName = (item: OrderItemLike): string =>
  (item?.name || '').toString().trim() || 'Sin nombre';

/** Id del ítem de menú, sea `menu_item_id` o `id`. */
export const getLineMenuItemId = (item: OrderItemLike): string | null =>
  (item?.menu_item_id ?? item?.id ?? null) as string | null;

/** Suma de modificadores de la línea (por unidad). */
export const getLineModifiersTotal = (item: OrderItemLike): number =>
  (item?.modifiers || []).reduce((s, m) => s + (Number(m?.price) || 0), 0);

/** Ingreso total de la línea: (unitario + modificadores) × cantidad. */
export const getLineRevenue = (item: OrderItemLike): number =>
  (getLineUnitPrice(item) + getLineModifiersTotal(item)) * getLineQuantity(item);

/** Normaliza el array `items` de un pedido a algo iterable con seguridad. */
export const toOrderLines = (items: unknown): OrderItemLike[] =>
  Array.isArray(items) ? (items as OrderItemLike[]) : [];
