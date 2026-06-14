/**
 * Centralised logger.
 * - debug / info: solo en desarrollo (import.meta.env.DEV)
 * - warn / error: siempre (para Sentry/console en prod)
 *
 * Uso:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('foo', { bar });
 *   logger.error('algo falló', err);
 *
 * Migración gradual: reemplaza console.log/info por logger.debug/info.
 * Mantén console.error/warn solo donde quieras que llegue a producción
 * o usa logger.error/warn (equivalente).
 */

const isDev =
  typeof import.meta !== 'undefined' &&
  // @ts-expect-error vite env
  import.meta.env?.DEV === true;

type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs) => {
    if (isDev) console.debug(...args);
  },
  info: (...args: LogArgs) => {
    if (isDev) console.info(...args);
  },
  log: (...args: LogArgs) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: LogArgs) => {
    console.warn(...args);
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};

export default logger;
