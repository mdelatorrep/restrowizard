import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, safeParseJson } from "../_shared/ai-gateway.ts";
import { webResearch, formatSourcesForPrompt } from "../_shared/web-research.ts";
import { composeSystemPrompt, checkIntegrity } from "../_shared/ai-guardrails.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupplierRequest {
  itemName: string;
  currentCost: number;
  currentSupplier?: string;
  unit: string;
  city: string;
  country?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { itemName, currentCost, currentSupplier, unit, city, country = 'México' }: SupplierRequest = await req.json();

    if (!itemName || !city) {
      return new Response(
        JSON.stringify({ error: 'itemName and city are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing suppliers for: ${itemName} in ${city}, ${country}`);

    // Pluggable web research (Firecrawl / Gemini grounding cuando esté activo).
    const research = await webResearch(
      `proveedores mayoristas "${itemName}" central de abastos ${city} ${country} precios`,
      { limit: 5, scrape: true, country: country?.slice(0, 2).toLowerCase(), logPrefix: "[supplier-analyzer]" },
    );

    const rolePrompt = `Eres un experto en cadena de suministro de alimentos para restaurantes en ${country}.
Tu trabajo es identificar proveedores alternativos REALES y verificables para "${itemName}" en ${city}.

Si el CONTEXTO WEB tiene fuentes: extrae proveedores reales con sus datos de contacto y precios.
Si NO hay fuentes: NO inventes proveedores. Devuelve la lista vacía y explica en market_insights qué tipo de búsqueda local hacer.

Responde SIEMPRE en JSON válido con este esquema exacto:
{
  "suppliers": [
    {
      "name": "string",
      "type": "central_abastos|mayorista|distribuidor|productor",
      "estimated_price": number|null,
      "unit": "${unit}",
      "savings_percent": number,
      "contact": { "phone": "string|null", "address": "string|null", "hours": "string|null", "email": "string|null" },
      "source_url": "URL del CONTEXTO WEB que respalda este proveedor",
      "confidence": "high|medium|low",
      "notes": "string"
    }
  ],
  "market_insights": "string (cita [Fuente N])",
  "recommendations": ["string"],
  "average_market_price": number|null,
  "best_season": "string|null",
  "confidence": 0-100,
  "sources_used": ["urls"]
}`;

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: true, requireConfidence: true, domain: "proveedores B2B de alimentos" },
      rolePrompt,
      webContextBlock: formatSourcesForPrompt(research),
    });

    const userPrompt = `Necesito proveedores alternativos para:
- Producto: ${itemName}
- Costo actual: $${currentCost} por ${unit}
${currentSupplier ? `- Proveedor actual: ${currentSupplier}` : ''}
- Ciudad: ${city}, ${country}

Cada proveedor que listes DEBE tener un source_url del CONTEXTO WEB. Si no hay fuentes verificables, devuelve suppliers: [] y explícalo.`;

    const aiResult = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tier: "reasoning",
      maxTokens: 2500,
      jsonMode: true,
      logPrefix: "[supplier-analyzer]",
    });

    if (!aiResult.ok) {
      return new Response(
        JSON.stringify({ error: aiResult.error, success: false }),
        { status: aiResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const analysisResult = safeParseJson<any>(aiResult.content) ?? {
      suppliers: [],
      market_insights: "Información no disponible — requiere verificación. Consulta directamente la central de abastos local.",
      recommendations: ["Visitar la central de abastos local", "Contactar distribuidores de la zona"],
      average_market_price: null,
      best_season: null,
      confidence: 0,
      sources_used: [],
    };

    const integrity = checkIntegrity(aiResult.content, research.enabled);
    const potentialSavings = analysisResult.suppliers?.reduce(
      (m: number, s: any) => Math.max(m, s.savings_percent || 0),
      0,
    ) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysisResult,
          potential_savings: potentialSavings,
          analyzed_at: new Date().toISOString(),
        },
        meta: {
          web_research: { enabled: research.enabled, provider: research.provider, sources_count: research.sources.length },
          integrity,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Supplier analyzer error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
