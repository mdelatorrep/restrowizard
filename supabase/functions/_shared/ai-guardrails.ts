/**
 * AI Guardrails — bloques de prompt y validadores anti-alucinación.
 *
 * Filosofía:
 *  - El modelo SIEMPRE recibe reglas duras de honestidad antes que el rol.
 *  - Si no hay evidencia (interna o web), debe NEGARSE explícitamente en vez
 *    de inventar. El usuario eligió "negarse explícitamente".
 *  - Toda afirmación cuantitativa externa (precios, %, benchmarks, leyes)
 *    debe citar [Fuente N] o marcarse como "no verificado".
 */

export interface GuardrailOptions {
  /** Idioma de respuesta. Default "es". */
  language?: "es" | "en";
  /** Si la respuesta debe ser JSON estricto. */
  jsonOutput?: boolean;
  /** Dominio del experto (ej. "costeo de recetas", "ESG"). */
  domain?: string;
  /** Si true, agrega instrucción de incluir `confidence` y `sources_used`. */
  requireConfidence?: boolean;
  /**
   * Si true, cuando no hay CONTEXTO WEB el modelo PUEDE entregar estimaciones
   * internas (marcadas con "Estimación:" y `confidence` bajo) en vez de
   * negarse. Necesario para esquemas con campos numéricos obligatorios
   * (benchmarks, percentiles, ROI), donde devolver strings de negativa
   * rompe el UI cliente.
   */
  allowInternalEstimates?: boolean;
}

/**
 * Bloque de reglas anti-alucinación que se antepone al system prompt.
 */
export function buildGuardrailPrompt(opts: GuardrailOptions = {}): string {
  const lines = [
    "### REGLAS DE INTEGRIDAD (obligatorias)",
    "1. NO inventes datos. Si una cifra, precio, ley, evento, proveedor, benchmark o tendencia no está en los datos del usuario ni en el CONTEXTO WEB, declara textualmente: 'Información no disponible — requiere verificación'.",
    "2. NO uses conocimiento general como si fuera actual. Conocimientos previos al cutoff del modelo NO valen como evidencia para precios, regulaciones, eventos o tendencias actuales.",
    "3. CITA siempre. Cada afirmación externa cuantitativa debe ir seguida de [Fuente N] del CONTEXTO WEB. Si no hay fuente, marca el dato como 'no verificado'.",
    "4. DISTINGUE estimación de hecho. Estimaciones propias del modelo deben prefijarse con 'Estimación:' y justificarse con los datos internos provistos.",
    "5. NEGATIVA explícita. Si la pregunta requiere datos externos y no hay evidencia disponible, responde claramente que no puedes responder con rigor y explica qué dato falta.",
    "6. NO fabriques contactos. Nombres de proveedores, teléfonos, emails o direcciones SOLO se incluyen si vienen del CONTEXTO WEB con URL verificable.",
  ];
  if (opts.requireConfidence) {
    lines.push(
      "7. Incluye en la respuesta los campos `confidence` (0-100) y `sources_used` (array de URLs citadas). Si confidence < 50, agrega `caveats` con lo que falta verificar.",
    );
  }
  if (opts.jsonOutput) {
    lines.push(
      "8. Responde ÚNICAMENTE con JSON válido. Sin markdown, sin ```json fences, sin texto antes ni después.",
    );
  }
  if (opts.domain) {
    lines.push(`Rol: experto en ${opts.domain}. Mantén el rigor profesional incluso al negarte.`);
  }
  return lines.join("\n");
}

/**
 * Compose: guardrails + rol específico + contexto web.
 * Esta es la firma estándar para todas las funciones IA migradas.
 */
export function composeSystemPrompt(args: {
  guardrails?: GuardrailOptions;
  rolePrompt: string;
  webContextBlock?: string;
}): string {
  const parts = [
    buildGuardrailPrompt(args.guardrails ?? {}),
    "",
    args.rolePrompt,
  ];
  if (args.webContextBlock) {
    parts.push("", args.webContextBlock);
  }
  return parts.join("\n");
}

/**
 * Validador post-respuesta: detecta señales de alucinación.
 * No bloquea; agrega flags que el caller puede exponer al cliente.
 */
export interface IntegrityCheck {
  hasCitations: boolean;
  hasRefusal: boolean;
  hasUnverifiedFlag: boolean;
  suspiciousPatterns: string[];
}

const SUSPICIOUS = [
  /según (?:mi|nuestro) conocimiento/i,
  /aproximadamente \$[\d.,]+/i,
  /(?:el|la) precio promedio (?:actual|de mercado) (?:es|ronda)/i,
  /(?:teléfono|whatsapp|tel\.?)\s*[:\-]?\s*\+?\d{6,}/i,
];

export function checkIntegrity(text: string, webEnabled: boolean): IntegrityCheck {
  const t = text ?? "";
  const hasCitations = /\[Fuente\s*\d+\]/i.test(t);
  const hasRefusal = /información no disponible|requiere verificación|no puedo responder con rigor/i.test(t);
  const hasUnverifiedFlag = /no verificado|estimación:/i.test(t);
  const suspiciousPatterns: string[] = [];
  for (const re of SUSPICIOUS) {
    if (re.test(t)) suspiciousPatterns.push(re.source);
  }
  // Si web está apagado pero hay cifras de mercado sin flag, marcar.
  if (!webEnabled && !hasCitations && !hasUnverifiedFlag && /\$\s?\d/.test(t)) {
    suspiciousPatterns.push("precio_sin_fuente_ni_flag");
  }
  return { hasCitations, hasRefusal, hasUnverifiedFlag, suspiciousPatterns };
}
