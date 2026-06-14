/**
 * Centralised logger. debug/info solo en dev; warn/error siempre.
 */
const isDev =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV === true;

type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs) => { if (isDev) console.debug(...args); },
  info:  (...args: LogArgs) => { if (isDev) console.info(...args); },
  log:   (...args: LogArgs) => { if (isDev) console.log(...args); },
  warn:  (...args: LogArgs) => { console.warn(...args); },
  error: (...args: LogArgs) => { console.error(...args); },
};

export default logger;
