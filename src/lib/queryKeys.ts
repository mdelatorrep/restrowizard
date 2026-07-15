/**
 * Central query-key factory (B-06 — fundación de escalabilidad).
 *
 * Fuente única de verdad para las keys de TanStack Query, para que los hooks
 * compartan caché, deduzcan peticiones e invaliden de forma consistente.
 * Al migrar hooks de useState/useEffect a useQuery/useMutation, usar estas keys
 * en vez de arrays ad-hoc. Scopear siempre por el id de negocio/usuario de datos.
 *
 * Convención: qk.<dominio>.<sub>(...args) -> readonly unknown[]
 */
export const qk = {
  team: {
    members: (businessId?: string | null) => ['team-members', businessId] as const,
    permissions: (userId?: string | null) => ['team-permissions', userId] as const,
    customRoles: (businessId?: string | null) => ['custom-roles', businessId] as const,
  },
  pos: {
    session: (userId?: string | null) => ['pos-session', userId] as const,
    transactions: (sessionId?: string | null) => ['pos-transactions', sessionId] as const,
    discounts: (userId?: string | null) => ['pos-discounts', userId] as const,
    channels: (userId?: string | null) => ['pos-channels', userId] as const,
    menu: (userId?: string | null) => ['pos-menu', userId] as const,
    context: (slug?: string | null) => ['pos-context', slug] as const,
    liveMap: (userId?: string | null) => ['pos-live-map', userId] as const,
  },
  finances: {
    summary: (userId?: string | null, range?: string) => ['finances-summary', userId, range] as const,
    sales: (userId?: string | null) => ['finances-sales', userId] as const,
  },
  inventory: {
    items: (userId?: string | null) => ['inventory-items', userId] as const,
    movements: (userId?: string | null) => ['inventory-movements', userId] as const,
    conversions: (userId?: string | null) => ['unit-conversions', userId] as const,
  },
  menus: {
    all: (userId?: string | null) => ['menus', userId] as const,
    items: (menuId?: string | null) => ['menu-items', menuId] as const,
    itemsByUser: (userId?: string | null) => ['menu-items-user', userId] as const,
    availability: (userId?: string | null) => ['menu-availability', userId] as const,
    engineering: (userId?: string | null, periodDays?: number) => ['menu-engineering', userId, periodDays] as const,
  },
  recipes: {
    all: (userId?: string | null) => ['recipes', userId] as const,
    detail: (recipeId?: string | null) => ['recipe', recipeId] as const,
  },
  loyalty: {
    customers: (userId?: string | null) => ['loyalty-customers', userId] as const,
  },
  reservations: {
    all: (userId?: string | null) => ['reservations', userId] as const,
  },
  feedback: {
    all: (userId?: string | null) => ['feedback', userId] as const,
  },
  zones: {
    list: (consultantId?: string | null) => ['restaurant-zones', consultantId] as const,
  },
  operations: {
    data: (userId?: string | null) => ['operations', userId] as const,
    benchmarks: () => ['operations-benchmarks'] as const,
  },
  business: {
    taxConfig: (userId?: string | null) => ['business-tax-config', userId] as const,
  },
  consultant: {
    profile: (userId?: string | null) => ['consultant-profile', userId] as const,
    alerts: (consultantId?: string | null) => ['consultant-alerts', consultantId] as const,
    billing: (consultantId?: string | null) => ['consultant-billing', consultantId] as const,
  },
  modules: {
    prerequisites: (userId?: string | null) => ['module-prerequisites', userId] as const,
  },
  public: {
    menuBySlug: (slug?: string | null) => ['public-menu', slug] as const,
    userMenus: (userId?: string | null) => ['public-user-menus', userId] as const,
    menuItemsList: (menuId?: string | null) => ['public-menu-items', menuId] as const,
    restaurantData: (slug?: string | null) => ['public-restaurant-data', slug] as const,
  },
} as const;

export type QueryKeyFactory = typeof qk;
