/**
 * Interruptores de producto.
 *
 * Un módulo apagado aquí desaparece del menú, de la portada y de sus rutas
 * (redirigen al panel o al inicio). El código y las tablas se conservan para
 * reactivarlo cuando tenga contenido real y un responsable.
 *
 * Origen: análisis de completitud frente a la propuesta (14-nov-2026),
 * ítems C-02, C-03 y C-04 del backlog.
 */
export const FEATURES = {
  /** RestroJobs, RestroLearn, RestroServices, RestroGrowth, Eventos y portal de consultores (C-02). */
  ecosystem: false,
  /** Ghost kitchen, cadenas, nuevo negocio / preapertura / 90 días, escucha social y PQRS (C-03). */
  orphanModules: false,
  /** Integración con Rappi: se habilita al obtener acceso de aliado (C-04). */
  rappi: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export const isFeatureEnabled = (key: FeatureKey): boolean => FEATURES[key];
