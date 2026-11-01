/**
 * Restaurante demo público ("Clutch Sports Bar & Grill", ficticio).
 * Las cuentas son públicas a propósito: los datos se reconstruyen cada noche
 * (seed_demo_restaurant, 04:05 Bogotá) y cada hora se simulan las ventas.
 */
export type DemoRole = 'owner' | 'manager' | 'cashier';

export interface DemoAccount {
  role: DemoRole;
  userId: string;
  email: string;
  password: string;
  person: string;
  title: string;
  pitch: string;
  highlights: string[];
  landing: string;
}

const DEMO_PASSWORD = 'DemoRestro2026';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'owner',
    userId: 'de300000-0000-4000-8000-000000000001',
    email: 'demo.dueno@restrowizard.app',
    password: DEMO_PASSWORD,
    person: 'Andrés Restrepo',
    title: 'Dueño',
    pitch: 'La plata del negocio en una pantalla: lo que se vendió, lo que costó y lo que queda.',
    highlights: ['P&L real con costo de alimentos y nómina', 'Margen por plato y por categoría', 'Cuentas por pagar a proveedores'],
    landing: '/r/dashboard',
  },
  {
    role: 'manager',
    userId: 'de300000-0000-4000-8000-000000000002',
    email: 'demo.gerente@restrowizard.app',
    password: DEMO_PASSWORD,
    person: 'Valentina Ochoa',
    title: 'Gerente',
    pitch: 'El lunes del gerente: liquidar la quincena de propinas y armar el horario de la semana de partidos.',
    highlights: ['Propinas por cargo, cuadradas al peso', 'Horario generado según la demanda y el calendario deportivo', 'Inventario con alertas de reorden'],
    landing: '/r/talent?tab=tips',
  },
  {
    role: 'cashier',
    userId: 'de300000-0000-4000-8000-000000000003',
    email: 'demo.cajero@restrowizard.app',
    password: DEMO_PASSWORD,
    person: 'Laura Gómez',
    title: 'Cajero',
    pitch: 'El punto de venta del turno: mesas, comandas, cobro y cierre de caja.',
    highlights: ['Mapa de mesas', 'Cobro con propina sugerida', 'Cierre de caja con cuadre'],
    landing: '/r/pos',
  },
];

const DEMO_IDS = new Set(DEMO_ACCOUNTS.map(a => a.userId));

export const isDemoUserId = (userId?: string | null): boolean => !!userId && DEMO_IDS.has(userId);

export const DEMO_BUSINESS_NAME = 'Clutch Sports Bar & Grill';
