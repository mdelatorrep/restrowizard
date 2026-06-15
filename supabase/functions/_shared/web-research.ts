/**
 * Web Research — capa pluggable de búsqueda web para edge functions de IA.
 *
 * Diseño:
 *  - `webResearch(query, opts)` devuelve `{ sources, provider, enabled }`.
 *  - Si NO hay proveedor configurado (`FIRECRAWL_API_KEY` ausente), retorna
 *    `{ sources: [], enabled: false }` sin lanzar error. Las funciones llaman
 *    siempre y los guardrails se encargan de exigir evidencia cuando aplique.
 *  - Cuando el usuario active Firecrawl (o conectemos Gemini directo), basta
 *    con setear el secret correspondiente: cero cambios en los callers.
 *
 * Proveedores soportados (en orden de preferencia):
 *   1. Firecrawl  (FIRECRAWL_API_KEY)  → /v1/search con scrape markdown
 *   2. (futuro)  Gemini direct grounding (GEMINI_API_KEY)
 */

export interface WebSource {
  title: string;
  url: string;
  snippet: string;
  /** Markdown opcional (Firecrawl scrape). Truncado a ~1200 chars. */
  content?: string;
  publishedAt?: string;
}

export interface WebResearchResult {
  enabled: boolean;
  provider: "none" | "firecrawl" | "gemini";
  sources: WebSource[];
  /** Si hubo intento y falló (no debe romper el flujo IA). */
  error?: string;
}

export interface WebResearchOptions {
  /** Máx resultados a devolver. Default 4. */
  limit?: number;
  /** Si true, hace scrape de contenido (solo Firecrawl). Default false. */
  scrape?: boolean;
  /** País / región para sesgar resultados (ej. "mx", "co"). */
  country?: string;
  logPrefix?: string;
}

const FIRECRAWL_URL = "https://api.firecrawl.dev/v1/search";

function truncate(s: string | undefined, n = 1200): string | undefined {
  if (!s) return undefined;
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function firecrawlSearch(
  apiKey: string,
  query: string,
  opts: WebResearchOptions,
): Promise<WebResearchResult> {
  const log = opts.logPrefix ?? "[web-research:firecrawl]";
  try {
    const body: Record<string, unknown> = {
      query,
      limit: opts.limit ?? 4,
    };
    if (opts.scrape) {
      body.scrapeOptions = { formats: ["markdown"], onlyMainContent: true };
    }
    if (opts.country) body.country = opts.country;

    const res = await fetch(FIRECRAWL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.warn(`${log} ${res.status}: ${txt}`);
      return { enabled: true, provider: "firecrawl", sources: [], error: `firecrawl_${res.status}` };
    }

    const data = await res.json();
    const items = Array.isArray(data?.data) ? data.data : [];
    const sources: WebSource[] = items.map((it: any) => ({
      title: it.title ?? it.metadata?.title ?? it.url ?? "Sin título",
      url: it.url ?? it.metadata?.sourceURL ?? "",
      snippet: it.description ?? it.metadata?.description ?? "",
      content: truncate(it.markdown),
      publishedAt: it.metadata?.publishedDate,
    })).filter((s: WebSource) => s.url);

    console.log(`${log} ok: ${sources.length} fuentes`);
    return { enabled: true, provider: "firecrawl", sources };
  } catch (err) {
    console.error(`${log} excepción:`, err);
    return {
      enabled: true,
      provider: "firecrawl",
      sources: [],
      error: (err as Error)?.message ?? "firecrawl_exception",
    };
  }
}

/**
 * Ejecuta investigación web si hay proveedor configurado. Nunca lanza.
 */
export async function webResearch(
  query: string,
  opts: WebResearchOptions = {},
): Promise<WebResearchResult> {
  if (!query?.trim()) {
    return { enabled: false, provider: "none", sources: [] };
  }
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (firecrawlKey) {
    return await firecrawlSearch(firecrawlKey, query, opts);
  }
  // Sin proveedor: modo guardrails-only.
  return { enabled: false, provider: "none", sources: [] };
}

/**
 * Formatea fuentes para inyectar en el prompt del modelo.
 * Si no hay fuentes, devuelve un bloque explícito que el modelo DEBE respetar.
 */
export function formatSourcesForPrompt(result: WebResearchResult): string {
  if (!result.enabled) {
    return [
      "### CONTEXTO WEB",
      "No hay acceso a búsqueda web en esta ejecución.",
      "→ NO inventes datos de mercado, precios actuales, eventos, clima, regulaciones, benchmarks o nombres de proveedores.",
      "→ Si necesitas un dato externo, indícalo explícitamente como 'Información no disponible — requiere verificación'.",
    ].join("\n");
  }
  if (result.sources.length === 0) {
    return [
      "### CONTEXTO WEB",
      `Búsqueda web ejecutada (${result.provider}) pero sin resultados${result.error ? ` (${result.error})` : ""}.`,
      "→ NO inventes datos externos. Trabaja solo con la información estructurada provista por el usuario.",
    ].join("\n");
  }
  const blocks = result.sources.map((s, i) => {
    const parts = [
      `[Fuente ${i + 1}] ${s.title}`,
      `URL: ${s.url}`,
      s.publishedAt ? `Publicado: ${s.publishedAt}` : null,
      s.snippet ? `Resumen: ${s.snippet}` : null,
      s.content ? `Extracto:\n${s.content}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  });
  return [
    "### CONTEXTO WEB (fuentes verificadas)",
    `Proveedor: ${result.provider}. Usa SOLO estos datos para afirmaciones externas y cítalos como [Fuente N].`,
    ...blocks,
  ].join("\n\n");
}
