import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, safeParseJson } from "../_shared/ai-gateway.ts";
import { composeSystemPrompt, checkIntegrity } from "../_shared/ai-guardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidate_profile, job_description, job_title, skills_required } = await req.json();

    const rolePrompt = `Experto en reclutamiento gastronómico. Calcula compatibilidad entre el candidato y la oferta usando SOLO la información provista. No inventes experiencia, certificaciones ni datos que el candidato no declaró.
Responde JSON: { match_score (0-100), summary (3-4 oraciones), strengths: [string], weaknesses: [string] }`;

    const systemPrompt = composeSystemPrompt({
      guardrails: { jsonOutput: true, domain: "reclutamiento gastronómico" },
      rolePrompt,
    });

    const userPrompt = `OFERTA: ${job_title}
Descripción: ${job_description}
Habilidades requeridas: ${(skills_required || []).join(', ')}

CANDIDATO:
Nombre: ${candidate_profile.full_name}
Titular: ${candidate_profile.headline || 'No especificado'}
Bio: ${candidate_profile.bio || 'No especificado'}
Años experiencia: ${candidate_profile.years_experience || 0}
Habilidades: ${(candidate_profile.skills || []).join(', ')}
Certificaciones: ${(candidate_profile.certifications || []).join(', ')}
Ciudad: ${candidate_profile.city || 'N/E'}`;

    const aiResult = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tier: "fast",
      temperature: 0.3,
      jsonMode: true,
      logPrefix: "[job-ai-profile]",
    });
    const fallback = { match_score: 50, summary: "", strengths: [], weaknesses: [] };
    const result = aiResult.ok
      ? (safeParseJson(aiResult.content) ?? { ...fallback, summary: aiResult.content })
      : fallback;

    const integrity = aiResult.ok ? checkIntegrity(aiResult.content, false) : null;

    return new Response(JSON.stringify({
      ...result,
      meta: {
        web_research: { enabled: false, provider: "none", sources_count: 0 },
        integrity,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
