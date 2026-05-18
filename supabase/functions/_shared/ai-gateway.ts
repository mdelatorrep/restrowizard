/**
 * Lovable AI Gateway — shared helper
 *
 * Reemplaza llamadas directas a OpenAI por la pasarela de Lovable, que es
 * OpenAI-compatible (`/v1/chat/completions`). Centraliza:
 *   - selección de modelo (mix automático fast / reasoning / cheap)
 *   - reintentos con backoff exponencial para 429 / 5xx
 *   - mapeo amistoso de 402 (créditos) y 429 (rate limit)
 *   - cabeceras requeridas por la pasarela
 *
 * NOTA: la pasarela NO soporta `tools: [{ type: 'web_search_preview' }]`.
 * Para herramientas usar AI SDK con `streamText` + `tool()` (Fase 2 del plan).
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type ModelTier = "fast" | "reasoning" | "cheap";

export type AIGatewayMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface AIGatewayOptions {
  messages: AIGatewayMessage[];
  /** "fast" → gemini-3-flash (default), "reasoning" → gpt-5.2, "cheap" → gemini-2.5-flash-lite */
  tier?: ModelTier;
  /** Override directo del modelo. Si se pasa, ignora `tier`. */
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Si es true, fuerza `response_format: { type: "json_object" }`. */
  jsonMode?: boolean;
  maxRetries?: number;
  logPrefix?: string;
}

export interface AIGatewaySuccess {
  ok: true;
  content: string;
  model: string;
  raw: any;
}

export interface AIGatewayFailure {
  ok: false;
  status: number;
  error: string;
}

export type AIGatewayResult = AIGatewaySuccess | AIGatewayFailure;

export function pickModel(tier: ModelTier = "fast"): string {
  switch (tier) {
    case "reasoning":
      return "openai/gpt-5.2";
    case "cheap":
      return "google/gemini-2.5-flash-lite";
    case "fast":
    default:
      return "google/gemini-3-flash-preview";
  }
}

function requireApiKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }
  return key;
}

/**
 * Llama al Lovable AI Gateway con reintentos.
 * Devuelve `{ ok: true, content }` o `{ ok: false, status, error }`.
 */
export async function callAIGateway(
  opts: AIGatewayOptions,
): Promise<AIGatewayResult> {
  const apiKey = requireApiKey();
  const model = opts.model ?? pickModel(opts.tier ?? "fast");
  const maxRetries = opts.maxRetries ?? 3;
  const log = opts.logPrefix ?? "[ai-gateway]";

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${log} → ${model} (attempt ${attempt}/${maxRetries})`);
      const response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        if (attempt < maxRetries) {
          const waitMs = Math.pow(2, attempt) * 1000;
          console.warn(`${log} 429 rate-limited, esperando ${waitMs}ms`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        return {
          ok: false,
          status: 429,
          error:
            "Límite de solicitudes excedido. Por favor espera unos segundos e intenta nuevamente.",
        };
      }

      if (response.status === 402) {
        return {
          ok: false,
          status: 402,
          error:
            "Se requieren créditos de IA. Agrega créditos en Ajustes → Workspace → Uso.",
        };
      }

      if (response.status >= 500 && attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 500;
        console.warn(`${log} ${response.status} server error, retry en ${waitMs}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!response.ok) {
        const txt = await response.text();
        console.error(`${log} error ${response.status}: ${txt}`);
        return {
          ok: false,
          status: response.status,
          error: `Error IA (${response.status})`,
        };
      }

      const data = await response.json();
      const content: string =
        data.choices?.[0]?.message?.content ?? "";
      return { ok: true, content, model, raw: data };
    } catch (err) {
      console.error(`${log} excepción attempt ${attempt}:`, err);
      if (attempt === maxRetries) {
        return {
          ok: false,
          status: 500,
          error: (err as Error)?.message ?? "Error desconocido",
        };
      }
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }

  return { ok: false, status: 500, error: "Error tras múltiples intentos." };
}

/**
 * Helper para convertir el resultado de la pasarela en una `Response` HTTP
 * cuando la edge function quiere reenviar el error tal cual al cliente.
 */
export function gatewayErrorResponse(
  result: AIGatewayFailure,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Limpia bloques ```json ... ``` que algunos modelos siguen añadiendo
 * incluso con response_format. Tolerante a markdown previo/posterior.
 * Memoria: "AI Sanitization standard".
 */
export function stripJsonFences(raw: string): string {
  if (!raw) return raw;
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export function safeParseJson<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(stripJsonFences(raw)) as T;
  } catch {
    return null;
  }
}
