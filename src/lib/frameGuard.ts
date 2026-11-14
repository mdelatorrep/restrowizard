/**
 * B-15: impide que restrowizard.co se muestre dentro de un iframe de otro sitio
 * (clickjacking sobre el POS o el panel). Es el reemplazo de `frame-ancestors`
 * mientras el hosting no permita cabeceras propias (B-05).
 *
 * Solo actúa en el dominio público: el editor de Lovable muestra la app en un
 * iframe de vista previa y debe seguir funcionando.
 */
const PROTECTED_HOSTS = new Set(['restrowizard.co', 'www.restrowizard.co']);

export function enforceNoFraming(): void {
  if (typeof window === 'undefined') return;
  if (!PROTECTED_HOSTS.has(window.location.hostname)) return;
  if (window.self === window.top) return;
  try {
    // Si el marco es del mismo sitio (no debería ocurrir), se deja.
    if (window.top?.location.hostname === window.location.hostname) return;
  } catch {
    /* origen distinto: no se puede leer, que es justamente el caso a bloquear */
  }
  document.documentElement.style.display = 'none';
  try {
    window.top!.location.href = window.location.href;
  } catch {
    /* el marco está aislado: la página queda en blanco, que es lo seguro */
  }
}
